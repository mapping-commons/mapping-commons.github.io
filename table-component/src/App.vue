<template>
  <div id='app'>
    <b-container>
      <div>
        <b-form-input
          id='filter-input'
          v-model='filter'
          type='search'
          placeholder='Type to Search'
        ></b-form-input>
      </div>
      <div id='table-container'>
        <b-table :items='mappings' :fields='fields' :filter='filter' responsive>
        </b-table>
      </div>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'
import YAML from 'yamljs'
import Papa from 'papaparse'
export default {
  name: 'App',
  components: {},
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
          key: 'registry_title',
          label: 'Title',
          sortable: true
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
        },
        {
          key: 'mapping_set_description',
          title: 'Mapping Set Description',
          sortable: true
        }
      ]
    }
  },
  mounted () {
    const papaConf = {
      header: true,
      delimiter: '\t',
      skipEmptyLines: true
    }
    const startByValue = (path, obj = self, prefix = '') => {
      try {
        const properties = Array.isArray(path) ? path : path.split('.')
        const ret = properties.reduce((prev, curr) => {
          return obj.filter(e => {
            const values = Object.values(e)[0]
            const x = values.startsWith(prev) || values.startsWith(curr)
            return x
          })
        })
        return Object.values(ret[ret.length - 1])[0].replace(prefix, '')
      } catch (err) {
        return ''
      }
    }
    axios
      .get('/mappings.yml')
      .then(response => {
        const registry = YAML.parse(response.data)
        registry.mappings = registry.mappings || []
        registry.mapping_set_references.forEach(mapping => {
          axios.get(mapping.mapping_set_id).then(response => {
            Papa.parse(response.data, {
              ...papaConf,
              complete: tsv => {
                const tsvparsed = {
                  license: startByValue(
                    '# curie_map.# license: ',
                    tsv.data,
                    '# license: '
                  ),
                  creator_id: startByValue(
                    '# creator_id:.',
                    tsv.data,
                    '# creator_id: '
                  ),
                  mapping_provider: startByValue(
                    '# curie_map.# mapping_provider:',
                    tsv.data,
                    '# mapping_provider: '
                  ),
                  mapping_set_description: startByValue(
                    '# curie_map.# mapping_set_description:',
                    tsv.data,
                    '# mapping_set_description: '
                  )
                }
                const obj = Object.assign({}, tsvparsed, mapping, registry)
                this.mappings.push(obj)
              }
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
