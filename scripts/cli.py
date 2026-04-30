import click
import yaml
import requests
import json
import gzip
import io
import os
import logging
import traceback
from datetime import datetime, timezone

from fair_mappings_schema.parsing import parse_sssom_tsv, transform_to_fair, load_mapping
from fair_mappings_schema.scoring import score_instance
from fair_mappings_schema.schema import get_schema_view

logger = logging.getLogger(__name__)

# Shared session with a browser-like User-Agent so that hosts such as
# GitLab don't reject requests from GitHub Actions runners.
_session = requests.Session()
_session.headers["User-Agent"] = (
    "mapping-commons-registry/1.0 "
    "(+https://github.com/mapping-commons/mapping-commons.github.io)"
)


def _registry_info(registry_data: dict) -> dict:
    """Extract registry metadata from a registry YAML dict."""
    return {
        k: v for k, v in {
            "id": registry_data.get("mapping_registry_id"),
            "name": registry_data.get("mapping_registry_title") or registry_data.get("registry_title"),
            "url": registry_data.get("homepage"),
        }.items() if v is not None
    }


def _iter_gz_lines(response: requests.Response):
    """Yield decompressed text lines from a gzipped HTTP response, streaming."""
    decompressor = gzip.GzipFile(fileobj=response.raw)
    reader = io.TextIOWrapper(decompressor, encoding="utf-8")
    for line in reader:
        yield line.rstrip("\n")


def _classify_error(error: Exception) -> str:
    """Classify a mapping set processing error into a status string."""
    error_msg = str(error).lower()
    if "bytes-like object" in error_msg:
        return "nonstandard_format"
    if "no #-commented header" in error_msg:
        return "no_metadata"
    if "http" in error_msg and any(c.isdigit() for c in error_msg):
        return "fetch_error"
    if "connection" in error_msg or "remote end closed" in error_msg:
        return "fetch_error"
    return "no_metadata"


def _stub_spec(mapping_set_id: str, status: str) -> dict:
    """Create a minimal spec entry for a mapping set that could not be parsed."""
    return {
        "id": mapping_set_id,
        "content_url": mapping_set_id,
        "type": "sssom",
        "status": status,
    }


def _process_sssom_mapping_set(mapping_set_id: str, mapping_set_uri: str) -> dict | None:
    """Fetch, parse, and transform a single SSSOM mapping set.

    Raises on any error so the caller can log context and skip.
    """
    response = _session.get(mapping_set_uri, stream=True)
    if response.status_code != 200:
        raise RuntimeError(f"HTTP {response.status_code} fetching {mapping_set_uri}")

    try:
        if mapping_set_uri.endswith(".gz"):
            lines = _iter_gz_lines(response)
        else:
            lines = response.iter_lines(decode_unicode=True)
        meta = parse_sssom_tsv(lines)
    finally:
        response.close()

    if "mapping_set_id" not in meta:
        meta["mapping_set_id"] = mapping_set_id

    spec = transform_to_fair(meta, "sssom")

    if not spec.get("content_url"):
        spec["content_url"] = mapping_set_id

    return spec


def _process_transform_registry(registry_path: str) -> list[dict]:
    """Process local transform specs in registry.yml as browsable entries."""
    with open(registry_path) as f:
        registry = yaml.safe_load(f)

    info = _registry_info(registry)
    base_dir = os.path.dirname(registry_path)
    search_dirs = ["transforms", "mappings"]
    specs = []

    for ref in registry.get("mapping_set_references", []):
        local_name = ref.get("local_name")
        if not local_name:
            continue

        # Find the file in one of the search directories
        input_file = None
        for d in search_dirs:
            candidate = os.path.join(base_dir, d, local_name)
            if os.path.exists(candidate):
                input_file = candidate
                break
        if not input_file:
            click.echo(f"File not found: {local_name} (searched {search_dirs})", err=True)
            continue

        # Detect mapping type from file extension
        mapping_type = "sssom" if local_name.endswith(".sssom.tsv") else "linkml_map"

        try:
            spec = load_mapping(input_file, mapping_type)
            spec["registries"] = [info]
            specs.append(spec)
        except Exception as e:
            click.echo(f"Transform failed for {local_name}: {e}", err=True)

    return specs


