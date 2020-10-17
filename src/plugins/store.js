import Vue from 'vue'
import Vuex from 'vuex'
import createPlugin from '@/modules'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    viewer: {
      namespaced: true,
      state: {
        messageInViewer: null,
        filterBy: null
      },
      mutations: {
        setMessageToViewer(state, payload) {
          if (payload !== null) {
            state.messageInViewer = payload.messageId
            state.filterBy = payload.filterBy
          } else {
            state.messageInViewer = null
            state.filterBy = null
          }
        }
      }
    },
    config: {
      namespaced: true,
      state: {
        showPanelInfo: false,
        modalInfoChatId: 0
      },
      mutations: {
        togglePanelInfo(state) {
          state.showPanelInfo = !state.showPanelInfo
        },
        setModalInfoChatId(state, chatId) {
          state.modalInfoChatId = chatId
        }
      }
    },
    audio: {
      namespaced: true,
      state: {
        playlist: {},
        current: null,
        paused: true,
        time: 0,
        playbackRate: 1,
        volume: 1
      },
      mutations: {
        changeVolume(state, volume) {
          let newVolume
          if (volume > 1) newVolume = 1
          else if (volume < 0) newVolume = 0
          else newVolume = volume
          state.volume = newVolume
        },
        changePlaybackRate(state, rate) {
          state.playbackRate = rate
        },
        changeTime(state, time) {
          state.time = time
        },
        changeTrack(state, value) {
          state.current = value
          state.paused = true
          state.time = 0
        },
        nextTrack(state) {
          if (state.current === state.playlist.length - 1) {
            state.current = 0
          } else {
            state.current += 1
          }
          state.paused = true
          state.time = 0
        },
        previousTrack(state) {
          if (state.current === 0) {
            state.current = state.length - 1
          } else {
            state.current -= 1
          }
          state.paused = true
          state.time = 0
        },
        changePause(state, value) {
          state.paused = value
        },
        loadedSuccessfully(state) {
          state.playlist[state.current].loaded = true
        },
        addTrack(state, { id, track }) {
          Vue.set(state.playlist, id, { ...track, loaded: false })
        },
        clearPlaylist(state) {
          Vue.set(state, 'playlist', {})
        }
      }
    }
  },
  plugins: [createPlugin()]
})
