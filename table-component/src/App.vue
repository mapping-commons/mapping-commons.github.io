<template>
  <div id="app">
    <v-app id="inspire">
      <v-card>
        <v-card-title>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search"
            :search="search"
            single-line
            hide-details
          ></v-text-field>
        </v-card-title>

        <v-data-table
          :headers="headers"
          :items="mappings"
          :items-per-page="-1"
          class="elevation-1"
          :search="search"
        >
          <template #item.mapping_set_id="{ item }">
            <a target="_blank" :href="`${item.mapping_set_id}`">
              {{ item.mapping_set_id }}
            </a>
          </template>
          <template #item.mapping_set_group="{ item }">
            {{ item.mapping_set_group }}
          </template>
          <template #item.registry_title="{ item }">
            {{ item.registry_title }}
          </template>
          <template #item.license="{ item }">
            <a target="_blank" :href="`${item.license}`">
              {{ item.license }}
            </a>
          </template>
          <template #item.mapping_provider="{ item }">
            <a target="_blank" :href="`${item.mapping_provider}`">
              {{ item.mapping_provider }}
            </a>
          </template>
          <template #item.mapping_set_description="{ item }">
            {{ item.mapping_set_description }}
          </template>
        </v-data-table>
      </v-card>
    </v-app>
  </div>
</template>

<script>
import axios from "axios";
import YAML from "yamljs";
import Papa from "papaparse";
export default {
  name: "App",
  components: {},
  data() {
    return {
      search: "",
      mappings: [],
      headers: [
        {
          text: "ID",
          align: "start",
          sortable: true,
          value: "mapping_set_id"
        },
        {
          value: "mapping_set_group",
          text: "Group",
          sortable: true
        },
        {
          value: "registry_title",
          text: "Title",
          sortable: true
        },
        {
          value: "license",
          text: "License",
          sortable: true
        },
        {
          value: "mapping_provider",
          text: "Mapping Provider",
          sortable: true
        },
        {
          value: "mapping_set_description",
          text: "Mapping Set Description",
          sortable: true
        }
      ]
    };
  },
  // methods: {
  //   filter(value, search, item) {
  //     return (
  //       value != null &&
  //       search != null &&
  //       typeof value === "string" &&
  //       value.toString().indexOf(search) !== -1
  //     );
  //   }
  // },
  mounted() {
    const papaConf = {
      header: true,
      delimiter: "\t",
      skipEmptyLines: true
    };
    const startByValue = (path, obj = self, prefix = "") => {
      try {
        const properties = Array.isArray(path) ? path : path.split(".");
        const ret = properties.reduce((prev, curr) => {
          return obj.filter(e => {
            const values = Object.values(e)[0];
            const x = values.startsWith(prev) || values.startsWith(curr);
            return x;
          });
        });
        return Object.values(ret[ret.length - 1])[0].replace(prefix, "");
      } catch (err) {
        return "";
      }
    };
    axios
      .get(
        "https://raw.githubusercontent.com/mapping-commons/mapping-commons.github.io/main/mapping-server.yml"
      )
      .then(response => {
        const registryList = YAML.parse(response.data);
        registryList.registries = registryList.registries || [];
        registryList.registries.forEach(registryEntry => {
          axios.get(registryEntry.uri).then(response => {
            const registry = YAML.parse(response.data);
            registry.mappings = registry.mappings || [];
            registry.mapping_set_references.forEach(mapping => {
              axios.get(mapping.mapping_set_id).then(response => {
                Papa.parse(response.data, {
                  ...papaConf,
                  complete: tsv => {
                    const tsvparsed = {
                      license: startByValue(
                        "# curie_map.# license: ",
                        tsv.data,
                        "# license: "
                      ),
                      creator_id: startByValue(
                        "# creator_id:.",
                        tsv.data,
                        "# creator_id: "
                      ),
                      mapping_provider: startByValue(
                        "# curie_map.# mapping_provider:",
                        tsv.data,
                        "# mapping_provider: "
                      ),
                      mapping_set_description: startByValue(
                        "# curie_map.# mapping_set_description:",
                        tsv.data,
                        "# mapping_set_description: "
                      )
                    };
                    const obj = Object.assign({}, tsvparsed, mapping, registry);
                    this.mappings.push(obj);
                  }
                });
              });
            });
          });
        });
      });
  }
};
</script>

<style>
#app {
  .v-data-table-header th {
    font-size: 16px;
  }
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
  margin-left: 15px;
  margin-right: 15px;
}
</style>
