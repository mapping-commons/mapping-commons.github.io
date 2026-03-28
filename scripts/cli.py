import click
import yaml
import requests
import json
import os
import logging
import traceback
import tempfile
from datetime import datetime, timezone
from io import StringIO

from linkml_map.transformer.object_transformer import ObjectTransformer
from linkml_runtime.utils.schemaview import SchemaView

logger = logging.getLogger(__name__)


# Minimal TSV row appended to header so sssom-py can parse it
def parse_sssom_header(header_lines: list[str], tsv_lines: list[str]) -> dict:
    """Parse SSSOM header + first TSV row into a metadata dict using sssom-py.

    Feeds the raw #-prefixed header, the TSV column header, and the first data
    row to parse_sssom_table so sssom-py handles all parsing.
    """
    from sssom.parsers import parse_sssom_table

    content = "\n".join(header_lines + tsv_lines) + "\n"
    msdf = parse_sssom_table(StringIO(content))
    return msdf.metadata


def create_sssom_transformer(transform_path: str, schema_path: str) -> ObjectTransformer:
    """Create a reusable ObjectTransformer for SSSOM → FAIR Mappings."""
    tr = ObjectTransformer(unrestricted_eval=True)
    tr.source_schemaview = SchemaView(schema_path)
    tr.load_transformer_specification(transform_path)
    return tr


def create_linkmlmap_transformer(transform_path: str, schema_path: str) -> ObjectTransformer:
    """Create a reusable ObjectTransformer for LinkML-Map → FAIR Mappings."""
    tr = ObjectTransformer(unrestricted_eval=True)
    tr.source_schemaview = SchemaView(schema_path)
    tr.load_transformer_specification(transform_path)
    return tr


def transform_object(transformer: ObjectTransformer, input_obj: dict, source_type: str) -> dict | None:
    """Run a linkml-map transform on a single object, return result dict."""
    try:
        transformer.index(input_obj, source_type)
        result = transformer.map_object(input_obj, source_type)
        if result:
            return {k: v for k, v in result.items() if v is not None}
    except Exception as e:
        click.echo(f"Transform error: {e}", err=True)
    return None


def enrich_spec(spec: dict, input_meta: dict,
                registry_title: str = None, registry_homepage: str = None,
                registry_documentation: str = None, mapping_set_id: str = None,
                mapping_set_group: str = None) -> dict:
    """Enrich a transformed MappingSpecification with data not carried by the transform."""
    if not spec.get("documentation") and (registry_documentation or registry_homepage):
        spec["documentation"] = registry_documentation or registry_homepage
    if not spec.get("content_url") and mapping_set_id:
        spec["content_url"] = mapping_set_id
    if registry_title and not spec.get("creator"):
        spec["creator"] = {
            "name": registry_title,
            "type": "Organization",
            "url": registry_homepage,
        }
    if not spec.get("mapping_method") and mapping_set_group:
        spec["mapping_method"] = mapping_set_group

    return spec


