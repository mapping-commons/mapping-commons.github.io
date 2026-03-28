# Mapping Commons Registry

A searchable registry of FAIR mapping specifications, powered by the [FAIR Mappings Schema](https://github.com/mapping-commons/fair-mappings-schema).

**Live site:** [mapping-commons.github.io](https://mapping-commons.github.io)

## Overview

This repository:

- Aggregates mapping metadata from multiple registries listed in [`mapping-server.yml`](mapping-server.yml)
- Transforms SSSOM and LinkML-Map metadata into the FAIR Mappings Schema using [linkml-map](https://github.com/linkml/linkml-map)
- Serves a static search/browse interface on GitHub Pages

The transform specifications in [`transforms/`](transforms/) are the source of truth for translating existing mapping formats into the FAIR Mappings Schema. See [`registry.yml`](registry.yml) for the full list.

## Local development

Requires [uv](https://docs.astral.sh/uv/) and [just](https://github.com/casey/just).

```bash
# Full ETL: install deps, download schemas, transform data
just all

# Serve the site locally
just serve
```

Other commands:

| Command | Description |
|---------|-------------|
| `just setup` | Install Python dependencies |
| `just schemas` | Download source schemas |
| `just data` | Run the ETL pipeline |
| `just transform-sssom input.yaml output.yaml` | Transform a single SSSOM file |
| `just transform-linkmlmap input.yaml output.yaml` | Transform a single LinkML-Map file |
| `just clean` | Remove generated files |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add mappings or register external mapping registries.

## License

See [LICENSE](LICENSE).
