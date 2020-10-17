<template>
  <c-content-wrapper
    :title="title"
    :description="description"
    :logo="photo"
    @click.native.capture.stop="goTo"
  />
</template>

<script>
import { getMessageContent } from '@/utils/messages'
import { mapGetters, mapState, mapMutations } from 'vuex'
import { MESSAGE_CONTENT } from '@airgram/api'

const { messagePhoto, messageText, messageVideo } = MESSAGE_CONTENT

/** @typedef {import('@airgram/api').Message} Message */
export default {
  props: {
    /** @type {number} */

    chatId: { type: Number, required: true },
    messageId: { type: Number, required: true }
  },
  computed: {
    message: function() {
      return this.getMessage(this.chatId, this.messageId)
    },
    title: function() {
      if (!this.message || !this.message.senderUserId) return ''
      const user = this.getUser(this.message.senderUserId)
      return user.firstName + ' ' + user.lastName
    },
    description: function() {
      if (this.messageMissings.includes(this.messageId))
        return 'Deleted message'
      if (!this.message) return 'Loading...'
      if (!this.message.senderUserId) return ''
      return getMessageContent(this.message)
    },
    photo: function() {
      if (!this.message || !this.message.senderUserId) return null

      const cnt = this.message.content
      if (cnt._ === messagePhoto) return cnt.photo.sizes[0].photo
      if (cnt._ === messageVideo) return cnt.video.thumbnail.photo
      if (cnt._ === messageText && cnt.webPage && cnt.webPage.photo)
        return cnt.webPage.photo.sizes[0].photo

      return null
    },
    ...mapGetters('tdlib/user', ['getUser']),
    ...mapState('tdlib/message', ['messageMissings']),
    ...mapGetters('tdlib/message', ['getMessage'])
  },
  methods: {
    goTo: function() {
      if (!this.message) return
      const element = document.querySelector(`#m${this.message.id}`)
      if (element) {
        this.$vuetify.goTo(element, {
          container: '#messages-container',
          offset: 200
        })
        element.focus()
      } else {
        this.changeCurrentMessage(this.message.id)
      }
    },
    ...mapMutations('tdlib/chat', ['changeCurrentMessage'])
  }
}
</script>
