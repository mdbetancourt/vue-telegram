<template>
  <v-toolbar v-if="fileId" flat dense>
    <c-file-loader :key="fileId" v-slot="{ source }" :file-id="fileId">
      <audio
        v-if="source"
        ref="audioComponent"
        :src="source"
        @pause="changePause(true)"
        @canplay="load"
        @timeupdate="changeTime($event.target.currentTime)"
      />
    </c-file-loader>
    <v-btn icon small>
      <v-icon size="22">{{ mdiSkipPrevious }}</v-icon>
    </v-btn>
    <v-btn icon small @click="changePause(!paused)">
      <v-icon size="22" color="primary">
        {{ paused ? mdiPlay : mdiPause }}
      </v-icon>
    </v-btn>
    <v-btn icon small>
      <v-icon size="22">{{ mdiSkipNext }}</v-icon>
    </v-btn>

    <v-spacer />
    <v-toolbar-title class="body-1">{{ formattedTime }}</v-toolbar-title>

    <v-menu
      offset-y
      open-on-hover
      auto
      content-class="overflow-visible no-shadow"
      :close-on-content-click="false"
      :open-on-click="false"
    >
      <template v-slot:activator="{ on }">
        <v-btn icon small v-on="on" @click="toggleMute">
          <v-icon size="20">{{ audioIcon }}</v-icon>
        </v-btn>
      </template>
      <v-card flat outlined>
        <v-slider
          :value="volume"
          min="0"
          max="1"
          thumb-color="transparent"
          step="0.1"
          vertical
          @input="changeVolume($event)"
        />
      </v-card>
    </v-menu>
    <v-btn icon small @click="toggleX2Rate">
      <v-icon size="20">
        {{ playbackRate === 2 ? mdiPlay : mdiStepForward2 }}
      </v-icon>
    </v-btn>
    <v-btn icon small @click="clearPlaylist">
      <v-icon size="20">{{ mdiClose }}</v-icon>
    </v-btn>
  </v-toolbar>
</template>
<style>
.v-menu__content.no-shadow {
  box-shadow: none;
}
</style>
<script>
import {
  mdiPlay,
  mdiPause,
  mdiSkipNext,
  mdiSkipPrevious,
  mdiStepForward2,
  mdiSpeaker,
  mdiVolumeHigh,
  mdiVolumeLow,
  mdiVolumeMedium,
  mdiClose,
  mdiVolumeOff,
  mdiSpeakerOff
} from '@mdi/js'
import { mapMutations, mapState } from 'vuex'

export default {
  data() {
    const icons = {
      mdiPlay,
      mdiPause,
      mdiSkipPrevious,
      mdiClose,
      mdiSkipNext,
      mdiStepForward2,
      mdiSpeaker,
      mdiSpeakerOff
    }
    return {
      ...icons,
      previousVolume: 1
    }
  },
  computed: {
    audioIcon() {
      if (this.volume > 0.66) return mdiVolumeHigh
      if (this.volume > 0.33) return mdiVolumeMedium
      if (this.volume > 0) return mdiVolumeLow
      return mdiVolumeOff
    },
    fileId() {
      if (!this.playlist[this.current]) return null
      return this.playlist[this.current].file.id
    },
    formattedTime() {
      const minutes = Math.floor(this.time / 60)
      const seconds = ('0' + Math.floor(this.time % 60)).slice(-2)
      return `${minutes}:${seconds}`
    },
    ...mapState('audio', [
      'volume',
      'paused',
      'time',
      'playlist',
      'current',
      'playbackRate'
    ])
  },
  watch: {
    paused(value) {
      if (!this.$refs.audioComponent) return
      if (value) {
        this.$refs.audioComponent.pause()
      } else {
        this.$refs.audioComponent.play()
      }
    },
    volume(value) {
      if (!this.$refs.audioComponent) return
      this.$refs.audioComponent.volume = value
    },
    playbackRate(value) {
      if (!this.$refs.audioComponent) return
      this.$refs.audioComponent.playbackRate = value
    }
  },
  methods: {
    async load() {
      await this.$nextTick()
      if (!this.paused) {
        this.$refs.audioComponent.play()
      }
      this.$refs.audioComponent.volume = this.volume
      this.loadedSuccessfully()
    },
    toggleMute() {
      if (this.volume > 0) {
        this.previousVolume = this.volume
        this.changeVolume(0)
      } else {
        this.changeVolume(this.previousVolume)
      }
    },
    toggleX2Rate() {
      if (this.playbackRate === 2) {
        this.changePlaybackRate(1)
      } else {
        this.changePlaybackRate(2)
      }
    },
    ...mapMutations('audio', [
      'changeVolume',
      'changePlaybackRate',
      'changeTime',
      'changePause',
      'loadedSuccessfully',
      'nextTrack',
      'clearPlaylist',
      'previousTrack'
    ])
  }
}
</script>
