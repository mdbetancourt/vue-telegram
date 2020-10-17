import Vue from 'vue'
import Vuetify from 'vuetify/lib/framework'
import { Scroll } from 'vuetify/lib/directives/scroll'

Vue.use(Vuetify, {
  directives: {
    Scroll
  }
})

export default new Vuetify({
  icons: {
    iconfont: 'mdiSvg'
  },
  theme: {
    options: {
      customProperties: true
    }
  }
})
