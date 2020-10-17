<template>
  <v-avatar :key="'photo' + (photoId || id)" :size="size" :color="color">
    <c-file-loader v-slot="{ source }" :file-id="photoId" :priority="32">
      <v-img v-if="source && photoId" :src="source" />
      <span v-else class="white--text body-1">{{ text }}</span>
    </c-file-loader>
  </v-avatar>
</template>

<script>
import { COLORS } from '@/utils/constants'

/**
 * @typedef {import('@airgram/api').ProfilePhoto} ProfilePhoto
 */

export default {
  props: {
    // Id for generate color
    id: { type: Number, required: true },
    // fallback for images
    title: { type: String, required: true },
    /** @type {ProfilePhoto} photo */
    photo: { type: [Object, null], default: null },
    size: { type: Number, default: 48 }
  },
  computed: {
    photoId() {
      if (!this.photo || !this.photo.small) return null
      return this.photo.small.id
    },
    text() {
      if (typeof this.title === 'string') {
        const txt = this.title.match(/\b\w/g)
        return txt ? txt.slice(0, 2).join('') : ''
      }
      return ''
    },
    color() {
      const idx = Math.abs(this.id) % 8
      return COLORS[idx]
    }
  }
}
</script>
