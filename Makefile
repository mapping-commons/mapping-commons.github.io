all: data/mapping-data.json

data/mapping-data.json:
	python3 scripts/cli.py prepare-mapping-registry mapping-server.yml $@