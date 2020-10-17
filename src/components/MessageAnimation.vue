<template>
  <c-file-loader v-slot="tn" :file-id="thumbnail.id" :priority="32">
    <c-file-loader v-slot="main" :file-id="animation.id" :priority="20">
      <video
        :src="main.source"
        class="media-border"
        :poster="tn.source"
        v-bind="sizes"
        preload
        loop
        autoplay
        playsinline
      />
    </c-file-loader>
  </c-file-loader>
</template>

<script>
import { fitSize } from '../utils/media'
/**
 * @typedef {import('@airgram/api').Message} Message
 * @typedef {import('@airgram/api').MessageAnimation} MessageAnimation
 */
export default {
  props: {
    /** @type {import('vue').PropOptions<Message>} */
    message: { type: Object, required: true },
    max: { type: Number, default: 260 }
  },
  computed: {
    /** @returns {MessageAnimation} */
    content() {
      return this.message.content
    },
    thumbnail() {
      return this.content.animation.thumbnail.photo
    },
    animation() {
      return this.content.animation.animation
    },
    aspectRatio() {
      return this.content.animation.width / this.content.animation.height
    },
    sizes() {
      const { width, height } = fitSize(this.content.animation, this.max)
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
