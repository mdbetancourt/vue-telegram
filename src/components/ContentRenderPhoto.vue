<template>
  <c-file-loader
    v-slot="{ progress, source }"
    :file-id="photoSize.photo.id"
    @ready="$emit('ready', $event)"
  >
    <v-img
      :src="source"
      v-bind="sizes"
      contain
      :aspect-ratio="aspectRatio"
      position="left"
    >
      <template v-slot:placeholder>
        <v-row class="fill-height ma-0" align="center" justify="center">
          <v-progress-circular
            indeterminate
            color="primary"
          ></v-progress-circular>
        </v-row>
      </template>
      <slot />
    </v-img>
  </c-file-loader>
</template>

<script>
import { fitSize } from '../utils/media'
export default {
  props: {
    photo: { type: Object, required: true },
    max: { type: Number, default: 260 }
  },
  computed: {
    photoSize() {
      if (!this.photo) return null
      const photoSizes = this.photo.sizes.filter(v => v.height >= this.max)
      if (photoSizes.length > 0) return photoSizes[0]
      return this.photo.sizes[this.photo.sizes.length - 1]
    },
    aspectRatio() {
      if (!this.photo) return 1
      return this.photoSize.width / this.photoSize.height
    },
    sizes() {
      const { width, height } = fitSize(this.photoSize, this.max)
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
