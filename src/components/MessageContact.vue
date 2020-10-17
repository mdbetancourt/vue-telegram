<template>
  <v-row no-gutters class="flex-column">
    <span class="subtitle"
      >{{ content.contact.firstName }} {{ content.contact.lastName }}</span
    >
    <span class="subtitle-2">{{ content.contact.phoneNumber }}</span>
  </v-row>
</template>

<script>
/**
 * @typedef {import('@airgram/api').Message} Message
 * @typedef {import('@airgram/api').MessageContact} MessageContact
 */
export default {
  props: {
    /** @type {import('vue').PropOptions<Message>} */
    message: { type: Object, required: true }
  },
  computed: {
    /** @returns {MessageContact} */
    content() {
      return this.message.content
    }
  }
}
</script>
