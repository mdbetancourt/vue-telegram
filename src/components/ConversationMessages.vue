<template>
  <v-col style="position: relative">
    <v-btn
      v-if="showToBottom"
      fab
      depressed
      bottom
      right
      class="mr-4 mb-10"
      absolute
      color="grey"
      outlined
      @click="goDown()"
    >
      <v-icon color="grey">{{ mdiArrowDown }}</v-icon>
    </v-btn>
    <v-list
      id="messages-container"
      class="overflow-y-auto"
      style="position: absolute; top: 0; bottom: 0; right: 0; left: 0"
    >
      <v-list-item-group
        v-scroll:#messages-container="messageScroll"
        :value="selected"
        multiple
        class="fill-height"
        color="primary"
        @change="$emit('update:selected', $event)"
      >
        <v-row
          no-gutters
          class="flex-column"
          style="min-height: 100%"
          justify="end"
        >
          <v-col v-for="(msg, idx) in messages" :key="msg.id" class="shrink">
            <v-subheader
              v-if="idx in dateLabels"
              style="justify-content: center;"
            >
              {{ dateLabels[idx] }}
            </v-subheader>

            <h4
              v-if="isFirstUnread(msg) && chat.unreadCount"
              id="unread-message"
              class="body-2 secondary--text text-center grey lighten-3 py-1"
            >
              Unread messages
            </h4>

            <h4
              v-if="isService(msg)"
              class="body-2 secondary--text text-center text--lighten-3 py-2"
            >
              <c-message-service :message="msg" />
            </h4>
            <c-conversation-message
              v-else
              :id="'m' + msg.id"
              :message="msg"
              :show-avatar="
                needAvatar(idx) ||
                  isFirstUnread(msg) ||
                  idx in dateLabels ||
                  isChannel
              "
            />
          </v-col>
          <span id="last-message" class="my-3"></span>
        </v-row>
      </v-list-item-group>
    </v-list>
  </v-col>
</template>

<script>
import { mdiFaceProfile, mdiArrowDown } from '@mdi/js'
import { mapGetters, mapActions, mapState, mapMutations } from 'vuex'
import { MONTHS } from '@/utils/constants'
import { airgram } from '../plugins/tdweb'
import { MESSAGE_CONTENT } from '@airgram/api'
import { isService } from '../utils/messages'

