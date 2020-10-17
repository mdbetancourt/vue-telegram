<template>
  <c-file-loader
    v-slot="{
      formattedProgress,
      source,
      ...rest
    }"
    lazy
    :file-id="message.content.document.document.id"
  >
    <v-row no-gutters style="width: 100%" class="flex-nowrap">
      <c-progress-circular-file v-bind="rest" @click="open(source)" />

      <v-col class="ml-2">
        <h4 class="subtitle-2 text-truncate" style="max-width: 190px">
          {{ message.content.document.fileName }}
        </h4>
        <span class="body-2">{{ formattedProgress }}</span>
      </v-col>
    </v-row>
  </c-file-loader>
</template>

<script>
/** @typedef {import('@airgram/api').Message} Message */
export default {
  props: {
    /** @type {import('vue').PropOptions<Message>} message */
    message: { type: Object, required: true }
  },
  methods: {
    open(source) {
      let tempLink = document.createElement('a')
      tempLink.style.display = 'none'
      tempLink.href = source
      tempLink.setAttribute('download', this.message.content.document.fileName)

      // Safari thinks _blank anchor are pop ups. We only want to set _blank
      // target if the browser does not support the HTML5 download attribute.
      // This allows you to download files in desktop safari if pop up blocking
      // is enabled.
      if (typeof tempLink.download === 'undefined') {
        tempLink.setAttribute('target', '_blank')
      }

      document.body.appendChild(tempLink)
      tempLink.click()
      document.body.removeChild(tempLink)
    }
  }
}
</script>

<style>
.content-audio .v-input__slot {
  margin-bottom: 0 !important;
}
</style>
