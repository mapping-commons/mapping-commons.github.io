import Vue from 'vue'
import App from './App.vue'
import axios from 'axios'
import VueAxios from 'vue-axios'

// import { BootstrapVue, IconsPlugin } from 'bootstrap-vue/dist/bootstrap-vue.esm'

Vue.use(VueAxios, axios)

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')
