<template>
  <v-row class="shrink" no-gutters style="width: 100%">
    <c-conversation-input-poll v-model="showPoll" @send="handlePoll" />

    <template v-if="inputType === 'input'">
      <div v-if="replyId" style="width: 100%; position: relative; height: 64px">
        <v-row
          no-gutters
          style="width: 100%; position: absolute; top: 0; left: 0; right: 0; bottom: 0"
          class="flex-nowrap mt-1"
        >
          <v-btn icon large class="ma-2">
            <v-icon class="mx-2" color="primary">{{ mdiReply }}</v-icon>
          </v-btn>
          <c-conversation-message-reply
            :chat-id="chat.id"
            :message-id="replyId"
          />
          <v-spacer />
          <v-btn
            icon
            large
            class="mx-2 my-2"
            @click="$emit('update:replyId', 0)"
          >
            <v-icon color="primary">{{ mdiClose }}</v-icon>
          </v-btn>
        </v-row>
      </div>

      <v-row no-gutters style="width: 100%" class="flex-nowrap">
        <c-conversation-input-picker
          @emoji="emojiHandler"
          @sticker="sendSticker"
        />

        <v-textarea
          v-model="message"
          auto-grow
          solo
          rows="1"
          flat
          background-color="transparent"
          clearable
          hide-details
          class="remove-margin my-2"
          placeholder="Message"
          @keydown.enter.prevent="sendMessage"
        />

        <v-menu top offset-y>
          <template v-slot:activator="{ on }">
            <v-btn icon large class="mx-2 my-2" v-on="on">
              <v-icon>{{ mdiAttachment }}</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="() => $refs.inputImage.click()">
              <v-list-item-icon>
                <v-icon>{{ mdiImage }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Photo</v-list-item-title>
              </v-list-item-content>
              <input
                ref="inputImage"
                type="file"
                style="display: none"
                multiple
                accept="image/*"
                @change="handleFile($event, 'image')"
              />
            </v-list-item>

            <v-list-item @click="() => $refs.inputFile.click()">
              <v-list-item-icon>
                <v-icon>{{ mdiFile }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>File</v-list-item-title>
              </v-list-item-content>
              <input
                ref="inputFile"
                type="file"
                style="display: none"
                multiple
                @change="handleFile($event, 'document')"
              />
            </v-list-item>

            <v-list-item @click="() => (showPoll = true)">
              <v-list-item-icon>
                <v-icon>{{ mdiPoll }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Poll</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-btn icon large class="mx-2 my-2" @click="sendMessage">
          <v-icon color="primary">{{ mdiSend }}</v-icon>
        </v-btn>
      </v-row>
    </template>
    <template
      v-else-if="['delete', 'join', 'notifications'].includes(inputType)"
    >
      <v-btn
        text
        class="my-2 mx-auto"
        large
        color="primary"
        @click="handleButton"
      >
        <span v-if="inputType === 'delete'">
          Delete and exit
        </span>
        <span v-else-if="inputType === 'join'">
          Join
        </span>
        <span v-else>
          {{ isMuted ? 'Unmute' : 'Mute' }}
        </span>
      </v-btn>
    </template>
  </v-row>
</template>

<script>
import {
  mdiAttachment,
  mdiSend,
  mdiImage,
  mdiReply,
  mdiFile,
  mdiClose,
  mdiPoll
} from '@mdi/js'
import { airgram } from '../plugins/tdweb'
import {
  INPUT_MESSAGE_CONTENT,
  DRAFT_MESSAGE,
  FORMATTED_TEXT,
  CHAT_NOTIFICATION_SETTINGS,
  CHAT_TYPE,
  CHAT_MEMBER_STATUS
} from '@airgram/api'
import { mapGetters } from 'vuex'
import { readImageSize } from '../utils/common'

export default {
  props: {
    chat: { type: Object, required: true },
    replyId: { type: [Number, null], default: null }
  },
  data() {
    return {
      mdiAttachment,
      mdiSend,
      mdiImage,
      mdiReply,
      mdiClose,
      mdiFile,
      mdiPoll,
      message: '',
      showPoll: false
    }
  },
  computed: {
    isChannel() {
      return !!this.chat.type.isChannel
    },
    inputType() {
      const fullInfo = this.getUser(this.chat)
      if (!fullInfo) return null
      let choices = {
        [CHAT_TYPE.chatTypeBasicGroup]: {
          [CHAT_MEMBER_STATUS.chatMemberStatusCreator]: () => 'input',
          [CHAT_MEMBER_STATUS.chatMemberStatusAdministrator]: () => 'input',
          [CHAT_MEMBER_STATUS.chatMemberStatusMember]: () => 'input',
          [CHAT_MEMBER_STATUS.chatMemberStatusRestricted]: () => {
            if (!fullInfo.status.isMember) return 'join'
            if (!fullInfo.status.canSendMessages) return null
            return 'input'
          },
          [CHAT_MEMBER_STATUS.chatMemberStatusLeft]: () => null,
          [CHAT_MEMBER_STATUS.chatMemberStatusBanned]: () => 'delete'
        },
        [CHAT_TYPE.chatTypeSupergroup]: {
          [CHAT_MEMBER_STATUS.chatMemberStatusCreator]: () => 'input',
          [CHAT_MEMBER_STATUS.chatMemberStatusAdministrator]: () => 'input',
          [CHAT_MEMBER_STATUS.chatMemberStatusMember]: () =>
            fullInfo.isChannel ? 'notifications' : 'input',
          [CHAT_MEMBER_STATUS.chatMemberStatusRestricted]: () => {
            if (!fullInfo.status.isMember) return 'join'
            if (!fullInfo.status.canSendMessages) return null
            return 'input'
          },
          [CHAT_MEMBER_STATUS.chatMemberStatusLeft]: () => 'join',
          [CHAT_MEMBER_STATUS.chatMemberStatusBanned]: () => 'delete'
        }
      }
      const choice = choices[this.chat.type._]
      return choice === undefined ? 'input' : choice[fullInfo.status._]()
    },
    isMuted() {
      return this.chat.notificationSettings.muteFor > 0
    },
    ...mapGetters('tdlib/user', ['getUser'])
  },
  watch: {
    'chat.id': async function(newId, chatId) {
      await airgram.api.setChatDraftMessage({
        chatId,
        draftMessage: {
          _: DRAFT_MESSAGE.draftMessage,
          replyToMessageId: this.replyId || 0,
          inputMessageText: {
            _: INPUT_MESSAGE_CONTENT.inputMessageText,
            clearDraft: false,
            disableWebPagePreview: true,
            text: {
              _: FORMATTED_TEXT.formattedText,
              entities: null,
              text: this.message
            }
          }
        }
      })
      if (this.chat.draftMessage) {
        this.message = this.chat.draftMessage.inputMessageText.text.text
        this.$emit('update:replyId', this.chat.draftMessage.replyToMessageId)
      } else {
        this.message = ''
        this.$emit('update:replyId', 0)
      }
    }
  },
  methods: {
    emojiHandler({ native }) {
      this.message += native
    },
    async handlePoll({ question, options }) {
      await airgram.api.sendMessage({
        chatId: this.chat.id,
        replyToMessageId: this.replyId || 0,
        inputMessageContent: {
          _: 'inputMessagePoll',
          question,
          options
        }
      })
    },
    handlePhoto(data) {
      airgram.api.sendMessage({
        chatId: this.chat.id,
        replyToMessageId: this.replyId || 0,
        inputMessageContent: {
          _: 'inputMessagePhoto',
          photo: {
            _: 'inputFileBlob',
            name: data.name,
            data
          },
          width: data.photoWidth,
          height: data.photoHeight
        }
      })
    },
    handleDocument(data) {
      airgram.api.sendMessage({
        chatId: this.chat.id,
        replyToMessageId: this.replyId || 0,
        inputMessageContent: {
          _: 'inputMessageDocument',
          document: {
            _: 'inputFileBlob',
            name: data.name,
            data
          }
        }
      })
    },
    handleFile({ target }, type) {
      if (!target || !target.files || !target.files.length) return
      Array.from(target.files).forEach(async file => {
        if (type === 'document') this.handleDocument(file)
        else this.handlePhoto(await readImageSize(file))
      })
    },
    handleButton() {
      if (this.inputType === 'notifications')
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
      else if (this.inputType === 'join')
        airgram.api.joinChat({
          chatId: this.chat.id
        })
      else
        airgram.api.leaveChat({
          chatId: this.chat.id
        })
    },
    async sendSticker({ sticker, thumbnail, height, width }) {
      await airgram.api.sendMessage({
        chatId: this.chat.id,
        replyToMessageId: this.replyId || 0,
        inputMessageContent: {
          _: INPUT_MESSAGE_CONTENT.inputMessageSticker,
          sticker: {
            _: 'inputFileId',
            id: sticker.id
          },
          thumbnail: {
            _: 'inputThumbnail',
            thumbnail: {
              _: 'inputFileId',
              id: thumbnail.photo.id
            },
            width: thumbnail.width,
            height: thumbnail.height
          },
          height,
          width
        }
      })
      this.resetAfterSend()
    },
    async sendMessage() {
      await airgram.api.sendMessage({
        chatId: this.chat.id,
        replyToMessageId: this.replyId || 0,
        inputMessageContent: {
          _: INPUT_MESSAGE_CONTENT.inputMessageText,
          clearDraft: true,
          text: {
            text: this.message,
            entities: []
          }
        }
      })
      this.resetAfterSend()
    },
    resetAfterSend() {
      this.message = ''
      this.$emit('update:replyId', 0)
      this.$vuetify.goTo('#last-message', { container: '#messages-container' })
    }
  }
}
</script>

<style>
.remove-margin .v-text-field__slot > * {
  margin-top: 0 !important;
}
.remove-margin .v-input__append-inner {
  margin-top: 12px !important;
}
</style>
