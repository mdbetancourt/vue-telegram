<template>
  <v-menu
    absolute
    close-on-content-click
    close-on-click
    :disabled="content.poll.isClosed || (!message.isOutgoing && !isChosen)"
  >
    <template v-slot:activator="{ on }">
      <v-list
        dense
        flat
        :disabled="content.poll.isClosed"
        @click.prevent.native.stop.right="on.click"
      >
        <v-list-item-group>
          <span class="subtitle-2 text-wrap">
            {{ content.poll.question }}<br />
          </span>
          <span class="caption">
            {{ subtitle }}
          </span>
          <template v-for="(option, idx) in content.poll.options">
            <v-divider :key="'divider-' + option.text" />
            <v-list-item
              :key="`option-${content.poll.question}-${option.text}`"
              @click.prevent.stop="select(idx)"
            >
              <v-list-item-action>
                <v-icon v-if="!isChosen">{{ mdiCircleOutline }}</v-icon>
                <span v-else style="min-width: 35px">
                  {{ option.votePercentage }}%
                </span>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title v-if="!isChosen" v-text="option.text" />
                <v-progress-linear
                  v-else
                  :value="option.votePercentage"
                  active
                  color="primary"
                  rounded
                />
              </v-list-item-content>
            </v-list-item>
          </template>
          <v-divider />

          <v-subheader class="body-2">{{ totalVoterCount }}</v-subheader>
        </v-list-item-group>
      </v-list>
    </template>
    <v-list>
      <v-list-item v-if="isChosen" @click="select()">
        <v-list-item-title>Retract Vote</v-list-item-title>
      </v-list-item>
      <v-list-item v-if="message.isOutgoing" @click="stop">
        <v-list-item-title>Stop Poll</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
import { mdiCircleOutline } from '@mdi/js'
import { airgram } from '../plugins/tdweb'

/** @typedef {import('@airgram/api').Message} Message */
export default {
  props: {
    /** @type {import('vue').PropOptions<Message>} message */
    message: { type: Object, required: true }
  },
  data() {
    return { mdiCircleOutline }
  },
  computed: {
    /** @returns {import('@airgram/api').MessagePoll} Message */
    content() {
      return this.message.content
    },
    subtitle() {
      if (this.content.poll.isClosed) return 'Final Results'

      return 'Anonymous Poll'
    },
    isChosen() {
      return this.content.poll.options.some(po => po.isChosen)
    },
    totalVoterCount() {
      if (!this.content.poll.totalVoterCount) return 'No votes'
      if (this.content.poll.totalVoterCount === 1) return '1 vote'
      return this.content.poll.totalVoterCount + ' votes'
    }
  },
  methods: {
    select(optionId) {
      airgram.api.setPollAnswer({
        chatId: this.message.chatId,
        messageId: this.message.id,
        optionIds: Number.isInteger(optionId) ? [optionId] : []
      })
    },
    stop() {
      airgram.api.stopPoll({
        chatId: this.message.chatId,
        messageId: this.message.id
      })
    }
  }
}
</script>

<style>
.content-audio .v-input__slot {
  margin-bottom: 0 !important;
}
</style>
