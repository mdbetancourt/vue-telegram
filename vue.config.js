const path = require('path')

module.exports = {
  chainWebpack: config => {
    config.plugin('copy').tap(options => {
      options[0].push({ from: path.resolve('node_modules/tdweb/dist') })
      return options
    })
    config.plugin('VuetifyLoaderPlugin').tap(() => {
      return [
        {
          match(_, { camelTag, kebabTag }) {
            if (kebabTag.startsWith('c-')) {
              return [
                camelTag,
                `import ${camelTag} from '@/components/${camelTag.substring(
                  1
                )}.vue'`
              ]
            }
          }
        }
      ]
    })
  }
}
