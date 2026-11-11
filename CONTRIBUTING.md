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

The linkml-map transforms that convert mapping formats into the FAIR Mappings Schema, and the slot-level SSSOM sets that document them, live in [fair-mappings-schema](https://github.com/mapping-commons/fair-mappings-schema) (`src/fair_mappings_schema/transformations/` and `src/fair_mappings_schema/mappings/`). That repository is their source of truth, and this one only registers them. Currently supported:

| Format | Transform | Source type |
|--------|-----------|-------------|
| SSSOM | <https://w3id.org/fair-map/transforms/sssom-to-fair> | `mapping set` |
| LinkML-Map | <https://w3id.org/fair-map/transforms/linkmlmap-to-fair> | `TransformationSpecification` |

To add support for a new mapping format:

1. **Add the transform** (and its slot-level SSSOM set) to fair-mappings-schema, following the [linkml-map specification](https://linkml.io/linkml-map/). The transform maps your format's metadata to `MappingSpecification` fields.

2. **Give it a PURL** under `https://w3id.org/fair-map/transforms/` in the [w3id `fair-map` config](https://github.com/perma-id/w3id.org/tree/master/ids/fair-map).

3. **Register it** in `registry.yml` by that PURL:

   ```yaml
   mapping_set_references:
     - mapping_set_id: https://w3id.org/fair-map/transforms/myformat-to-fair
       mapping_set_group: fair-mappings-transforms
       local_name: myformat-to-fair.transformation.yaml
   ```

4. **Update `scripts/cli.py`** to handle the new format if it requires different fetching/parsing logic.

## Local development

```bash
# Prerequisites: uv, just
just all    # Full ETL
just serve  # Local server at http://localhost:8080
```

## Questions?

Open an [issue](https://github.com/mapping-commons/mapping-commons.github.io/issues).
