import { authPlugin } from './auth'
import { searchPlugin } from './search'
import { userPlugin } from './user'
import { chatPlugin } from './chat'
import { messagePlugin } from './message'
import { mediaPlugin } from './media'

export default function createPlugin(options = { namespace: 'tdlib' }) {
  return store => {
    store.registerModule(options.namespace, { namespaced: true })
    const modules = [
      authPlugin(options, store),
      userPlugin(options, store),
      searchPlugin(options, store),
      chatPlugin(options, store),
      messagePlugin(options, store),
      mediaPlugin(options, store)
    ]
    modules.map(([mod, ns]) => store.registerModule(ns, mod))

    if (module.hot) {
      module.hot.accept(
        ['./auth', './chat', './media', './message', './search', './user'],
        () => {
          const [auth] = require('./auth').authPlugin
          const [chat] = require('./chat').chatPlugin
          const [media] = require('./media').mediaPlugin
          const [message] = require('./message').messagePlugin
          const [search] = require('./search').searchPlugin
          const [user] = require('./user').userPlugin
          store.hotUpdate({
            modules: {
              [options.namespace]: {
                auth,
                chat,
                media,
                message,
                search,
                user
              }
            }
          })
        }
      )
    }
  }
}
