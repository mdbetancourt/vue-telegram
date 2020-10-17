<template>
  <c-message-text v-if="type === 'Text'" :message="message" />
  <c-message-photo
    v-else-if="type === 'Photo'"
    :message="message"
    @click.native.stop.prevent="openViewer"
  />
  <c-message-audio
    v-else-if="type === 'Audio' || type === 'VoiceNote'"
    :message="message"
  />
  <c-message-document v-else-if="type === 'Document'" :message="message" />
  <c-message-video
    v-else-if="type === 'Video'"
    :message="message"
    @click.native.stop.prevent="openViewer"
  />
  <c-message-sticker v-else-if="type === 'Sticker'" :message="message" />
  <c-message-animation v-else-if="type === 'Animation'" :message="message" />
  <c-message-contact v-else-if="type === 'Contact'" :message="message" />
  <c-message-poll v-else-if="type === 'Poll'" :message="message" />
  <span v-else>Unsupported Message</span>
</template>

<script>
import { isService } from '@/utils/messages'
import { mapMutations } from 'vuex'
import { SEARCH_MESSAGES_FILTER } from '@airgram/api'

export default {
  props: {
    message: { type: Object, required: true }
  },
  computed: {
    type() {
      return this.message.content._.substring(7) // cut message word
    },
    isService() {
      return isService(this.message)
    }
  },
  methods: {
    openViewer() {
      this.setMessageToViewer({
        messageId: this.message.id,
        filterBy:
          this.type === 'Photo'
            ? SEARCH_MESSAGES_FILTER.searchMessagesFilterPhoto
            : SEARCH_MESSAGES_FILTER.searchMessagesFilterVideo
      })
    },
    ...mapMutations('viewer', ['setMessageToViewer'])
  }
}
</script>

<style>
.media-border {
  border-radius: 6px;
}
</style>
