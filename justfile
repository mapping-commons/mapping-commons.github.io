# Mapping Commons Registry - Build & ETL

# Default recipe: run the full ETL
default: all

# Full ETL: setup, transform data, ready to deploy
all: setup data

# Install Python dependencies via uv
setup:
    uv sync

# Run the ETL: fetch registries, transform SSSOM metadata to FAIR Mappings Schema
data: setup
    uv run python3 scripts/cli.py prepare-mapping-registry \
        mapping-server.yml \
        data/mapping-specifications.json

# Transform a single file (usage: just transform input.yaml sssom output.yaml)
transform input mapping_type output: setup
    uv run python3 scripts/cli.py transform-single \
        {{input}} {{mapping_type}} {{output}}

# Validate the generated mapping specifications against the FAIR Mappings Schema
validate: data
    uv run linkml-validate -s tmp/fair-mappings-schema.yaml data/mapping-specifications.json

# Serve the site locally for development
serve:
    cd site && python3 -m http.server 8080

# Clean generated files
clean:
    rm -rf tmp/ data/mapping-specifications.json .venv/
