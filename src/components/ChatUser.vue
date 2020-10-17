<template>
  <v-list-item
    :id="'chat-' + id"
    two-line
    :input-value="currentChat === id"
    @click.left.prevent="openChat"
    @click.right.prevent="openMenu($event)"
  >
    <v-list-item-avatar size="48">
      <v-icon v-if="isSelf" color="primary" size="48">
        {{ mdiBookmark }}
      </v-icon>
      <v-badge
        v-else
        overlap
        :value="isOnline"
        bottom
        class="small-badge"
        color="success"
      >
        <template v-slot:badge>
          <span></span>
        </template>
        <c-avatar-image :id="chat.id" :title="title" :photo="photo" />
      </v-badge>
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title>
        {{ title }}
        <v-icon v-if="isVerified" small color="primary">
          {{ mdiCheckDecagram }}
        </v-icon>
      </v-list-item-title>
      <v-list-item-subtitle v-if="!isService && !hideDetails">
        {{ subtitle }}
      </v-list-item-subtitle>
      <v-list-item-subtitle v-else-if="!hideDetails">
        <c-message-service :message="message" />
      </v-list-item-subtitle>
    </v-list-item-content>

    <v-list-item-action v-if="type === 'message' || !summarized">
      <v-list-item-action-text>{{ timestamp }}</v-list-item-action-text>
      <v-chip
        v-if="chat.unreadCount || chat.isMarkedAsUnread"
        class="caption px-2 white--text"
        small
        style="pointer-events: none"
        :color="isMuted ? 'grey lighten-1' : 'primary'"
      >
        {{ chat.unreadCount > 0 ? chat.unreadCount : ' ' }}
      </v-chip>
      <v-icon
        v-else-if="chat.isPinned && !showUser"
        size="20"
        class="pin-icon"
        color="primary"
      >
        {{ mdiPin }}
      </v-icon>
    </v-list-item-action>

    <v-menu
      v-model="showMenu"
      absolute
      offset-y
      :position-x="menuX"
      :position-y="menuY"
      close-on-content-click
      close-on-click
    >
      <v-list>
        <v-list-item @click="togglePin">
          <v-list-item-title>
            {{ chat.isPinned ? 'Unpin from top' : 'Pin to top' }}
          </v-list-item-title>
        </v-list-item>

        <v-list-item @click="setModalInfoChatId(chat.id)">
          <v-list-item-title> View {{ typeText }} info </v-list-item-title>
        </v-list-item>

        <v-list-item @click="toggleMute">
          <v-list-item-title>
            {{ isMuted ? 'Unmute' : 'Mute' }}
          </v-list-item-title>
        </v-list-item>

        <v-list-item @click="toggleUnread">
          <v-list-item-title>
            {{
              chat.unreadCount > 0 || chat.isMarkedAsUnread
                ? 'Mark as read'
                : 'Mark as unread'
            }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-list-item>
</template>
<style>
.small-badge .v-badge__badge {
  min-width: 12px;
  height: 12px;
  right: 2px !important;
  bottom: 2px !important;
}
.v-menu.v-menu--inline {
  display: none;
}
.pin-icon {
  opacity: 0.5;
  transform: translateY(-10px) rotateZ(45deg);
}
</style>
<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import { mdiCheckDecagram, mdiPin, mdiBookmark } from '@mdi/js'
import {
  CHAT_TYPE,
  USER_STATUS,
  CHAT_ACTION,
  CHAT_NOTIFICATION_SETTINGS
} from '@airgram/api'
import { airgram } from '../plugins/tdweb'
import { getMessageContent, isService } from '../utils/messages'

/**
 * @typedef {import('@airgram/api').Chat} Chat
 * @typedef {import('@airgram/api').User} User
 * @typedef {import('@airgram/api').BasicGroup} BasicGroup
 * @typedef {import('@airgram/api').Supergroup} Supergroup
 */
export default {
  props: {
    value: { type: [Number, Object], required: true },
    summarized: { type: Boolean, default: false },
    hideDetails: { type: Boolean, default: false },
    showUser: { type: Boolean, default: false }
  },
  data() {
    return {
      mdiCheckDecagram,
      mdiBookmark,
      mdiPin,
      showMenu: false,
      menuX: 0,
      menuY: 0
    }
  },
  computed: {
    id() {
      return this.type === 'message' ? this.value.chatId : this.value
    },
    isSelf() {
      return this.id === this.myId
    },
    /** @return {Chat} */
    chat() {
      return this.chatItems[this.id]
    },
    sender() {
      return this.getUser(this.message.senderUserId)
    },
    title() {
      if (this.isSelf) return 'Saved Messages'
      if (this.showUser) {
        return this.sender.firstName + ' ' + this.sender.lastName
      }
      return this.chat.title.trim() === '' ? 'Deleted Account' : this.chat.title
    },
    photo() {
      return this.showUser ? this.sender.profilePhoto : this.chat.photo
    },
    username() {
      return this.getUsername(this.chat)
    },
    memberCount() {
      return this.getGroupMemberCount(this.chat)
    },
    isVerified() {
      return this.chat.type._ === CHAT_TYPE.chatTypePrivate
        ? this.getUser(this.chat).isVerified
        : false
    },
    isOnline() {
      return this.chat.type._ === CHAT_TYPE.chatTypePrivate
        ? this.getUser(this.chat).status._ === USER_STATUS.userStatusOnline
        : false
    },
    isMuted() {
      return this.chat.notificationSettings.muteFor > 0
    },
    isTyping() {
      const actions = Object.keys(this.userChatActions).filter(v =>
        v.startsWith(this.chat.id)
      )
      if (!actions.length) return false
      const action = this.userChatActions[actions[0]]
      return action ? action._ === CHAT_ACTION.chatActionTyping : false
    },
    type() {
      return typeof this.value === 'object' ? 'message' : 'chat'
    },
    typeText() {
      if (this.chat.type.isChannel) return 'channel'
      if (this.chat.type._ === CHAT_TYPE.chatTypePrivate) return 'profile'
      return 'group'
    },
    message() {
      if (this.type === 'message') return this.value
      return this.chat.lastMessage
    },
    isService() {
      return isService(this.message)
    },
    subtitle() {
      if (!this.summarized && this.isTyping) return 'Typing...'

      if (this.type === 'message' || !this.summarized) {
        if (!this.message) return ''
        if (this.chat.draftMessage) {
          return 'Draft: ' + this.chat.draftMessage.inputMessageText.text.text
        }
        if (!this.message || !this.message.senderUserId) return ''
        const user = this.getUser(this.message.senderUserId)
        let username
        if (!this.message.isOutgoing) username = user.firstName + ': '
        else username = ''
        return username + getMessageContent(this.message)
      }

      let subtitle = this.username ? ['@' + this.username] : []
      if (this.memberCount) subtitle.push(this.memberCount + ' subscribers')

      return subtitle.join(', ')
    },
    timestamp() {
      if (this.type !== 'message' && this.summarized) return ''
      if (!this.message) return ''
      const pZeros = h => ('0' + h).slice(-2)
      const time = new Date(this.message.date * 1000)
      const hours = pZeros(time.getHours())
      const minutes = pZeros(time.getMinutes())
      return `${hours}:${minutes}`
    },
    ...mapState('tdlib/chat', ['chatItems', 'currentChat']),
    ...mapState('tdlib/user', ['userItems', 'userChatActions', 'myId']),
    ...mapGetters('tdlib/user', [
      'getGroupMemberCount',
      'getUsername',
      'getUser'
    ])
  },
  methods: {
    openChat() {
      airgram.api.addRecentlyFoundChat({
        chatId: this.chat.id
      })
      this.changeChat(this.chat.id)
    },
    togglePin() {
      airgram.api.toggleChatIsPinned({
        chatId: this.chat.id,
        isPinned: !this.chat.isPinned
      })
    },
    openMenu({ clientX, clientY }) {
      this.menuX = clientX
      this.menuY = clientY
      this.showMenu = true
    },
    toggleMute() {
      airgram.api.setChatNotificationSettings({
        chatId: this.chat.id,
        notificationSettings: {
          _: CHAT_NOTIFICATION_SETTINGS.chatNotificationSettings,
          muteFor: this.isMuted ? 0 : 2147483647,
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
    },
    toggleUnread() {
      if (this.chat.unreadCount > 0) {
        airgram.api.viewMessages({
          chatId: this.chat.id,
          forceRead: true,
          messageIds: [this.chat.lastMessage.id]
        })
      } else {
        airgram.api.toggleChatIsMarkedAsUnread({
          chatId: this.chat.id,
          isMarkedAsUnread: false
        })
      }
    },
    ...mapActions('tdlib/chat', ['changeChat']),
    ...mapMutations('config', ['setModalInfoChatId'])
  }
}
</script>