@click.group()
def cli():
    """Mapping Registry CLI."""
    pass


@cli.command()
@click.argument("registry_file", type=click.Path(exists=True))
@click.argument("output_file", type=click.Path(writable=True))
@click.option("--log-file", default="data/etl-errors.log",
              help="Path to write error log")
def prepare_mapping_registry(registry_file, output_file, log_file):
    """
    Fetch SSSOM mapping sets from registries, transform each to a
    MappingSpecification, compute metadata completeness scores, and write JSON.

    Non-conformant files are logged and skipped.
    """
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    file_handler = logging.FileHandler(log_file, mode="w")
    file_handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logger.addHandler(file_handler)
    logger.setLevel(logging.INFO)
    logger.info("ETL started at %s", datetime.now(timezone.utc).isoformat())

    with open(registry_file) as f:
        main_registry = yaml.safe_load(f)

    specifications = []

    for registry in main_registry.get("registries", []):
        registry_id = registry.get("id")
        registry_uri = registry.get("url")

        response = _session.get(registry_uri)
        if response.status_code != 200:
            msg = f"Error fetching registry file: {registry_uri} (HTTP {response.status_code})"
            logger.error(msg)
            raise click.ClickException(msg)

        registry_data = yaml.safe_load(response.text)
        info = _registry_info(registry_data)

        for mapping_set in registry_data.get("mapping_set_references", []):
            mapping_set_id = mapping_set.get("mapping_set_id")
            mapping_set_uri = mapping_set.get("mirror_from", mapping_set_id)
            registry_title = info.get("name", "untitled")

            try:
                spec = _process_sssom_mapping_set(mapping_set_id, mapping_set_uri)
                if spec:
                    spec.setdefault("registries", []).append(info)
                    spec.setdefault("status", "ok")
                    specifications.append(spec)
                else:
                    stub = _stub_spec(mapping_set_id, "no_metadata")
                    stub["registries"] = [info]
                    specifications.append(stub)
                    logger.warning(
                        "STUB mapping_set_id=%s | registry=%s (%s) | status=no_metadata | reason=empty result",
                        mapping_set_id, registry_id, registry_title,
                    )
            except Exception as e:
                status = _classify_error(e)
                stub = _stub_spec(mapping_set_id, status)
                stub["registries"] = [info]
                specifications.append(stub)
                logger.warning(
                    "STUB mapping_set_id=%s | registry=%s (%s) | status=%s | reason=%s",
                    mapping_set_id, registry_id, registry_title, status, e,
                )
                click.echo(f"Stub for {mapping_set_id} (registry: {registry_id}, status: {status}): {e}", err=True)

    # Local transform registry
    transform_registry = os.path.join(os.path.dirname(registry_file), "registry.yml")
    if os.path.exists(transform_registry):
        specifications.extend(_process_transform_registry(transform_registry))

    # Metadata completeness scores
    sv = get_schema_view()
    for spec in specifications:
        if spec.get("status", "ok") == "ok":
            spec["metadata_completeness_score"] = score_instance(spec, sv=sv)["fair_score"]
        else:
            spec["metadata_completeness_score"] = 0.0

    with open(output_file, "w") as f:
        json.dump(specifications, f, indent=2)

    stubs = sum(1 for s in specifications if s.get("status") != "ok")
    summary = f"Generated {len(specifications)} MappingSpecification records to {output_file}"
    if stubs:
        summary += f" ({stubs} with incomplete metadata, see {log_file})"
    click.echo(summary)
    logger.info(summary)


@cli.command()
@click.argument("input_file", type=click.Path(exists=True))
@click.argument("mapping_type")
@click.argument("output_file", type=click.Path(writable=True))
def transform_single(input_file, mapping_type, output_file):
    """Transform a single input file to a MappingSpecification."""
    spec = load_mapping(input_file, mapping_type)
    with open(output_file, "w") as f:
        yaml.dump(spec, f, default_flow_style=False)
    click.echo(f"Transformed {input_file} -> {output_file}")


if __name__ == "__main__":
    cli()
