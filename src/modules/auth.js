import { AUTHORIZATION_STATE, UPDATE } from '@airgram/api'
import { airgram } from '@/plugins/tdweb'

const {
  authorizationStateWaitPhoneNumber,
  authorizationStateReady,
  authorizationStateWaitCode
} = AUTHORIZATION_STATE

export const authPlugin = (options, store) => {
  const namespace = [options.namespace, 'auth']
  const namespaced = update => namespace.concat(update).join('/')

  const state = {
    current: authorizationStateWaitPhoneNumber,
    isRegistered: null,
    codeInfo: null,
    user: null
  }

  const mutations = {
    [UPDATE.updateAuthorizationState]: (state, newState) => {
      state.current = newState
    },
    updateRegisterState: (state, newState) => {
      state.isRegistered = newState !== undefined ? newState : null
    },
    updateCodeInfo: (state, newState) => {
      state.codeInfo = newState
    },
    reset: state => {
      state.current = authorizationStateWaitPhoneNumber
      state.isRegistered = null
      state.codeInfo = null
      state.user = null
    }
  }

  const getters = {
    isLoggedIn: state => {
      return (
        !!localStorage.isLoggedIn || state.current === authorizationStateReady
      )
    },
    codeLength: ({ codeInfo }) =>
      (codeInfo && codeInfo.type && codeInfo.type.length) || 0,
    codeType: ({ codeInfo }) =>
      (codeInfo && codeInfo.type && state.codeInfo.type._) || null
  }

  airgram.updates.on(UPDATE.updateAuthorizationState, (ctx, next) => {
    const state = ctx.update.authorizationState

    store.commit(namespaced(UPDATE.updateAuthorizationState), state._)

    if (state._ === authorizationStateWaitCode) {
      store.commit(namespaced('updateRegisterState'), state.isRegistered)
      store.commit(namespaced('updateCodeInfo'), state.codeInfo)
    }

    next()
  })

  return [
    {
      namespaced: true,
      state,
      getters,
      mutations
    },
    namespace
  ]
}
