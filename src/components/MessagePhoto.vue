<template>
  <c-content-render-photo :photo="content.photo" style="border-radius: 6px;" />
</template>

<script>
/**
 * @typedef {import('@airgram/api').Message} Message
 * @typedef {import('@airgram/api').MessagePhoto} MessagePhoto
 * */
export default {
  name: 'MessagePhoto',
  props: {
    /** @type {import('vue').PropOptions<Message>} */
    message: { type: Object, required: true }
  },
  computed: {
    /** @returns {MessagePhoto} */
    content() {
      return this.message.content
    }
  }
}
</script>
