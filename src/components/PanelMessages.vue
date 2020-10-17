<template>
  <v-row class="flex-column fill-height" no-gutters width="100%">
    <c-conversation-header-player class="shrink" />
    <v-divider />
    <c-conversation-header
      class="shrink"
      :selected.sync="selectedMessages"
      :chat="chat"
      :reply-id.sync="replyId"
    />
    <v-divider />
    <template v-if="chat && chat.pinnedMessageId">
      <c-conversation-message-reply
        :chat-id="chat.id"
        :message-id="chat.pinnedMessageId"
      />
      <v-divider />
    </template>
    <template v-if="currentChat">
      <c-conversation-messages :selected.sync="selectedMessages" :chat="chat" />
      <v-divider style="width: 100%" />
      <c-conversation-input :chat="chat" :reply-id.sync="replyId" />
    </template>
    <v-row
      v-else
      class="flex-column"
      justify="center"
      align="center"
      no-gutters
    >
      <v-row class="shrink flex-column" align="center">
        <v-icon size="128">{{ mdiChatOutline }}</v-icon>
        <h4 class="body-2">Select a chat to start messaging</h4>
      </v-row>
    </v-row>
  </v-row>
</template>

<script>
import { mdiChatOutline } from '@mdi/js'
import { mapState, mapMutations } from 'vuex'
import { airgram } from '../plugins/tdweb'
import { UPDATE } from '@airgram/api'

export default {
  data() {
    return {
      mdiChatOutline,
      selectedMessages: [],
      replyId: 0
    }
  },
  computed: {
    chat() {
      const chat = this.chatItems[this.currentChat]
      return chat ? chat : null
    },
    ...mapState('tdlib/chat', ['chatItems', 'currentChat'])
  },
  watch: {
    'chat.id': {
      immediate: true,
      async handler() {
        if (this.chat && this.chat.pinnedMessageId) {
          const result = await airgram.api.getMessages({
            chatId: this.chat.id,
            messageIds: [this.chat.pinnedMessageId]
          })
          result.messages.map(message => this.updateNewMessage({ message }))
        }
      }
    }
  },
  methods: mapMutations('tdlib/message', [UPDATE.updateNewMessage])
}
</script>

<style>
.fill-remain {
  height: calc(100% - 64px);
}
</style>