def process_transform_registry(registry_path: str, linkmlmap_schema: str) -> list:
    """Process local transform specs listed in registry.yml through
    the linkmlmap-to-fair transform to include them as browsable entries."""
    with open(registry_path) as f:
        registry = yaml.safe_load(f)

    specs = []
    transforms_dir = os.path.join(os.path.dirname(registry_path), "transforms")
    linkmlmap_transform = os.path.join(transforms_dir, "linkmlmap-to-fair.transformation.yaml")

    if not os.path.exists(linkmlmap_transform) or not os.path.exists(linkmlmap_schema):
        click.echo("Skipping transform registry: transform or schema not found", err=True)
        return specs

    transformer = create_linkmlmap_transformer(linkmlmap_transform, linkmlmap_schema)

    for ref in registry.get("mapping_set_references", []):
        local_name = ref.get("local_name")
        if not local_name:
            continue

        input_file = os.path.join(transforms_dir, local_name)
        if not os.path.exists(input_file):
            click.echo(f"Transform file not found: {input_file}", err=True)
            continue

        # Load and strip fields that cause dynamic_object bugs in linkml-map
        with open(input_file) as f:
            spec_data = yaml.safe_load(f)
        for key in ["class_derivations", "enum_derivations", "slot_derivations",
                     "copy_directives", "schema_patches", "prefixes"]:
            spec_data.pop(key, None)

        result = transform_object(transformer, spec_data, "TransformationSpecification")
        if result:
            if not result.get("type"):
                result["type"] = "linkml-map"
            # Set proper source names from the transform metadata
            source_schema = spec_data.get("source_schema", "")
            target_schema = spec_data.get("target_schema", "")
            result["subject_source"] = {"name": os.path.basename(source_schema)}
            result["object_source"] = {
                "name": "FAIR Mappings Schema",
                "content_url": "https://github.com/mapping-commons/fair-mappings-schema",
            }
            result = {k: v for k, v in result.items() if v is not None}
            specs.append(result)
        else:
            click.echo(f"Transform failed for: {local_name}", err=True)

    return specs


@click.group()
def cli():
    """Mapping Registry CLI."""
    pass


@cli.command()
@click.argument("registry_file", type=click.Path(exists=True))
@click.argument("output_file", type=click.Path(writable=True))
@click.option("--sssom-transform", default="transforms/sssom-to-fair.transformation.yaml",
              help="Path to SSSOM-to-FAIR transformation spec")
@click.option("--sssom-schema", default="tmp/sssom-schema.yaml",
              help="Path to SSSOM schema YAML")
@click.option("--linkmlmap-schema", default="tmp/linkml-map-schema.yaml",
              help="Path to LinkML-Map schema YAML")
@click.option("--log-file", default="data/etl-errors.log",
              help="Path to write error log")
def prepare_mapping_registry(registry_file, output_file, sssom_transform, sssom_schema, linkmlmap_schema, log_file):
    """
    Parse a YAML registry file, fetch SSSOM mapping set headers, and transform
    each to a FAIR Mappings Schema MappingSpecification using linkml-map.

    Only the #-commented metadata header of each SSSOM TSV is downloaded/parsed,
    not the full mapping data. Non-conformant files are logged and skipped.

    REGISTRY_FILE: Path to the main YAML registry file.
    OUTPUT_FILE: Path to save the combined output JSON.
    """
    # Set up file logging
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    file_handler = logging.FileHandler(log_file, mode="w")
    file_handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logger.addHandler(file_handler)
    logger.setLevel(logging.INFO)

    logger.info("ETL started at %s", datetime.now(timezone.utc).isoformat())

    with open(registry_file, "r") as f:
        main_registry = yaml.safe_load(f)

    specifications = []
    skipped = 0
    transformer = create_sssom_transformer(sssom_transform, sssom_schema)

    for registry in main_registry.get("registries", []):
        registry_id = registry.get("id")
        registry_uri = registry.get("uri")

        response = requests.get(registry_uri)
        if response.status_code != 200:
            msg = f"Error fetching registry file: {registry_uri} (HTTP {response.status_code})"
            click.echo(msg, err=True)
            logger.error(msg)
            continue

        registry_data = yaml.safe_load(response.text)
        registry_title = registry_data.get("mapping_registry_title") or registry_data.get("registry_title")
        registry_homepage = registry_data.get("homepage")
        registry_documentation = registry_data.get("documentation")

        for mapping_set in registry_data.get("mapping_set_references", []):
            mapping_set_id = mapping_set.get("mapping_set_id")
            mapping_set_uri = mapping_set.get("mirror_from", mapping_set_id)

            try:
                spec = _process_sssom_mapping_set(
                    transformer=transformer,
                    mapping_set_id=mapping_set_id,
                    mapping_set_uri=mapping_set_uri,
                    mapping_set_group=mapping_set.get("mapping_set_group"),
                    registry_title=registry_title,
                    registry_homepage=registry_homepage,
                    registry_documentation=registry_documentation,
                )
                if spec:
                    specifications.append(spec)
                else:
                    skipped += 1
                    logger.warning(
                        "SKIPPED mapping_set_id=%s | registry=%s (%s) | reason=transform returned empty result",
                        mapping_set_id, registry_id, registry_title or "untitled",
                    )
            except Exception as e:
                skipped += 1
                logger.error(
                    "SKIPPED mapping_set_id=%s | registry=%s (%s) | reason=%s\n%s",
                    mapping_set_id, registry_id, registry_title or "untitled",
                    e, traceback.format_exc(),
                )
                click.echo(f"Skipping {mapping_set_id} (registry: {registry_id}): {e}", err=True)

    # Process local transform registry
    transform_registry_path = os.path.join(os.path.dirname(registry_file), "registry.yml")
    if os.path.exists(transform_registry_path):
        specifications.extend(
            process_transform_registry(transform_registry_path, linkmlmap_schema)
        )

    with open(output_file, "w") as f:
        json.dump(specifications, f, indent=2)

    summary = f"Generated {len(specifications)} MappingSpecification records to {output_file}"
    if skipped:
        summary += f" ({skipped} mapping sets skipped, see {log_file})"
    click.echo(summary)
    logger.info(summary)


