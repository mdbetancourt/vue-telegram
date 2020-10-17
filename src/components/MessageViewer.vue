<template>
  <v-overlay :value="!!messageInViewer">
    <v-row
      style="width: 100vw; height: 100vh"
      class="flex-column flex-nowrap"
      no-gutters
    >
      <v-row
        no-gutters
        justify="space-between"
        style="max-height: calc(100vh - 64px)"
        align="center"
      >
        <v-col cols="1" style="height: 100%">
          <div style="height: 80px"></div>
          <v-btn
            tile
            text
            block
            height="100%"
            :disabled="!hasPrevious"
            @click="previous"
          >
            <v-icon>{{ mdiArrowLeft }}</v-icon>
          </v-btn>
        </v-col>
        <c-content-render-photo
          v-if="currentType === 'Photo' && message.id"
          :key="message.id"
          :photo="message.content.photo"
          style="max-height: 100%"
          :max="700"
          @ready="source = $event"
        />
        <c-content-render-video
          v-else-if="message.id"
          :key="message.id"
          :video="message.content.video"
          style="max-height: 100%"
          :max="700"
          @ready="source = $event"
        />
        <v-col cols="1" style="height: 100%">
          <v-btn
            tile
            height="80px"
            text
            block
            @click="setMessageToViewer(null)"
          >
            <v-icon>{{ mdiClose }}</v-icon>
          </v-btn>
          <v-btn
            tile
            text
            block
            height="100%"
            :disabled="!hasNext"
            @click="next"
          >
            <v-icon>{{ mdiArrowRight }}</v-icon>
          </v-btn>
        </v-col>
      </v-row>

      <v-toolbar width="100%" class="shrink">
        <c-avatar-image
          v-if="message.senderUserId || message.chatId"
          :id="message.senderUserId || message.chatId"
          :title="title"
          :photo="photo"
        />
        <div class="d-flex flex-column grey--text ml-2">
          <span>{{ title }}</span>
          <span class="caption">{{ timestamp }}</span>
        </div>
        <v-spacer />
        <v-toolbar-title class="body-1">
          {{ currentType }} {{ length - index }} of {{ length }}
        </v-toolbar-title>
        <v-spacer />
        <v-toolbar-items>
          <v-btn text @click="download">
            <v-icon>{{ mdiDownload }}</v-icon>
          </v-btn>
          <v-btn text @click="deleteMessage">
            <v-icon>{{ mdiTrashCan }}</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
    </v-row>
  </v-overlay>
</template>

<script>
import {
  mdiDownload,
  mdiForwardburger,
  mdiArrowRight,
  mdiClose,
  mdiArrowLeft,
  mdiTrashCan
} from '@mdi/js'
import { mapMutations, mapState, mapActions, mapGetters } from 'vuex'
import { airgram } from '../plugins/tdweb'
export default {
  data() {
    const icons = {
      mdiDownload,
      mdiForwardburger,
      mdiArrowRight,
      mdiArrowLeft,
      mdiClose,
      mdiTrashCan
    }
    return {
      source: '',
      ...icons
    }
  },
  computed: {
    chat() {
      return this.getChat(this.message.chatId)
    },
    filtered() {
      return this.getFilteredMessages(this.filterBy)
    },
    messages() {
      return this.filtered ? this.filtered.messages : []
    },
    length() {
      if (this.filtered) return this.filtered.totalCount
      return 0
    },
    index() {
      return this.messages.findIndex(
        message => this.messageInViewer === message.id
      )
    },
    message() {
      if (!this.messages) return { id: null }
      return this.messages[this.index] || { id: null }
    },
    timestamp() {
      const d = new Date(this.message.date * 1000)
      const time = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
      const date = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`
      return time + ' ' + date
    },
    currentType() {
      if (!this.message.id) return null
      return this.message.content._.substring(7)
    },
    hasNext() {
      return !!this.index
    },
    hasPrevious() {
      return this.index < this.messages.length - 1
    },
    title() {
      if (!this.message.senderUserId) return this.chat ? this.chat.title : ''
      const user = this.getUser(this.message.senderUserId)
      const title = user ? user.firstName + ' ' + user.lastName : ''
      return title.trim() === '' ? 'Deleted Account' : title
    },
    photo() {
      if (!this.message.senderUserId) return this.chat ? this.chat.photo : ''
      const user = this.getUser(this.message.senderUserId)
      return user ? user.profilePhoto : null
    },
    ...mapState('tdlib/chat', ['currentChat']),
    ...mapGetters('tdlib/chat', ['getFilteredMessages', 'getChat']),
    ...mapGetters('tdlib/user', ['getUser']),
    ...mapState('viewer', ['messageInViewer', 'filterBy'])
  },
  watch: {
    messageInViewer(newVar, oldVar) {
      if (oldVar === null && newVar) {
        this.filterMessages({ messageId: newVar, type: this.filterBy })
      } else if (!this.hasPrevious && newVar) {
        this.filterMessages({ messageId: newVar, type: this.filterBy })
      }
    }
  },
  methods: {
    download() {
      const anchor = document.createElement('a')
      anchor.href = this.source
      if (this.currentType === 'Photo') {
        anchor.download = 'file.jpg'
      } else {
        anchor.download = 'file.mp4'
      }
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
    },
    deleteMessage() {
      airgram.api.deleteMessages({
        chatId: this.chat.id,
        messageIds: [this.message.id],
        revoke: true
      })
    },
    previous() {
      this.setMessageToViewer({
        messageId: this.messages[this.index + 1].id,
        filterBy: this.filterBy
      })
    },
    next() {
      this.setMessageToViewer({
        messageId: this.messages[this.index - 1].id,
        filterBy: this.filterBy
      })
    },
    ...mapMutations('viewer', ['setMessageToViewer']),
    ...mapActions('tdlib/chat', ['filterMessages'])
  }
}
</script>
