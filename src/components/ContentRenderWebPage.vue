<template>
  <c-content-wrapper>
    <v-row no-gutters style="white-space: normal" class="ml-3 my-1">
      <v-col cols="12" order="1" class="primary--text caption">
        {{ webPage.siteName }}
      </v-col>
      <v-col cols="10" order="2" class="subtitle-2">
        {{ webPage.title }}
      </v-col>
      <v-col cols="12" order="3">{{ webPage.description }}</v-col>
      <v-col
        v-if="webPage.photo"
        :cols="isSmall ? 2 : 6"
        :order="isSmall ? 2 : 4"
      >
        <c-content-render-photo v-if="webPage.photo" :photo="webPage.photo" />
      </v-col>
    </v-row>
  </c-content-wrapper>
</template>

<script>
/** @typedef {import('@airgram/api').WebPage} WebPage */

export default {
  props: {
    /** @type {import('vue').PropOptions<WebPage>} */
    webPage: { type: Object, required: true }
  },
  computed: {
    photoSize() {
      if (!this.webPage.photo) return null
      return this.webPage.photo.sizes[0]
    },
    isSmall() {
      const { type, siteName, title, description } = this.webPage
      return (
        (type === 'article' || type === 'photo') &&
        (siteName || title || description) &&
        this.photoSize &&
        this.photoSize.width === this.photoSize.height
      )
    }
  }
}
</script>
