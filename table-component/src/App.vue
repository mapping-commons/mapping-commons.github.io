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
    axios
      .get(
        "https://raw.githubusercontent.com/mapping-commons/mapping-commons.github.io/refs/heads/main/data/mapping-data.json"
      )
      .then(response => {
        const registries = [];
        response.data.registries.forEach(registry => {
          registries.push(registry?.mapping_sets);
        });
        this.mappings = registries.flat();
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
