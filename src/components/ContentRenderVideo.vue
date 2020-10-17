<template>
  <c-file-loader
    v-slot="{ isDownloadingCompleted, progress, source }"
    :file-id="video.video.id"
    @ready="$emit('ready', $event)"
  >
    <video
      v-if="isDownloadingCompleted"
      :src="source"
      v-bind="sizes"
      controls
      autoplay
    />
    <v-progress-circular
      v-else
      :indeterminate="!progress"
      :value="progress"
      color="primary"
    ></v-progress-circular>
  </c-file-loader>
</template>

<script>
import { fitSize } from '../utils/media'
export default {
  props: {
    video: { type: Object, required: true },
    max: { type: Number, default: 260 }
  },
  computed: {
    sizes() {
      const { width, height } = fitSize(this.video, this.max)
      return {
        width,
        height,
        maxWidth: width,
        maxHeight: height
      }
    }
  }
}
</script>
