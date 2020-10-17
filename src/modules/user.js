import Vue from 'vue'
import { airgram } from '@/plugins/tdweb'
import { UPDATE, CHAT_TYPE } from '@airgram/api'

const {
  updateUser,
  updateUserChatAction,
  updateUserStatus,
  updateOption,
  updateSupergroup,
  updateBasicGroup,

  updateUserFullInfo,
  updateBasicGroupFullInfo,
  updateSupergroupFullInfo
} = UPDATE
const { chatTypeBasicGroup, chatTypeSupergroup, chatTypePrivate } = CHAT_TYPE

export const userPlugin = (options, store) => {
  const namespace = [options.namespace, 'user']
  const namespaced = update => namespace.concat(update).join('/')

  const state = {
    myId: null,
    // Simple info
    userItems: {},
    basicGroupItems: {},
    supergroupItems: {},
    // Full info
    userFullInfoItems: {},
    basicGroupFullInfoItems: {},
    supergroupFullInfoItems: {},
    // Actions
    userChatActions: {}
  }

  const mutations = {
    [updateUser]: (state, user) => {
      Vue.set(state.userItems, user.id, user)
    },
    [updateSupergroup]: (state, supergroup) => {
      Vue.set(state.supergroupItems, supergroup.id, supergroup)
    },
    setMyId: (state, myId) => {
      state.myId = myId
    },
    [updateBasicGroup]: (state, basicGroup) => {
      Vue.set(state.basicGroupItems, basicGroup.id, basicGroup)
    },
    [updateUserFullInfo]: (st, { userId, userFullInfo }) => {
      Vue.set(st.userFullInfoItems, userId, userFullInfo)
    },
    [updateSupergroupFullInfo]: (st, { supergroupId, supergroupFullInfo }) => {
      Vue.set(st.supergroupFullInfoItems, supergroupId, supergroupFullInfo)
    },
    [updateBasicGroupFullInfo]: (st, { basicGroupId, basicGroupFullInfo }) => {
      Vue.set(st.basicGroupFullInfoItems, basicGroupId, basicGroupFullInfo)
    },
    // eslint-disable-next-line no-unused-vars
    [updateUserStatus]: (state, { userId, _, ...updates }) => {
      state.userItems[userId] = { ...state.userItems[userId], ...updates }
    },
    [updateUserChatAction]: (state, { userId, chatId, action }) => {
      Vue.set(state.userChatActions, String([chatId, userId]), action)
    }
  }

  const getUser = state => chat => {
    if (typeof chat === 'number') return state.userItems[chat] || null

    let userType = null

    if (chat.type._ === chatTypePrivate)
      userType = state.userItems[chat.type.userId]
    if (chat.type._ === chatTypeSupergroup)
      userType = state.supergroupItems[chat.type.supergroupId]
    if (chat.type._ === chatTypeBasicGroup)
      userType = state.basicGroupItems[chat.type.basicGroupId]

    return userType || null
  }

  const getters = {
    getGroupMemberCount: state => chat => {
      if (!chat || !chat.type) {
        console.warn("Cannot return the number of members, unless it's a chat")
        return 0
      }
      let memberCount = 0
      if (chat.type._ === chatTypeSupergroup) {
        memberCount = state.supergroupItems[chat.type.supergroupId].memberCount
      }
      if (chat.type._ === chatTypeBasicGroup) {
        memberCount = state.basicGroupItems[chat.type.basicGroupId].memberCount
      }
      return Number.isInteger(memberCount) ? memberCount : 0
    },
    getFullInfo: state => chat => {
      if (chat.type._ === chatTypePrivate) {
        return state.userFullInfoItems[chat.type.userId] || null
      } else if (chat.type._ === chatTypeSupergroup) {
        return state.supergroupFullInfoItems[chat.type.supergroupId] || null
      } else if (chat.type._ === chatTypeBasicGroup) {
        return state.basicGroupFullInfoItems[chat.type.basicGroupId] || null
      }
    },
    getUsername: state => chat => {
      if (!chat) return ''
      const user = getUser(state)(chat)
      if (!user) return ''
      return user.username || ''
    },
    getUser
  }

  const actions = {
    async loadFullInfo(_, chat) {
      if (chat.type._ === chatTypePrivate) {
        await airgram.api.getUserFullInfo({
          userId: chat.type.userId
        })
      } else if (chat.type._ === chatTypeSupergroup) {
        await airgram.api.getSupergroupFullInfo({
          supergroupId: chat.type.supergroupId
        })
      } else if (chat.type._ === chatTypeBasicGroup) {
        await airgram.api.getBasicGroupFullInfo({
          basicGroupId: chat.type.basicGroupId
        })
      }
    }
  }

  airgram.updates.on(updateOption, ctx => {
    if (ctx.update.name === 'my_id') {
      store.commit(namespaced('setMyId'), ctx.update.value.value)
    }
  })

  airgram.updates.on([updateUser, updateSupergroup, updateBasicGroup], ctx => {
    const obj = {
      [updateUser]: 'user',
      [updateSupergroup]: 'supergroup',
      [updateBasicGroup]: 'basicGroup'
    }[ctx._]
    store.commit(namespaced(ctx._), ctx.update[obj])
  })
  airgram.updates.on(
    [updateUserFullInfo, updateSupergroupFullInfo, updateBasicGroupFullInfo],
    ctx => {
      store.commit(namespaced(ctx._), ctx.update)
    }
  )
  airgram.updates.on([updateUserStatus, updateUserChatAction], ctx => {
    store.commit(namespaced(ctx._), ctx.update)
  })

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
