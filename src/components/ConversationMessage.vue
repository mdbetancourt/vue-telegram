<template>
  <v-list-item
    :dense="!showAvatar"
    active-class="message-selected"
    :value="message.id"
    class="conversation-message"
    :ripple="false"
  >
    <!-- Selection icon -->
    <v-list-item-icon class="mr-2">
      <v-icon color="primary">
        {{ mdiCheckCircle }}
      </v-icon>
      <span
        :style="isRead ? 'opacity: 0' : 'opacity: 1'"
        class="primary lighten-2 rounded-circle ml-3"
      ></span>
    </v-list-item-icon>
    <!-- Avatar image -->
    <v-list-item-avatar
      v-if="showAvatar"
      class="mr-5"
      style="align-self: start"
    >
      <c-avatar-image
        :id="message.senderUserId || chat.id"
        :title="title"
        :photo="photo"
      />
    </v-list-item-avatar>
    <!-- Keep space without the image -->
    <span v-else style="width: 40px" class="mr-5" />

    <v-list-item-content class="py-1">
      <!-- User name -->
      <v-list-item-title
        v-if="showAvatar && !isForward"
        :style="{ color }"
        v-text="title"
      />
      <!-- Forwarder -->
      <v-list-item-title v-if="isForward" class="body-2" :style="{ color }">
        Forwarded message
      </v-list-item-title>

      <!-- Message content -->
      <v-list-item-subtitle class="body-2">
        <c-conversation-message-reply
          v-if="message.replyToMessageId"
          :chat-id="message.chatId"
          :message-id="message.replyToMessageId"
        />

        <v-row no-gutters class="flex-column">
          <v-col v-if="isForward" class="body-2" :style="{ color }">
            From {{ forwarder }}
          </v-col>
          <v-col>
            <c-conversation-message-content :message="message" />
          </v-col>
        </v-row>
      </v-list-item-subtitle>
    </v-list-item-content>

    <v-list-item-action class="align-self-start">
      <v-list-item-action-text>
        <template v-if="message.isChannelPost">
          <v-icon class="my-1" small>{{ mdiEye }}</v-icon>
          <span class="mr-1">{{ message.views }}</span>
        </template>
        {{ timestamp }}
      </v-list-item-action-text>
    </v-list-item-action>
  </v-list-item>
</template>

<style>
.conversation-message.v-list-item .v-list-item__icon .v-icon {
  opacity: 0;
}
.conversation-message.v-list-item:hover .v-list-item__icon .v-icon {
  opacity: 0.6;
}
.conversation-message.v-list-item.message-selected .v-list-item__icon .v-icon {
  opacity: 1;
}
.rounded-circle {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin: 7.5px;
}
</style>

<script>
/** @typedef {import('@airgram/api').Message} Message */
import { mdiCheckCircle, mdiEye } from '@mdi/js'
import { COLORS } from '../utils/constants'
import { mapGetters } from 'vuex'

export default {
  props: {
    /** @type {import('vue').PropOptions<Message>} */
    message: { type: Object, required: true },
    showAvatar: { type: Boolean, default: true }
  },
  data() {
    return {
      mdiCheckCircle,
      mdiEye
    }
  },
  computed: {
    /** @returns {import('@airgram/api').Chat} */
    chat() {
      return this.getChat(this.message.chatId)
    },
    color: function() {
      const idx = Math.abs(this.message.senderUserId || this.chat.id) % 8
      return COLORS[idx]
    },
    title() {
      if (!this.message.senderUserId) return this.chat.title
      const user = this.getUser(this.message.senderUserId)
      const title = user ? user.firstName + ' ' + user.lastName : ''
      return title.trim() === '' ? 'Deleted Account' : title
    },
    isRead() {
      if (!this.message.isOutgoing) return true
      return this.chat.lastReadOutboxMessageId > this.message.id
    },
    photo() {
      if (!this.message.senderUserId) return this.chat.photo
      const user = this.getUser(this.message.senderUserId)
      return user ? user.profilePhoto : null
    },
    timestamp() {
      const pZeros = h => ('0' + h).slice(-2)
      const time = new Date(this.message.date * 1000)
      const hours = pZeros(time.getHours())
      const minutes = pZeros(time.getMinutes())
      return `${hours}:${minutes}`
    },
    isForward() {
      return !!this.message.forwardInfo
    },
    forwarder() {
      if (!this.message.forwardInfo) return null
      if (!this.message.forwardInfo.origin.senderUserId)
        return this.message.forwardInfo.origin.senderName
      const user = this.getUser(this.message.forwardInfo.origin.senderUserId)
      return user ? user.firstName + ' ' + user.lastName : ''
    },
    ...mapGetters('tdlib/chat', ['getChat']),
    ...mapGetters('tdlib/message', ['getMessage']),
    ...mapGetters('tdlib/user', ['getUser'])
  }
}
</script>
