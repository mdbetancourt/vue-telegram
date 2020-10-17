<template>
  <v-row no-gutters class="fill-height flex-column flex-nowrap">
    <v-col class="shrink">
      <v-toolbar flat height="64" width="100%">
        <v-btn v-show="type" icon @click="type = ''">
          <v-icon>{{ mdiArrowLeft }}</v-icon>
        </v-btn>
        <v-toolbar-title class="title">
          {{ toolbarTitle }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn v-show="!type" icon @click="$emit('close')">
          <v-icon>{{ mdiClose }}</v-icon>
        </v-btn>
      </v-toolbar>
    </v-col>
    <v-row
      v-if="type"
      no-gutters
      class="flex-column flex-nowrap shrink overflow-y-auto"
      justify="start"
    >
      <template v-if="type === 'groupInCommon'">
        <c-chat-user v-for="cgId in commonGroups" :key="cgId" :value="cgId" />
      </template>
      <template v-else>
        <c-conversation-message-content
          v-for="message in messages"
          :key="message.id"
          class="mb-3 mx-3"
          :message="message"
        />
      </template>
    </v-row>
    <v-list v-else class="overflow-y-auto">
      <v-list-item>
        <v-list-item-avatar tile>
          <c-avatar-image
            :id="chat.id"
            :title="chat.title"
            :photo="chat.photo"
          />
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title>{{ chat.title }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <!-- Username -->
      <v-list-item v-if="username">
        <v-list-item-icon>
          <v-icon>{{ mdiAt }}</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ username }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item v-if="isSupergroup && fullInfo && fullInfo.description">
        <v-list-item-icon>
          <v-icon>{{ mdiInformationOutline }}</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title
            style="white-space: pre"
            v-text="fullInfo.description"
          >
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <template v-if="myId !== chatId">
        <v-divider class="my-2" />
        <!-- Notifications -->
        <v-list-item @click="notifications = !notifications">
          <v-list-item-icon>
            <v-icon>{{ notifications ? mdiBellRing : mdiBell }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Notifications</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-switch v-model="notifications" />
          </v-list-item-action>
        </v-list-item>
      </template>
      <!-- More -->
      <v-list-group v-if="!isPrivate" :prepend-icon="mdiDotsHorizontal">
        <template v-slot:activator>
          <v-list-item-title>More</v-list-item-title>
        </template>
        <v-list-item @click="deleteChatHistory">
          <v-list-item-icon> </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title class="error--text">
              {{ chat.type.isChannel ? 'Leave channel' : 'Delete and exit' }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list-group>
      <v-divider v-if="existsCounted.length" class="my-2" />

      <v-list-item
        v-for="[name, count] in existsCounted"
        :key="name"
        @click="countMeta[name].handler"
      >
        <v-list-item-icon>
          <v-icon>{{ countMeta[name].icon }}</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            {{ count }} {{ countMeta[name].title }}{{ count > 0 ? 's' : '' }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item v-if="groupInCommonCount" @click="handleGroups">
        <v-list-item-icon>
          <v-icon>{{ mdiAccountMultiple }}</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            {{ groupInCommonCount }} group in common{{
              groupInCommonCount > 0 ? 's' : ''
            }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-row>
</template>

<script>
import {
  mdiClose,
  mdiAt,
  mdiInformationOutline,
  mdiBell,
  mdiBellRing,
  mdiMicrophone,
  mdiArrowLeft,
  mdiDotsHorizontal,
  mdiImage,
  mdiCamcorder,
  mdiAccountMultiple,
  mdiFile,
  mdiMusic,
  mdiLink
} from '@mdi/js'
import { mapGetters, mapState, mapActions } from 'vuex'
import { airgram } from '../plugins/tdweb'
import {
  CHAT_NOTIFICATION_SETTINGS,
  CHAT_TYPE,
  SEARCH_MESSAGES_FILTER
} from '@airgram/api'

export default {
  props: {
    chatId: { type: Number, required: true }
  },
  data() {
    const icons = {
      mdiClose,
      mdiAt,
      mdiInformationOutline,
      mdiBell,
      mdiBellRing,
      mdiDotsHorizontal,
      mdiArrowLeft,
      mdiAccountMultiple
    }
    const countMeta = {
      photos: {
        title: 'photo',
        icon: mdiImage,
        handler: this.handlePhotos
      },
      videos: {
        title: 'video',
        icon: mdiCamcorder,
        handler: this.handleVideos
      },
      documents: {
        title: 'document',
        icon: mdiFile,
        handler: this.handleDocuments
      },
      audios: {
        title: 'audio',
        icon: mdiMusic,
        handler: this.handleAudios
      },
      links: {
        title: 'shared link',
        icon: mdiLink,
        handler: this.handleLinks
      },
      voiceNotes: {
        title: 'voice message',
        icon: mdiMicrophone,
        handler: this.handleVoiceNotes
      }
    }
    return {
      ...icons,
      countMeta,
      messages: [],
      type: '',
      commonGroups: [],
      counts: {
        photos: 0,
        videos: 0,
        documents: 0,
        audios: 0,
        links: 0,
        voiceNotes: 0
      }
    }
  },
  computed: {
    chat() {
      return this.chatItems[this.chatId]
    },
    fullInfo() {
      return this.getFullInfo(this.chat)
    },
    username() {
      return this.getUsername(this.chat)
    },
    toolbarTitle() {
      if (this.type === 'groupInCommon') return 'Common Groups'
      if (!this.type) return 'Chat Info'
      return this.countMeta[this.type].title
    },
    existsCounted() {
      return Object.entries(this.counts).filter(v => v[1] > 0)
    },
    isSupergroup() {
      return this.chat.type._ === CHAT_TYPE.chatTypeSupergroup
    },
    isPrivate() {
      return this.chat.type._ === CHAT_TYPE.chatTypePrivate
    },
    groupInCommonCount() {
      return this.isPrivate && this.fullInfo
        ? this.fullInfo.groupInCommonCount
        : 0
    },
    notifications: {
      get() {
        return this.chat.notificationSettings.muteFor === 0
      },
      set(value) {
        airgram.api.setChatNotificationSettings({
          chatId: this.chatId,
          notificationSettings: {
            _: CHAT_NOTIFICATION_SETTINGS.chatNotificationSettings,
            muteFor: value ? 0 : 2147483647,
            disablePinnedMessageNotifications: false,
            disableMentionNotifications: false,
            showPreview: false,
            sound: 'default',
            useDefaultMuteFor: false,
            useDefaultShowPreview: true,
            useDefaultSound: true,
            useDefaultDisablePinnedMessageNotifications: true,
            useDefaultDisableMentionNotifications: true
          }
        })
      }
    },
    ...mapState('tdlib/chat', ['chatItems']),
    ...mapState('tdlib/user', ['myId']),
    ...mapGetters('tdlib/user', ['getUsername', 'getUser', 'getFullInfo'])
  },
  watch: {
    'chat.id': {
      immediate: true,
      handler: async function(chatId) {
        this.type = ''
        this.counts = {
          ...this.counts,
          photos: 0,
          videos: 0,
          documents: 0,
          audios: 0,
          links: 0,
          voiceNotes: 0
        }
        this.commonGroups = []
        await this.loadFullInfo(this.chat)
        const photos = await airgram.api.getChatMessageCount({
          chatId,
          filter: {
            _: SEARCH_MESSAGES_FILTER.searchMessagesFilterPhoto
          },
          returnLocal: false
        })
        const videos = await airgram.api.getChatMessageCount({
          chatId,
          filter: {
            _: SEARCH_MESSAGES_FILTER.searchMessagesFilterVideo
          },
          returnLocal: false
        })
        const documents = await airgram.api.getChatMessageCount({
          chatId,
          filter: {
            _: SEARCH_MESSAGES_FILTER.searchMessagesFilterDocument
          },
          returnLocal: false
        })
        const audios = await airgram.api.getChatMessageCount({
          chatId,
          filter: {
            _: SEARCH_MESSAGES_FILTER.searchMessagesFilterAudio
          },
          returnLocal: false
        })
        const links = await airgram.api.getChatMessageCount({
          chatId,
          filter: {
            _: SEARCH_MESSAGES_FILTER.searchMessagesFilterUrl
          },
          returnLocal: false
        })
        const voiceNotes = await airgram.api.getChatMessageCount({
          chatId,
          filter: {
            _: SEARCH_MESSAGES_FILTER.searchMessagesFilterVoiceNote
          },
          returnLocal: false
        })
        this.counts = {
          photos: photos.count,
          videos: videos.count,
          documents: documents.count,
          audios: audios.count,
          links: links.count,
          voiceNotes: voiceNotes.count
        }
      }
    }
  },
  methods: {
    deleteChatHistory() {
      airgram.api.deleteChatHistory({
        chatId: this.chat.id,
        removeFromChatList: true
      })
    },
    async handleGroups() {
      this.type = 'groupInCommon'
      const result = await airgram.api.getGroupsInCommon({
        userId: this.getUser(this.chat).id,
        offsetChatId: 0,
        limit: 100
      })
      this.commonGroups = result.chatIds
    },
    async handlePhotos() {
      this.type = 'photos'
      this.messages = []
      const result = await airgram.api.searchChatMessages({
        chatId: this.chat.id,
        filter: {
          _: SEARCH_MESSAGES_FILTER.searchMessagesFilterPhoto
        },
        fromMessageId: 0,
        limit: 30,
        offset: 0,
        query: '',
        senderUserId: 0
      })
      this.messages = result.messages
    },
    async handleVideos() {
      this.type = 'videos'
      this.messages = []
      const result = await airgram.api.searchChatMessages({
        chatId: this.chat.id,
        filter: {
          _: SEARCH_MESSAGES_FILTER.searchMessagesFilterVideo
        },
        fromMessageId: 0,
        limit: 30,
        offset: 0,
        query: '',
        senderUserId: 0
      })
      this.messages = result.messages
    },
    async handleDocuments() {
      this.type = 'documents'
      this.messages = []
      const result = await airgram.api.searchChatMessages({
        chatId: this.chat.id,
        filter: {
          _: SEARCH_MESSAGES_FILTER.searchMessagesFilterDocument
        },
        fromMessageId: 0,
        limit: 30,
        offset: 0,
        query: '',
        senderUserId: 0
      })
      this.messages = result.messages
    },
    async handleAudios() {
      this.type = 'audios'
      this.messages = []
      const result = await airgram.api.searchChatMessages({
        chatId: this.chat.id,
        filter: {
          _: SEARCH_MESSAGES_FILTER.searchMessagesFilterAudio
        },
        fromMessageId: 0,
        limit: 30,
        offset: 0,
        query: '',
        senderUserId: 0
      })
      this.messages = result.messages
    },
    async handleLinks() {
      this.type = 'links'
      this.messages = []
      const result = await airgram.api.searchChatMessages({
        chatId: this.chat.id,
        filter: {
          _: SEARCH_MESSAGES_FILTER.searchMessagesFilterUrl
        },
        fromMessageId: 0,
        limit: 30,
        offset: 0,
        query: '',
        senderUserId: 0
      })
      this.messages = result.messages
    },
    async handleVoiceNotes() {
      this.type = 'voiceNotes'
      this.messages = []
      const result = await airgram.api.searchChatMessages({
        chatId: this.chat.id,
        filter: {
          _: SEARCH_MESSAGES_FILTER.searchMessagesFilterVoiceNote
        },
        fromMessageId: 0,
        limit: 30,
        offset: 0,
        query: '',
        senderUserId: 0
      })
      this.messages = result.messages
    },
    ...mapActions('tdlib/user', ['loadFullInfo'])
  }
}
</script>
