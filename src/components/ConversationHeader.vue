<template>
  <v-toolbar flat height="64">
    <!-- Selection dialog -->
    <v-dialog v-model="showDelete" max-width="330">
      <v-card>
        <v-card-title>Confirm</v-card-title>
        <v-card-text class="py-0">
          Are you sure you want to delete {{ selected.length }} messages
          <v-checkbox
            v-show="allCanBeDeletedByAny"
            v-model="revoke"
            label="Delete for all"
            color="primary"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text color="primary" @click="reset">Cancel</v-btn>
          <v-btn text color="primary" @click="deleteMessages">Ok</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete history chat dialog -->
    <v-dialog v-model="showDeleteHistory" max-width="330">
      <v-card>
        <v-card-title>{{ chat ? chat.title : '' }}</v-card-title>
        <v-card-text class="py-0">
          Are you sure you want clear history?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text color="primary" @click="showDeleteHistory = false">
            Cancel
          </v-btn>
          <v-btn text color="primary" @click="deleteHistory">Ok</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Close chat dialog -->
    <v-dialog v-model="showCloseChat" max-width="330">
      <v-card>
        <v-card-title>{{ chat ? chat.title : '' }}</v-card-title>
        <v-card-text class="py-0">
          Are you sure you want to delete chat with
          {{ chat ? chat.title : '' }}?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text color="primary" @click="showCloseChat = false">
            Cancel
          </v-btn>
          <v-btn text color="primary" @click="leaveChat">Ok</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Messages selected -->
    <template v-if="selected.length">
      <c-forward-dialog
        :show.sync="showForward"
        :messages="selected"
        :chat-id="chat.id"
      />

      <v-btn
        v-if="allCanBeForwarded"
        text
        color="primary"
        @click="showForward = true"
      >
        Forward
        {{ selected.length > 1 ? selected.length : '' }}
      </v-btn>
      <v-btn
        v-if="allCanBeDeletedByAny || allCanBeDeletedByMe"
        text
        color="primary"
        @click="showDelete = true"
      >
        Delete
        {{ selected.length > 1 ? selected.length : '' }}
      </v-btn>
      <v-btn
        v-show="selected.length === 1 && !chat.type.isChannel"
        text
        color="primary"
        @click="replyMessage"
      >
        Reply
      </v-btn>
      <v-spacer />
      <v-btn text color="primary" @click="$emit('update:selected', [])">
        Cancel
      </v-btn>
    </template>
    <template v-else-if="chat">
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="headline text-truncate">
            {{ chat ? chat.title.slice(0, 25) : '' }}
          </v-list-item-title>
          <v-list-item-subtitle v-if="chat.id !== myId">
            {{ subtitle }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-spacer />

      <v-btn icon @click="searchInCurrent">
        <v-icon>{{ mdiMagnify }}</v-icon>
      </v-btn>
      <v-menu offset-y>
        <template v-slot:activator="{ on }">
          <v-btn text icon v-on="on">
            <v-icon>{{ mdiDotsVertical }}</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="togglePanelInfo">
            <v-list-item-title>
              Chat info
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click="showDeleteHistory = true">
            <v-list-item-title>
              Clear History
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click="showCloseChat = true">
            <v-list-item-title>
              Delete and exit
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </v-toolbar>
</template>

<script>
import { mdiMagnify, mdiDotsVertical } from '@mdi/js'
import { mapGetters, mapMutations, mapActions, mapState } from 'vuex'
import { airgram } from '../plugins/tdweb'
import { USER_STATUS, CHAT_TYPE } from '@airgram/api'

export default {
  props: {
    chat: { type: Object, default: null },
    replyId: { type: [Number, null], default: null },
    selected: { type: Array, default: () => [] }
  },
  data() {
    return {
      mdiMagnify,
      mdiDotsVertical,
      showDelete: false,
      revoke: false,
      showDeleteHistory: false,
      showForward: false,
      showCloseChat: false
    }
  },

  computed: {
    subtitle() {
      if (!this.chat) return ''
      if (this.chat.type._ === CHAT_TYPE.chatTypePrivate) {
        const user = this.getUser(this.chat)
        if (user.isSupport) return 'Service Notification'
        if (user.status._ === USER_STATUS.userStatusEmpty)
          return 'Never seen before'
        if (user.status._ === USER_STATUS.userStatusOnline) return 'Online'
        if (user.status._ === USER_STATUS.userStatusOffline) return 'Offline'
        if (user.status._ === USER_STATUS.userStatusRecently)
          return 'Last seen recently'
        if (user.status._ === USER_STATUS.userStatusLastWeek)
          return 'Last seen the last week'
        if (user.status._ === USER_STATUS.userStatusLastMonth)
          return 'Last seen the last month'
        const date = new Date(user.status.wasOnline * 1000)
        const month = '0' + (date.getMonth() + 1)
        return (
          'Last seen ' +
          [date.getDate(), month.slice(-2), date.getFullYear()].join('.')
        )
      }
      let subtitle = []
      let memberCount = this.getGroupMemberCount(this.chat)
      if (memberCount) subtitle = [memberCount + ' members']
      if (this.chat.onlineMemberCount) {
        subtitle = [...subtitle, this.chat.onlineMemberCount + ' online']
      }
      return subtitle.join(', ')
    },
    /** @return {import('@airgram/api').Message[]} */
    selectedMessages() {
      if (!this.selected.length) return []
      return this.selected.map(id => this.getMessage(this.chat.id, id))
    },
    allCanBeForwarded() {
      if (!this.selectedMessages.length) return false
      return this.selectedMessages.every(msg => msg.canBeForwarded)
    },
    allCanBeDeletedByMe() {
      if (!this.selectedMessages.length) return false
      return this.selectedMessages.every(msg => msg.canBeDeletedOnlyForSelf)
    },
    allCanBeDeletedByAny() {
      if (!this.selectedMessages.length) return false
      return this.selectedMessages.every(msg => msg.canBeDeletedForAllUsers)
    },
    ...mapState('tdlib/user', ['myId']),
    ...mapGetters('tdlib/user', ['getGroupMemberCount', 'getUser']),
    ...mapGetters('tdlib/message', ['getMessage'])
  },
  watch: {
    selected() {
      this.showForward = false
    }
  },
  methods: {
    replyMessage() {
      this.$emit('update:replyId', this.selected[0])
      this.$emit('update:selected', [])
      this.reset()
    },
    searchInCurrent() {
      this.setSearchIn(this.chat.id)
    },
    deleteMessages() {
      airgram.api.deleteMessages({
        chatId: this.chat.id,
        messageIds: this.selected,
        revoke: this.revoke
      })
      this.reset()
      this.$emit('update:selected', [])
    },
    async leaveChat() {
      this.closeChat(this.chat.id)

      if (this.chat.type !== CHAT_TYPE.chatTypePrivate) {
        await airgram.api.leaveChat({ chatId: this.chat.id })
      } else {
        await airgram.api.deleteChatHistory({
          chatId: this.chat.id,
          removeFromChatList: true,
          revoke: false
        })
      }
      this.showCloseChat = false
    },
    deleteHistory() {
      airgram.api.deleteChatHistory({
        chatId: this.chat.id,
        removeFromChatList: false,
        revoke: false
      })
      this.showDeleteHistory = false
    },
    reset() {
      this.revoke = false
      this.showDelete = false
    },
    ...mapMutations('config', ['togglePanelInfo']),
    ...mapMutations('tdlib/search', ['setSearchIn']),
    ...mapActions('tdlib/chat', ['closeChat'])
  }
}
</script>
