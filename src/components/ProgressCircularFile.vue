<template>
  <v-btn small fab dark depressed color="primary" @click.stop="handler">
    <v-icon v-if="isDownloadingCompleted">
      {{ completedIcon }}
    </v-icon>
    <v-progress-circular
      v-else-if="isDownloadingActive"
      width="3"
      :value="progress"
      :indeterminate="!progress"
    >
      <v-icon style="animation: none">{{ cancelIcon }}</v-icon>
    </v-progress-circular>
    <v-icon v-else>{{ downloadIcon }}</v-icon>
  </v-btn>
</template>

<script>
import { mdiClose, mdiFile, mdiDownload } from '@mdi/js'
export default {
  props: {
    isDownloadingCompleted: { type: Boolean, default: false },
    progress: { type: Number, default: 0 },
    startDownload: { type: Function, default: () => {} },
    cancelDownload: { type: Function, default: () => {} },
    isDownloadingActive: { type: Boolean, default: false },
    completedIcon: { type: String, default: mdiFile },
    downloadIcon: { type: String, default: mdiDownload },
    cancelIcon: { type: String, default: mdiClose }
  },
  methods: {
    handler() {
      if (this.isDownloadingCompleted) {
        this.$emit('click')
      } else if (this.isDownloadingActive) {
        this.cancelDownload()
      } else {
        this.startDownload()
      }
    }
  }
}
</script>
