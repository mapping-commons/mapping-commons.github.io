
.PHONY: download_mappings

download_mappings: ./mappings/mapping-server.yml ./mappings/mappings.yml

./mappings/mapping-server.yml:
	wget https://raw.githubusercontent.com/mapping-commons/mapping-commons.github.io/main/mapping-server.yml -P ./mappings/

./mappings/mappings.yml: ./mappings/mapping-server.yml
	python scripts/read_mapping_registry_metadata.py --registry $< --metadata $@
	cp $@ table-component/public/

.DEFAULT_GOAL: download_mappings
