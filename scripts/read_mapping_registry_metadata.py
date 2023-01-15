"""read_mapping_registry_metadata"""
from pathlib import Path

import click
import requests
import yaml
from yaml.loader import SafeLoader


def init_metadata_file(metadata):
    """clear_file"""
    Path(metadata).unlink(missing_ok=True)
    return Path(metadata)

def download_metadata(url, metadata_file):
    """init_metadata_file"""
    req = requests.get(url, allow_redirects=True, timeout=60)
    with open(metadata_file, 'a', encoding='utf-8') as reg_file:
        reg_file.write(req.text)


def parse_mapping(mapping_file):
    """read_mapping"""
    with open(mapping_file, encoding='utf-8') as file:
        return yaml.load(file, Loader=SafeLoader)

@click.command()
@click.option('--registry', help='Registry File.')
@click.option('--metadata', help='Metadata')
def main(registry, metadata):
    """main"""
    metadata_file = init_metadata_file(metadata)
    registry_data = parse_mapping(registry)
    for reg in registry_data['registries']:
        download_metadata(reg['uri'], metadata_file)

if __name__ == "__main__":
    main()
