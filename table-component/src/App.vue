<template>
  <div id="app">
    <b-container>
      <div>
        <b-form-input
              id="filter-input"
              v-model="filter"
              type="search"
              placeholder="Type to Search"
            ></b-form-input>
      </div>
      <div id="table-container">
        <b-table :items="mappings"
                 :fields="fields"
                 :filter="filter"
                 responsive
                 > </b-table>
      </div>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'
import YAML from 'yamljs'

export default {
  name: 'App',
  components: {
  },
  data () {
    return {
      filter: '',
      mappings: [],
      fields: [
        {
          key: 'mapping_set_id',
          label: 'ID',
          sortable: true
        },
        {
          key: 'mapping_set_group',
          label: 'Group',
          sortable: true
        },
        {
          key: 'mapping_set_title',
          label: 'Title',
          sortable: true
        },
        {
          key: 'mapping_set_description',
          label: 'Description',
          sortable: true
        },
        {
          key: 'creator_id',
          label: 'Creator ID',
          sortable: true
        },
        {
          key: 'curie_map',
          label: 'CURIE Map'
        },
        {
          key: 'license',
          label: 'License',
          sortable: true
        },
        {
          key: 'mapping_provider',
          title: 'Mapping Provider',
          sortable: true
        }
      ]
    }
  },
  mounted () {
    axios.get('https://raw.githubusercontent.com/mapping-commons/mapping-commons.github.io/main/mapping-server.yml')
      .then(response => {
        const registryList = YAML.parse(response.data)
        registryList.registries.forEach(registryEntry => {
          axios.get(registryEntry.uri).then(response => {
            const registry = YAML.parse(response.data)
            registry.mappings.forEach(mapping => {
              this.mappings.push(mapping)
            })
          })
        })
      })
  }

}
</script>

<style>
  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
    margin-top: 60px;
    margin-left: 15px;
    margin-right: 15px;
  }
</style>
