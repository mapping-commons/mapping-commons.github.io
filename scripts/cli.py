import click
import yaml
import requests
import json
from sssom.parsers import parse_sssom_table
from io import StringIO

@click.group()
def cli():
    """Mapping Registry CLI."""
    pass

@cli.command()
@click.argument("registry_file", type=click.Path(exists=True))
@click.argument("output_file", type=click.Path(writable=True))
def prepare_mapping_registry(registry_file, output_file):
    """
    Parse a YAML registry file, load individual registry files,
    download mapping sets, and create a combined JSON structure.

    REGISTRY_FILE: Path to the main YAML registry file.
    OUTPUT_FILE: Path to save the combined output JSON.
    """
    # Load the main registry YAML file
    with open(registry_file, 'r') as f:
        main_registry = yaml.safe_load(f)

    combined_data = {
        "iri": main_registry.get("iri"),
        "title": main_registry.get("title"),
        "registries": []
    }

    for registry in main_registry.get("registries", []):
        registry_id = registry.get("id")
        registry_uri = registry.get("uri")
        
        # Fetch and parse individual registry YAML file
        response = requests.get(registry_uri)
        if response.status_code != 200:
            click.echo(f"Error fetching registry file: {registry_uri}", err=True)
            continue

        registry_data = yaml.safe_load(response.text)
        registry_entry = {
            "registry_id": registry_id,
            "registry_title": registry_data.get("registry_title"),
            "registry_description": registry_data.get("registry_description"),
            "homepage": registry_data.get("homepage"),
            "documentation": registry_data.get("documentation"),
            "mapping_sets": []
        }

        # Load mapping sets
        for mapping_set in registry_data.get("mapping_set_references", []):
            mapping_set_id = mapping_set.get("mapping_set_id")
            mapping_set_uri = mapping_set.get("mirror_from", mapping_set_id)

            # Download the mapping set
            mapping_response = requests.get(mapping_set_uri)
            if mapping_response.status_code != 200:
                click.echo(f"Error fetching mapping set: {mapping_set_uri}", err=True)
                continue

            # Parse mapping set using SSSOM
            mapping_table = parse_sssom_table(StringIO(mapping_response.text))
            mapping_set_version = mapping_table.metadata.get("mapping_set_version")

            # Add to registry entry
            registry_entry["mapping_sets"].append({
                "mapping_set_id": mapping_set_id,
                "mapping_set_group": mapping_set.get("mapping_set_group"),
                "registry_confidence": mapping_set.get("registry_confidence"),
                "local_name": mapping_set.get("local_name"),
                "mapping_set_version": mapping_set_version
            })

        # Add registry entry to combined data
        combined_data["registries"].append(registry_entry)

    # Save combined data as JSON
    with open(output_file, 'w') as f:
        json.dump(combined_data, f, indent=4)

    click.echo(f"Combined JSON structure saved to {output_file}")

if __name__ == "__main__":
    cli()
