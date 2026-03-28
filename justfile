# Mapping Commons Registry - Build & ETL

# Schema download URLs
SSSOM_SCHEMA_URL := "https://raw.githubusercontent.com/mapping-commons/sssom/refs/heads/master/src/sssom_schema/schema/sssom_schema.yaml"
LINKMLMAP_SCHEMA_URL := "https://raw.githubusercontent.com/linkml/linkml-map/refs/heads/main/src/linkml_map/datamodel/transformer_model.yaml"
FAIR_SCHEMA_URL := "https://raw.githubusercontent.com/mapping-commons/fair-mappings-schema/refs/heads/main/src/fair_mappings_schema/schema/fair_mappings_schema.yaml"

# Default recipe: run the full ETL
default: all

# Full ETL: setup, download schemas, transform data, ready to deploy
all: setup schemas data

# Install Python dependencies via uv
setup:
    uv sync

# Download source schemas needed by linkml-map transforms
schemas: setup
    mkdir -p tmp
    curl -sSL "{{SSSOM_SCHEMA_URL}}" -o tmp/sssom-schema.yaml
    curl -sSL "{{LINKMLMAP_SCHEMA_URL}}" -o tmp/linkml-map-schema.yaml
    curl -sSL "{{FAIR_SCHEMA_URL}}" -o tmp/fair-mappings-schema.yaml

# Run the ETL: fetch registries, transform SSSOM metadata to FAIR Mappings Schema
data: schemas
    uv run python3 scripts/cli.py prepare-mapping-registry \
        mapping-server.yml \
        data/mapping-specifications.json \
        --sssom-transform transforms/sssom-to-fair.transformation.yaml \
        --sssom-schema tmp/sssom-schema.yaml \
        --linkmlmap-schema tmp/linkml-map-schema.yaml

# Transform a single SSSOM instance (usage: just transform-sssom input.yaml output.yaml)
transform-sssom input output: schemas
    uv run python3 scripts/cli.py transform-single \
        transforms/sssom-to-fair.transformation.yaml \
        tmp/sssom-schema.yaml \
        "mapping set" \
        {{input}} {{output}}

# Transform a single LinkML-Map instance (usage: just transform-linkmlmap input.yaml output.yaml)
transform-linkmlmap input output: schemas
    uv run python3 scripts/cli.py transform-single \
        transforms/linkmlmap-to-fair.transformation.yaml \
        tmp/linkml-map-schema.yaml \
        TransformationSpecification \
        {{input}} {{output}}

# Serve the site locally for development
serve:
    cd site && python3 -m http.server 8080

# Clean generated files
clean:
    rm -rf tmp/ data/mapping-specifications.json .venv/