export default {
  props: {
    chat: { type: Object, required: true },
    selected: { type: Array, default: () => [] }
  },
  data() {
    const icons = {
      mdiFaceProfile,
      mdiArrowDown
    }
    const scrollHelpers = {
      showToBottom: false,
      start: 0,
      end: 0
    }
    return {
      ...icons,
      ...scrollHelpers,
      lastRead: null,
      waiting: false
    }
  },
  computed: {
    /** @returns {import('@airgram/api').Message[]} */
    sortedMessages() {
      const messages = this.getMessages(this.chat.id)
      return messages.sort((prev, crr) => prev.date - crr.date)
    },
    messages() {
      let flag = false
      return this.sortedMessages.filter(msg => {
        if (msg.id === this.start || msg.id === this.end) {
          flag = msg.id === this.start
          return true
        }
        return flag
      })
    },
    seeingLastMessage() {
      if (!this.chat.lastMessage || !this.messages.length) return true
      return (
        this.chat.lastMessage.id === this.messages[this.messages.length - 1].id
      )
    },
    /** @return {{ text: String, idx: number }} */
    dateLabels() {
      const dateLabels = {}
      this.messages.reduce(
        (prev, crr, idx) => {
          const crrDate = new Date(crr.date * 1000)
          const result = MONTHS[crrDate.getMonth()] + ' ' + crrDate.getDate()
          const prevDate = new Date(prev.date * 1000)
          const year = prevDate.getFullYear() !== crrDate.getFullYear()
          const month = prevDate.getMonth() !== crrDate.getMonth()
          const day = prevDate.getDate() !== crrDate.getDate()

          if (year || month || day) {
            dateLabels[idx] = result
          }
          return crr
        },
        { date: 0 }
      )
      return dateLabels
    },
    referenceMessage() {
      if (this.currentMessage === null && this.chat.unreadCount)
        return this.chat.lastReadInboxMessageId
      else if (this.currentMessage === null) return this.chat.lastMessage.id
      return this.currentMessage
    },
    isChannel() {
      return !!this.chat.type.isChannel
    },
    ...mapState('tdlib/chat', ['currentMessage']),
    ...mapGetters('tdlib/message', ['getMessages']),
    ...mapGetters('tdlib/user', ['getUser'])
  },
  watch: {
    'chat.id': {
      handler: 'reloadMessage',
      immediate: true
    },
    currentMessage: 'reloadMessage'
  },
  methods: {
    async goDown() {
      this.changeCurrentMessage(this.chat.lastMessage.id)
      await this.$nextTick()
      this.$vuetify.goTo('#last-message', {
        container: '#messages-container',
        duration: 0
      })
    },
    isService,
    async reloadMessage() {
      const chatId = this.chat.id
      this.waiting = true
      this.start = 0
      this.end = 0
      let options = {
        fromMessageId: this.referenceMessage,
        offset: -15,
        limit: 30
      }
      const unread = this.chat.unreadCount

      this.lastRead = this.chat.lastReadInboxMessageId
      let history = await this.getChatHistory({ chatId, ...options })
      this.end = history.messages[0].id

      if (history.messages.length === 1) {
        history = await this.getChatHistory({
          chatId,
          offset: 0,
          limit: 30,
          fromMessageId: history.messages[0].id
        })
      }
      const start = history.messages[history.messages.length - 1]
      this.start = start ? start.id : this.end
      await this.$nextTick()
      if (this.currentMessage) {
        const element = document.querySelector(`#m${this.currentMessage}`)
        if (element) {
          this.$vuetify.goTo(element, {
            container: '#messages-container',
            offset: 200
          })
          element.focus()
        }
        await airgram.api.viewMessages({
          chatId,
          messageIds: history.messages.map(msg => msg.id)
        })
      } else if (unread && this.chat.unreadCount !== 0) {
        try {
          this.$vuetify.goTo('#unread-message', {
            container: '#messages-container',
            duration: 0,
            offset: 80
          })
        } catch {
          // do nothing
        }

        await airgram.api.viewMessages({
          chatId,
          messageIds: history.messages.map(msg => msg.id)
        })
      } else if (this.seeingLastMessage) {
        this.$vuetify.goTo('#last-message', {
          container: '#messages-container',
          duration: 0
        })
      }
      this.waiting = false
    },
    needAvatar(idx) {
      if (idx === 0) return true
      const previous = this.messages[idx - 1]
      const current = this.messages[idx]
      const isDifferentUser = previous.senderUserId !== current.senderUserId
      const isReply = !!current.replyToMessageId
      const types = [
        MESSAGE_CONTENT.messageText,
        MESSAGE_CONTENT.messageContact,
        MESSAGE_CONTENT.messageLocation
      ]
      const contentType =
        !types.includes(current.content._) && !current.forwardInfo
      return isDifferentUser || isReply || contentType
    },
    isFirstUnread(msg) {
      return msg.id === this.lastRead
    },
    messageScroll: async function({ target }) {
      if (this.waiting) return
      const chatId = this.chat.id
      const totalScroll = target.scrollHeight - target.offsetHeight
      const currentScroll = target.scrollTop
      const goToDown = currentScroll === totalScroll
      this.showToBottom =
        currentScroll < totalScroll * 0.8 ||
        this.chat.unreadCount ||
        !this.seeingLastMessage
      const goToUp = currentScroll === 0 && this.messages.length
      if (!goToDown && !goToUp) return
      let history

      if (goToDown) {
        history = await this.getChatHistory({
          chatId,
          fromMessageId: this.messages[this.messages.length - 1].id,
          offset: -15,
          limit: 15
        })
        this.end = history.messages[0].id
      } else if (goToUp) {
        history = await this.getChatHistory({
          chatId,
          fromMessageId: this.messages[0].id,
          offset: 0,
          limit: 15
        })
        this.start = history.messages[history.messages.length - 1].id
      }
      if (this.chat.unreadCount) {
        await airgram.api.viewMessages({
          chatId,
          messageIds: history.messages.map(msg => msg.id)
        })
      }
      await this.$nextTick()
      if (goToUp) {
        const newScroll = target.scrollHeight - target.offsetHeight

        this.$vuetify.goTo(newScroll - totalScroll, {
          container: '#messages-container',
          duration: 0
        })
      }
    },
    ...mapActions('tdlib/message', ['getChatHistory']),
    ...mapMutations('tdlib/chat', ['changeCurrentMessage'])
  }
}
</script>
