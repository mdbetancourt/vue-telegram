import { airgram } from '@/plugins/tdweb'
import { UPDATE } from '@airgram/api'

const { updateFile } = UPDATE

export const mediaPlugin = (options, store) => {
  const namespace = [options.namespace, 'media']

  const state = {
    mediaItems: {}
  }

  const mutations = {
    [updateFile]: (state, file) =>
      (state.mediaItems = { ...state.mediaItems, [file.id]: file })
  }

  const getters = {}

  const actions = {
    async downloadFile(_, { id, priority }) {
      await airgram.api.downloadFile({ fileId: id, priority })
    },
    async getFile({ commit }, fileId) {
      const file = await airgram.api.getFile({ fileId })
      commit(updateFile, file)
    }
  }

  airgram.updates.on(updateFile, (ctx, next) => {
    const state = ctx.update.file
    const namespaced = update => namespace.concat(update).join('/')
    store.commit(namespaced(updateFile), state)
    next()
  })
  return [
    {
      namespaced: true,
      state,
      getters,
      actions,
      mutations
    },
    namespace
  ]
}
