import Vue from 'vue'
import { airgram } from '@/plugins/tdweb'
import { UPDATE, SEARCH_MESSAGES_FILTER } from '@airgram/api'

const {
  updateNewChat,
  updateChatLastMessage
  // updateMessageMentionRead,
  // updateUserChatAction,
} = UPDATE
const {
  searchMessagesFilterPhoto,
  searchMessagesFilterVideo,
  searchMessagesFilterDocument,
  searchMessagesFilterAudio,
  searchMessagesFilterUrl,
  searchMessagesFilterVoiceNote
} = SEARCH_MESSAGES_FILTER

export const chatPlugin = (options, store) => {
  const namespace = [options.namespace, 'chat']
  const chatUpdates = Object.values(UPDATE).filter(name =>
    name.startsWith('updateChat')
  )
  const namespaced = update => namespace.concat(update).join('/')

  const state = {
    chatItems: {},
    currentChat: null,
    currentMessage: null,
    mediaFiltered: {
      [searchMessagesFilterPhoto]: {
        totalCount: 0,
        messages: []
      },
      [searchMessagesFilterVideo]: {
        totalCount: 0,
        messages: []
      },
      [searchMessagesFilterDocument]: {
        totalCount: 0,
        messages: []
      },
      [searchMessagesFilterAudio]: {
        totalCount: 0,
        messages: []
      },
      [searchMessagesFilterUrl]: {
        totalCount: 0,
        messages: []
      },
      [searchMessagesFilterVoiceNote]: {
        totalCount: 0,
        messages: []
      }
    }
  }

  // eslint-disable-next-line no-unused-vars
  const handleChat = (state, { chatId, _, ...updates }) => {
    state.chatItems[chatId] = { ...state.chatItems[chatId], ...updates }
  }

  const mutations = {
    [updateNewChat]: (state, chat) => {
      Vue.set(state.chatItems, chat.id, chat)
    },
    setFilter: (state, { type, messages }) => {
      state.mediaFiltered[type].totalCount = messages.totalCount
      Vue.set(state.mediaFiltered[type], 'messages', messages.messages)
    },
    changeCurrentChat: (state, id) => {
      state.currentChat = id
    },
    changeCurrentMessage: (state, message) => {
      state.currentMessage = message
    },
    ...Object.fromEntries(chatUpdates.map(v => [v, handleChat])),
    // Must be after from entries because override updateChatLastMessage
    // eslint-disable-next-line no-unused-vars
    [updateChatLastMessage]: (state, { chatId, _, ...updates }) => {
      state.chatItems[chatId] = {
        ...state.chatItems[chatId],
        lastMessage: undefined, // remove lastMessage when delete last message
        ...updates
      }
    }
  }
  const compareChat = (a, b) => {
    let diff = a.order.length - b.order.length
    if (diff !== 0) return diff < 0 ? 1 : -1
    if (a.order === b.order) {
      return a.id < b.id ? 1 : -1
    }

    return a.order < b.order ? 1 : -1
  }
  const getters = {
    sortedChats: state => Object.values(state.chatItems).sort(compareChat),
    getChat: state => chatId => state.chatItems[chatId] || null,
    getFilteredMessages: state => type => state.mediaFiltered[type] || null
  }

  const actions = {
    async filterMessages({ state, commit }, { messageId, type }) {
      const messages = await airgram.api.searchChatMessages({
        chatId: state.currentChat,
        filter: {
          _: type
        },
        fromMessageId: messageId,
        limit: 60,
        offset: -30,
        query: '',
        senderUserId: 0
      })
      commit('setFilter', { type, messages })
    },
    async changeChat({ state, commit }, chatId) {
      if (state.currentChat)
        await airgram.api.closeChat({ chatId: state.currentChat })
      if (chatId) await airgram.api.openChat({ chatId })
      commit('changeCurrentChat', chatId ? chatId : null)
      commit('changeCurrentMessage', null)
    },
    async openChat(_, chatId) {
      await airgram.api.openChat({ chatId })
    },
    async closeChat({ commit }, chatId) {
      await airgram.api.closeChat({ chatId })
      commit('changeCurrentChat', null)
    }
  }

  airgram.updates.on(updateNewChat, ctx => {
    const state = ctx.update.chat
    store.commit(namespaced(updateNewChat), state)
  })
  airgram.updates.on(chatUpdates, ctx => {
    store.commit(namespaced(ctx._), ctx.update)
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
