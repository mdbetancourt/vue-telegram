<script>
import { mapGetters, mapState } from 'vuex'
import { MESSAGE_CONTENT, USER_TYPE } from '@airgram/api'
import { isService } from '../utils/messages'

function getTTLString(ttl) {
  if (ttl < 60) {
    const seconds = ttl === 1 ? 'second' : 'seconds'
    return `${ttl} ${seconds}`
  }
  if (ttl < 60 * 60) {
    const minutes = Math.floor(ttl / 60) === 1 ? 'minute' : 'minutes'
    return `${ttl} ${minutes}`
  }
  if (ttl < 24 * 60 * 60) {
    const hours = Math.floor(ttl / 60 / 60) === 1 ? 'hour' : 'hours'
    return `${ttl} ${hours}`
  }
  if (ttl < 7 * 24 * 60 * 60) {
    const days = Math.floor(ttl / 60 / 60 / 24) === 1 ? 'day' : 'days'
    return `${ttl} ${days}`
  }
  if (ttl === 7 * 24 * 60 * 60) {
    return '1 week'
  }

  return `${ttl} seconds`
}

/** @typedef {import('@airgram/api').Message} Message */
export default {
  props: {
    /** @type {import('vue').PropOptions<Message>} message */
    message: { type: Object, required: true }
  },
  computed: {
    chat() {
      return this.getChat(this.message.chatId)
    },
    title() {
      return this.chat.title
    },
    sender() {
      return this.getUser(this.message.senderUserId)
    },
    subject() {
      if (this.isOutgoing) return 'You'

      return this.sender.type._ !== USER_TYPE.userTypeDeleted
        ? this.sender.firstName + ' ' + this.sender.lastName
        : 'DELETED'
    },
    isOutgoing() {
      return this.message.isOutgoing
    },
    isChannel() {
      return this.message.content
    },
    ...mapGetters('tdlib/chat', ['getChat']),
    ...mapGetters('tdlib/message', ['getMessage']),
    ...mapState('tdlib/user', ['myId']),
    ...mapGetters('tdlib/user', ['getUser'])
  },
  methods: {
    getFullName(userId) {
      const user = this.getUser(userId)
      if (user.type._ === USER_TYPE.userTypeDeleted) return 'DELETED'
      return user.firstName + ' ' + user.lastName
    },
    [MESSAGE_CONTENT.messageBasicGroupChatCreate]() {
      return `${this.subject} created group «${this.title}»`
    },
    [MESSAGE_CONTENT.messageChatChangePhoto]() {
      if (this.isChannel) return 'Channel photo updated'
      return `${this.subject} updated group photo`
    },
    [MESSAGE_CONTENT.messageChatDeletePhoto]() {
      if (this.isChannel) return 'Channel photo removed'
      return `${this.subject} removed group photo`
    },
    [MESSAGE_CONTENT.messagePinMessage]() {
      const author = this.message.senderUserId
        ? this.getFullName(this.message.senderUserId)
        : this.chat.title
      const pinnedMessage = this.getMessage(
        this.chat.id,
        this.message.content.messageId
      )
      if (!pinnedMessage || !pinnedMessage.content) {
        return author + ' pinned a message'
      }

      let pinnedContent = ' pinned a message'
      if (isService(pinnedMessage)) {
        pinnedContent = ' pinned a service message'
      } else {
        switch (pinnedMessage.content._) {
          case 'messageAnimation': {
            pinnedContent = ' pinned a GIF'
            break
          }
          case 'messageAudio': {
            pinnedContent = ' pinned a track'
            break
          }
          case 'messageCall': {
            pinnedContent = ' pinned a call'
            break
          }
          case 'messageContact': {
            pinnedContent = ' pinned a contact'
            break
          }
          case 'messageDocument': {
            pinnedContent = ' pinned a file'
            break
          }
          case 'messageExpiredPhoto': {
            pinnedContent = ' pinned a photo'
            break
          }
          case 'messageExpiredVideo': {
            pinnedContent = ' pinned a video'
            break
          }
          case 'messageGame': {
            pinnedContent = ' pinned a game'
            break
          }
          case 'messageInvoice': {
            pinnedContent = ' pinned an invoice'
            break
          }
          case 'messageLocation': {
            pinnedContent = ' pinned a map'
            break
          }
          case 'messagePhoto': {
            pinnedContent = ' pinned a photo'
            break
          }
          case 'messagePoll': {
            pinnedContent = ' pinned a poll'
            break
          }
          case 'messageSticker': {
            pinnedContent = ' pinned a sticker'
            break
          }
          case 'messageText': {
            const maxLength = 16
            const text = pinnedMessage.content.text.text
            if (text.length <= maxLength) {
              pinnedContent = ` pinned «${text}»`
            } else {
              pinnedContent = ` pinned «${text.substring(0, maxLength)}...»`
            }

            break
          }
          case 'messageUnsupported': {
            pinnedContent = ' pinned unsupported message'
            break
          }
          case 'messageVenue': {
            pinnedContent = ' pinned a venue'
            break
          }
          case 'messageVideo': {
            pinnedContent = ' pinned a video'
            break
          }
          case 'messageVideoNote': {
            pinnedContent = ' pinned a video message'
            break
          }
          case 'messageVoiceNote': {
            pinnedContent = ' pinned a voice message'
            break
          }
        }
      }
      return author + pinnedContent
    },
    [MESSAGE_CONTENT.messageChatJoinByLink]() {
      return `${this.subject} joined the group via invite link`
    },
    [MESSAGE_CONTENT.messageChatChangeTitle]() {
      if (this.isChannel) return `Channel name was changed to «${this.title}»`
      return `${this.subject} changed group name to «${this.title}»`
    },
    [MESSAGE_CONTENT.messageCustomServiceAction]() {
      return this.message.content.text
    },
    [MESSAGE_CONTENT.messageChatSetTtl]() {
      const ttlString = getTTLString(this.message.content.ttl)
      if (this.message.content.ttl <= 0)
        return `${this.subject} disabled the self-destruct timer`
      return `${this.subject} set the self-destruct timer to ${ttlString}`
    },
    [MESSAGE_CONTENT.messageChatUpgradeFrom]() {
      return 'The group was upgraded to a supergroup'
    },
    [MESSAGE_CONTENT.messageChatUpgradeTo]() {
      return 'Group migrated to a supergroup'
    },
    [MESSAGE_CONTENT.messageContactRegistered]() {
      return `${this.subject} just joined Telegram`
    },
    [MESSAGE_CONTENT.messageChatChangePhoto]() {
      if (this.isChannel) {
        return 'Channel photo updated'
      }
      return `${this.subject} updated group photo`
    },
    [MESSAGE_CONTENT.messageChatDeletePhoto]() {
      if (this.isChannel) {
        return 'Channel photo removed'
      }
      return `${this.subject} removed group photo`
    },
    [MESSAGE_CONTENT.messageChatAddMembers]() {
      const memberIds = this.message.content.memberUserIds
      const isOneAdded = memberIds.length === 1
      const isMe = memberIds[0] === this.myId
      const someoneIsJoined = memberIds[0] === this.message.senderUserId

      const members = memberIds.map(this.getFullName).join(', ')
      const message =
        isOneAdded && (someoneIsJoined || isMe)
          ? 'joined the group'
          : 'added ' + members

      return `${this.subject} ${message}`
    },
    [MESSAGE_CONTENT.messageChatDeleteMember]() {
      const isMe = this.message.content.user_id === this.myId
      const isSameUser = this.message.content.user_id === this.sender.id
      const message =
        isMe || isSameUser
          ? 'left the group'
          : 'removed ' + this.getFullName(this.message.content.user_id)
      return `${this.subject} ${message}`
    }
  },
  render(h) {
    if (this.message.ttl) {
      let type = 'message'
      if (this.message.content._ === MESSAGE_CONTENT.messagePhoto) {
        type = 'photo'
      } else if (this.message.content._ === MESSAGE_CONTENT.messageVideo) {
        type = 'video'
      }

      const text = ` sent a self-destructing ${type}. Please view it on your mobile`
      if (this.isOutgoing) {
        return h('span', 'You ' + text)
      }

      const user = this.getUser(this.message.senderUserId)
      return h('span', [user.firstName, text])
    }

    if (
      this[this.message.content._] &&
      typeof this[this.message.content._] === 'function'
    ) {
      return h('span', this[this.message.content._]())
    }

    return h('span', `[${this.message.content._}]`)
  }
}
</script>
