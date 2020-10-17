import { airgram } from '@/plugins/tdweb'
import { TOP_CHAT_CATEGORY, CHATS } from '@airgram/api'
const { topChatCategoryUsers } = TOP_CHAT_CATEGORY

export const searchPlugin = options => {
  const namespace = [options.namespace, 'search']

  const state = {
    tops: [],
    recently: [],
    savedMessages: [], // Self conversation
    chats: [],
    publicChats: [],
    messages: [],
    searchIn: null,
    messagesCount: 0
  }

  const mutations = {
    INITIALIZE(state, newState) {
      state.tops = newState.tops
      state.recently = newState.recently
      state.savedMessages = newState.savedMessages
    },
    SET_CHATS(state, chats) {
      state.chats = chats.chatIds
    },
    setSearchIn(state, chatId) {
      state.searchIn = chatId
    },
    SET_PUBLIC_CHATS(state, publicChats) {
      state.publicChats = publicChats.chatIds
    },
    SET_MESSAGES(state, messages) {
      state.messages = messages.messages
      state.messagesCount = messages.totalCount
    },
    SET_TOP_CHATS(state, chats) {
      state.tops = chats.chatIds
    }
  }

  const getters = {}

  const actions = {
    async load({ commit, state }) {
      const userId = state.rootState[options.namespace].user.id
      const defaultOnCatch = () => ({ _: CHATS.chats, chatIds: [] })

      const promises = [
        airgram.api
          .getTopChats({
            category: {
              _: topChatCategoryUsers
            },
            limit: 5
          })
          .catch(defaultOnCatch),
        airgram.api.searchChats({ query: '', limit: 5 }).catch(defaultOnCatch),
        airgram.api.createPrivateChat({ userId, force: true }).catch(() => ({}))
      ]

      const [tops, recently, savedMessages] = await Promise.all(promises)
      commit('INITIALIZE', { tops, recently, savedMessages })
    },
    async searchTop({ commit }) {
      const locals = await airgram.api
        .getTopChats({
          category: {
            _: topChatCategoryUsers
          },
          limit: 5
        })
        .catch(() => null)
      commit('SET_TOP_CHATS', locals)
    },
    async searchChats({ commit }, options = {}) {
      const defaults = { query: '', limit: 5 }
      const locals = await airgram.api
        .searchChats({ ...defaults, ...options })
        .catch(() => null)
      commit('SET_CHATS', locals)
    },
    async searchPublicChats({ commit }, options = { query: '' }) {
      const publicChats = await airgram.api.searchPublicChats(options)
      commit('SET_PUBLIC_CHATS', publicChats)
    },
    async searchMessages({ commit }, options = {}) {
      const defaults = {
        query: '',
        offsetDate: 0,
        offsetChatId: 0,
        offsetMessageId: 0,
        limit: 20
      }
      const messages = await airgram.api
        .searchMessages({ ...defaults, ...options })
        .catch(() => null)
      commit('SET_MESSAGES', messages)
    },
    async searchChatMessage({ commit }, options = {}) {
      const defaults = {
        query: '',
        chatId: null,
        senderUserId: 0,
        fromMessageId: 0,
        offset: 0,
        limit: 20,
        filter: null
      }
      const messages = await airgram.api
        .searchChatMessages({ ...defaults, ...options })
        .catch(() => null)
      commit('SET_MESSAGES', messages)
    },
    async searchAll({ state, dispatch }, options = { query: '' }) {
      const query = options.query
      await dispatch('searchTop')
      await dispatch('searchChats', { query })
      await dispatch('searchPublicChats', { query })
      if (state.searchIn) {
        await dispatch('searchChatMessage', { query, chatId: state.searchIn })
      } else {
        await dispatch('searchMessages', { query })
      }
    }
  }
  return [
    {
      namespaced: true,
      state,
      getters,
      mutations,
      actions
    },
    namespace
  ]
}
