<template>
  <c-file-loader
    v-slot="tn"
    :file-id="thumbnail.id"
    :lazy="disableThumbnail"
    :priority="22"
  >
    <c-file-loader v-slot="main" :file-id="photo.id" :priority="10">
      <v-img
        contain
        :lazy-src="tn.source"
        :aspect-ratio="aspectRatio"
        :src="main.source"
        :alt="emoji"
      />
    </c-file-loader>
  </c-file-loader>
</template>

<script>
export default {
  props: {
    sticker: { type: Object, required: true },
    disableThumbnail: { type: Boolean, default: false }
  },
  computed: {
    thumbnail() {
      return this.sticker.thumbnail.photo
    },
    photo() {
      return this.sticker.sticker
    },
    aspectRatio() {
      return this.sticker.width / this.sticker.height
    },
    emoji() {
      return this.sticker.emoji
    }
  }
}
</script>
