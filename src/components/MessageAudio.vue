<template>
  <c-file-loader
    v-slot="{
      formattedProgress,
      ...rest
    }"
    :file-id="file.id"
    lazy
  >
    <v-slider
      :value="isPlaying ? time : 0"
      readonly
      min="0"
      :hint="
        (!rest.isDownloadingCompleted ? formattedProgress + ' ' : '') +
          timeIndicator
      "
      persistent-hint
      step="0.05"
      :max="audio.duration"
      class="align-center content-audio"
      style="max-width: 60%"
    >
      <template v-slot:prepend>
        <c-progress-circular-file
          v-bind="rest"
          :completed-icon="playIcon"
          @click="playMusic"
        />
      </template>
    </v-slider>
  </c-file-loader>
</template>
<style>
.content-audio .v-input__slot {
  margin-bottom: 0 !important;
}
</style>
<script>
import { mdiPlay, mdiPause } from '@mdi/js'
import { mapState, mapMutations } from 'vuex'
import { MESSAGE_CONTENT } from '@airgram/api'
import { convertTime } from '../utils/media'

export default {
  props: {
    message: { type: Object, required: true }
  },
  computed: {
    loaded() {
      if (!this.playlist[this.current]) return false
      return this.playlist[this.current].loaded
    },
    audio() {
      if (this.message.content._ === MESSAGE_CONTENT.messageAudio) {
        return this.message.content.audio
      }
      return this.message.content.voiceNote
    },
    file() {
      if (this.message.content._ === MESSAGE_CONTENT.messageAudio) {
        return this.audio.audio
      }
      return this.audio.voice
    },
    playIcon() {
      if (!this.isPlaying) return mdiPlay
      return this.paused ? mdiPlay : mdiPause
    },
    isPlaying() {
      return this.current === this.message.id
    },
    formattedTotalTime() {
      return convertTime(this.audio.duration)
    },
    formattedCurrentTime() {
      return convertTime(this.time)
    },
    timeIndicator() {
      if (!this.time || !this.isPlaying) return this.formattedTotalTime
      return `${this.formattedCurrentTime}/${this.formattedTotalTime}`
    },
    ...mapState('audio', [
      'volume',
      'paused',
      'playlist',
      'time',
      'current',
      'playbackRate'
    ])
  },
  methods: {
    playMusic() {
      if (!this.loaded)
        this.addTrack({
          id: this.message.id,
          track: {
            file: this.file,
            duration: this.audio.duration,
            mimeType: this.audio.mimeType,
            waveform: this.audio.waveform
          }
        })
      if (!this.isPlaying) this.changeTrack(this.message.id)
      this.changePause(!this.paused)
    },
    ...mapMutations('audio', ['changePause', 'addTrack', 'changeTrack'])
  }
}
</script>