def _process_sssom_mapping_set(
    transformer, mapping_set_id, mapping_set_uri,
    mapping_set_group, registry_title, registry_homepage, registry_documentation,
) -> dict | None:
    """Fetch, parse, and transform a single SSSOM mapping set. Returns spec dict or None.

    Raises on any error so the caller can log context and skip.
    """
    mapping_response = requests.get(mapping_set_uri, stream=True)
    if mapping_response.status_code != 200:
        raise RuntimeError(f"HTTP {mapping_response.status_code} fetching {mapping_set_uri}")

    # Read the #-commented header + TSV column header + first data row
    header_lines = []
    tsv_lines = []
    for line in mapping_response.iter_lines(decode_unicode=True):
        if line.startswith("#"):
            header_lines.append(line)
        elif line.strip() == "":
            continue
        else:
            tsv_lines.append(line)
            if len(tsv_lines) == 2:  # column header + one data row
                break
    mapping_response.close()

    if not header_lines:
        raise RuntimeError("No #-commented header found in SSSOM file")

    meta = parse_sssom_header(header_lines, tsv_lines)

    if "mapping_set_id" not in meta:
        meta["mapping_set_id"] = mapping_set_id

    spec = transform_object(transformer, meta, "mapping set")
    if not spec:
        return None

    return enrich_spec(
        spec, meta,
        registry_title=registry_title,
        registry_homepage=registry_homepage,
        registry_documentation=registry_documentation,
        mapping_set_id=mapping_set_id,
        mapping_set_group=mapping_set_group,
    )


@cli.command()
@click.argument("transform_file", type=click.Path(exists=True))
@click.argument("source_schema", type=click.Path(exists=True))
@click.argument("source_type")
@click.argument("input_file", type=click.Path(exists=True))
@click.argument("output_file", type=click.Path(writable=True))
def transform_single(transform_file, source_schema, source_type, input_file, output_file):
    """
    Transform a single input file to FAIR Mappings Schema using linkml-map.

    Useful for transforming individual LinkML-Map or SSSOM instances.
    """
    tr = ObjectTransformer(unrestricted_eval=True)
    tr.source_schemaview = SchemaView(source_schema)
    tr.load_transformer_specification(transform_file)

    with open(input_file) as f:
        input_obj = yaml.safe_load(f)

    tr.index(input_obj, source_type)
    result = tr.map_object(input_obj, source_type)

    if result:
        with open(output_file, "w") as f:
            yaml.dump(result, f, default_flow_style=False)
        click.echo(f"Transformed {input_file} -> {output_file}")
    else:
        raise click.ClickException(f"Transform failed for {input_file}")


if __name__ == "__main__":
    cli()
