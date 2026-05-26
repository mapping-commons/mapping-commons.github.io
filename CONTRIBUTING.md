# Contributing to Mapping Commons Registry

## How mappings get into the registry

The registry aggregates mapping metadata from external **mapping registries** listed in [`mapping-server.yml`](mapping-server.yml). Each registry points to a YAML file that lists individual mapping sets (typically SSSOM TSV files). During the ETL, each mapping set's metadata is extracted and transformed into the [FAIR Mappings Schema](https://github.com/mapping-commons/fair-mappings-schema) using [linkml-map](https://github.com/linkml/linkml-map).

```
mapping-server.yml
  └── external registry YAML (e.g. registry.yml in another repo)
        └── mapping_set_references
              └── SSSOM TSV files (metadata extracted, not the mappings themselves)
              └── linkml-map transform → MappingSpecification JSON
```

## Register an external mapping registry

To add a new mapping registry to the Mapping Commons:

1. **Create a registry YAML file** in your mapping repository. Follow the [SSSOM registry format](https://mapping-commons.github.io/sssom/spec/#mapping-set-registry):

   ```yaml
   mapping_registry_id: https://example.org/my-mappings
   registry_title: My Mapping Project
   registry_description: Mappings between X and Y
   homepage: https://github.com/org/my-mappings
   documentation: https://github.com/org/my-mappings/blob/main/README.md

   mapping_set_references:
     - mapping_set_id: https://example.org/my-mappings/foo_bar.sssom.tsv
       mapping_set_group: my_group
       local_name: foo_bar.sssom.tsv
   ```

2. **Ensure your SSSOM files have good metadata** in their headers. The following fields are extracted:
   - `mapping_set_id` (required) — unique identifier
   - `mapping_set_title` — displayed as the mapping name
   - `mapping_set_description` — shown in search results
   - `license` — e.g. `https://creativecommons.org/publicdomain/zero/1.0/`
   - `mapping_set_version`
   - `subject_source` / `object_source` — what's being mapped (see [docs/per_mapping_source.md](docs/per_mapping_source.md) if your sources vary per mapping)
   - `mapping_tool` — how the mappings were created
   - `publication_date`

3. **Open a PR** to add your registry to `mapping-server.yml`:

   ```yaml
   registries:
     # ... existing entries ...
     - id: my-mappings
       uri: https://raw.githubusercontent.com/org/my-mappings/main/registry.yml
   ```

4. The CI will automatically fetch your registry, extract metadata from each mapping set, and include it in the site.

## Add a new transform specification

This repository is the source of truth for linkml-map transforms that convert mapping formats into the FAIR Mappings Schema. Currently supported:

| Format | Transform file | Source type |
|--------|---------------|-------------|
| SSSOM | `transforms/sssom-to-fair.transformation.yaml` | `mapping set` |
| LinkML-Map | `transforms/linkmlmap-to-fair.transformation.yaml` | `TransformationSpecification` |

To add support for a new mapping format:

1. **Create a transform file** in `transforms/` following the [linkml-map specification](https://linkml.io/linkml-map/). The transform should map your format's metadata to `MappingSpecification` fields.

2. **Register it** in `registry.yml`:

   ```yaml
   transform_references:
     - id: https://w3id.org/linkml/transformer/myformat-to-fair-mappings
       title: MyFormat to FAIR Mappings Schema
       description: Transforms MyFormat metadata to FAIR Mappings Schema
       local_name: myformat-to-fair.transformation.yaml
       source_format: myformat
       source_schema_url: https://example.org/myformat-schema.yaml
       source_type: MyRootClass
   ```

3. **Update `scripts/cli.py`** to handle the new format if it requires different fetching/parsing logic.

4. **Test locally**:

   ```bash
   just transform-sssom my-input.yaml my-output.yaml   # for SSSOM
   just transform-linkmlmap my-input.yaml my-output.yaml  # for LinkML-Map
   ```

## Local development

```bash
# Prerequisites: uv, just
just all    # Full ETL
just serve  # Local server at http://localhost:8080
```

## Questions?

Open an [issue](https://github.com/mapping-commons/mapping-commons.github.io/issues).
