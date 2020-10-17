<template>
  <c-content-render-sticker
    style="max-height: 192px; max-width: 192px"
    :sticker="content.sticker"
  />
</template>

<script>
/**
 * @typedef {import('@airgram/api').Message} Message
 * @typedef {import('@airgram/api').MessageSticker} MessageSticker
 */
export default {
  name: 'MessageSticker',
  props: {
    /** @type {import('vue').PropOptions<Message>} */
    message: { type: Object, required: true }
  },
  computed: {
    /** @returns {MessageSticker} */
    content() {
      return this.message.content
    }
  }
}
</script>
