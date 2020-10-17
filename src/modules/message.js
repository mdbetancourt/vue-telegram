import Vue from 'vue'
import { airgram } from '@/plugins/tdweb'
import { UPDATE } from '@airgram/api'

const {
  updateNewMessage,
  updateMessageContent,
  updateMessageEdited,
  updateMessageSendSucceeded,
  updateDeleteMessages
  //   updateChatPinnedMessage
} = UPDATE

export const messagePlugin = (options, store) => {
  const namespace = [options.namespace, 'message']
  const namespaced = update => namespace.concat(update).join('/')

  const state = {
    messageItems: {},
    messageMissings: []
  }

  const mutations = {
    [updateNewMessage]: (state, { message, noCount }) => {
      if (state.messageItems[message.chatId])
        Vue.set(state.messageItems[message.chatId], message.id, message)
      else
        Vue.set(state.messageItems, message.chatId, { [message.id]: message })
      if (!noCount) state.messageItems[message.chatId].totalCount += 1
    },
    updateDoesNotExists: (state, id) => {
      state.messageMissings.push(id)
    },
    [updateMessageContent]: (state, { chatId, messageId, newContent }) => {
      if (state.messageItems[chatId])
        Vue.set(state.messageItems[chatId], messageId, {
          ...state.messageItems[chatId][messageId],
          content: newContent
        })
    },
    [updateMessageEdited]: (state, { chatId, messageId, ...updates }) => {
      if (state.messageItems[chatId])
        Vue.set(state.messageItems[chatId], messageId, {
          ...state.messageItems[chatId][messageId],
          ...updates
        })
    },
    [updateDeleteMessages]: (state, { chatId, messageIds }) => {
      messageIds.map(messageId => {
        if (messageId in state.messageItems[chatId])
          Vue.delete(state.messageItems[chatId], messageId)
      })
    },
    [updateMessageSendSucceeded]: (state, { oldMessageId, message }) => {
      if (!state.messageItems[message.chatId]) return
      if (!state.messageItems[message.chatId][oldMessageId]) return
      Vue.delete(state.messageItems[message.chatId], oldMessageId)
      Vue.set(state.messageItems[message.chatId], message.id, message)
    },
    updateMessageCount: (state, { chatId, count }) => {
      if (state.messageItems[chatId])
        Vue.set(state.messageItems[chatId], 'totalCount', count)
      else Vue.set(state.messageItems, chatId, { totalCount: 0 })
    }
  }

  const getters = {
    getMessages: state => chatId => {
      if (!state.messageItems[chatId]) return []
      // eslint-disable-next-line no-unused-vars
      const { totalCount, ...messages } = state.messageItems[chatId]
      return messages ? Object.values(messages) : []
    },
    getMessage: state => (chatId, messageId) => {
      if (!state.messageItems[chatId]) return []
      // eslint-disable-next-line no-unused-vars
      const message = state.messageItems[chatId][messageId]
      return message || null
    },
    getMessagesCount: state => chatId => {
      if (!state.messageItems[chatId]) return 0
      const { totalCount } = state.messageItems[chatId]
      return totalCount ? totalCount : 0
    }
  }

  const actions = {
    getChatHistory: async function({ commit, state }, options) {
      const mergedOptions = {
        limit: 30,
        offset: 0,
        fromMessageId: 0,
        ...options
      }
      let history = await airgram.api.getChatHistory(mergedOptions)
      if (history.messages && history.messages.length) {
        history.messages.map(message =>
          commit(updateNewMessage, { message, noCount: true })
        )
        const messages = state.messageItems[options.chatId]
        const messageIds = history.messages
          .filter(
            msg => msg.replyToMessageId && !(msg.replyToMessageId in messages)
          )
          .map(msg => msg.replyToMessageId)
        if (!messageIds.length) return history
        const response = await airgram.api.getMessages({
          chatId: options.chatId,
          messageIds
        })
        const newMessages = response.messages.filter(msg => !!msg)
        const newIds = newMessages.map(msg => msg.id)
        const missings = messageIds.filter(msg => !newIds.includes(msg))
        missings.map(id => commit('updateDoesNotExists', id))
        newMessages.map(message => commit(updateNewMessage, { message }))
      }
      return history
    }
  }

  airgram.updates.on(
    [
      updateNewMessage,
      updateMessageContent,
      updateMessageEdited,
      updateMessageSendSucceeded,
      updateDeleteMessages
    ],
    ctx => {
      store.commit(namespaced(ctx._), ctx.update)
    }
  )
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
