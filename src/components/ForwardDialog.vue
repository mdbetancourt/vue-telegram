<template>
  <v-dialog :value="show" max-width="420" @input="$emit('update:show', $event)">
    <v-card
      v-if="messages.length"
      max-width="100%"
      min-height="80vh"
      class="d-flex flex-column justify-space-between"
      flat
    >
      <v-card-title class="shrink d-flex flex-column align-start">
        <h2 class="title py-2">Send to...</h2>
        <v-text-field
          v-model="search"
          placeholder="Search"
          class="ml-n3"
          style="width: 100%"
          clearable
          hide-details
          solo
          single-line
          flat
        />
      </v-card-title>
      <v-divider style="width: 100%" class="mt-n2" />
      <v-row style="position: relative" no-gutters>
        <v-item-group
          v-model="selected"
          multiple
          align="start"
          class="overflow-y-auto px-4 d-flex flex-wrap"
          style="position: absolute; top: 0; bottom:0; left:0; right:0"
        >
          <v-item
            v-for="chat in filterChats"
            :key="'fw' + chat.id"
            v-slot="{ active, toggle }"
            :value="chat.id"
            style="cursor: pointer"
          >
            <v-col
              cols="3"
              class="px-2 py-3 d-flex flex-column justify-center align-center"
              @click="toggle"
            >
              <v-badge :value="active" bottom overlap>
                <template v-slot:badge>
                  <v-icon color="white" small>{{ mdiCheck }}</v-icon>
                </template>
                <div :class="{ 'chat-selected': active }">
                  <c-avatar-image
                    :id="chat.id"
                    :size="active ? 38 : 48"
                    :title="getTitle(chat)"
                    :photo="chat.photo"
                  />
                </div>
              </v-badge>
              <span
                class="caption mt-2 text-center"
                style="height: 2.5rem; max-height: 2.5rem; overflow: hidden"
              >
                {{ getTitle(chat).slice(0, 23) }}
              </span>
            </v-col>
          </v-item>
        </v-item-group>
      </v-row>
      <v-divider style="width: 100%" />
      <v-card-actions class="px-4 shrink d-flex flex-column align-start">
        <v-text-field
          v-if="selected.length"
          v-model="comment"
          placeholder="Write a comment..."
          style="width: 100%"
          clearable
          hide-details
          solo
          single-line
          flat
        />
        <v-row no-gutters justify="end" style="width: 100%">
          <v-btn text color="primary" @click="$emit('update:show', false)">
            Cancel
          </v-btn>
          <v-btn
            v-if="selected.length"
            text
            color="primary"
            @click="sendForward"
          >
            Send
          </v-btn>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style>
.chat-selected {
  border: 2px solid var(--v-primary-base);
  border-radius: 50%;
  padding: 3px;
}
</style>
<script>
import { mapGetters } from 'vuex'
import { mdiCheck } from '@mdi/js'
import { airgram } from '../plugins/tdweb'
export default {
  props: {
    chatId: { type: Number, default: null },
    messages: { type: Array, default: () => [] },
    show: { type: Boolean, default: false }
  },
  data() {
    return {
      mdiCheck,
      selected: [],
      search: '',
      comment: ''
    }
  },
  computed: {
    filterChats() {
      if (!this.messages.length) return []
      if (!this.search) return this.sortedChats
      return this.sortedChats.filter(
        chat =>
          this.getTitle(chat)
            .toLowerCase()
            .indexOf(this.search.toLowerCase()) !== -1
      )
    },
    ...mapGetters('tdlib/chat', ['sortedChats'])
  },
  methods: {
    sendForward() {
      this.selected.map(chatId => {
        if (this.comment)
          airgram.api.sendMessage({
            replyToMessageId: 0,
            chatId,
            inputMessageContent: {
              _: 'inputMessageText',
              text: {
                text: this.comment,
                entities: []
              },
              clearDraft: false
            }
          })
        airgram.api.forwardMessages({
          chatId,
          fromChatId: this.chatId,
          messageIds: this.messages
        })
      })
      this.$emit('update:show', false)
    },
    getTitle(chat) {
      return chat.title.trim() === '' ? 'Deleted Account' : chat.title
    }
  }
}
</script>
