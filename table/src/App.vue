<template>
  <div id="app">
    <div id="table-container">
      <VueBootstrapTable :columns='columns'
                         :values='mappings'
                         :show-filter=true
                         :selectable=false>
      </VueBootstrapTable>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import YAML from 'yamljs'
import VueBootstrapTable from 'vue2-bootstrap-table2'

export default {
  name: 'App',
  components: {
    VueBootstrapTable: VueBootstrapTable
  },
  data () {
    return {
      mappings: [],
      columns: [
        {
          name: 'mapping_set_id',
          title: 'ID'
        },
        {
          name: 'mapping_set_group',
          title: 'Group'
        },
        {
          name: 'mapping_set_title',
          title: 'Title'
        },
        {
          name: 'mapping_set_description',
          title: 'Description'
        },
        {
          name: 'creator_id',
          title: 'Creator ID'
        },
        {
          name: 'curie_map',
          title: 'CURIE Map'
        },
        {
          name: 'license',
          title: 'License'
        },
        {
          name: 'mapping_provider',
          title: 'Mapping Provider'
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
