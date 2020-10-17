<template>
  <v-dialog width="30vw" :value="value" @input="reset">
    <v-card>
      <v-card-title
        class="white"
        style="position: sticky; top: 0px; z-index: 100"
      >
        New Poll
      </v-card-title>
      <v-card-text class="primary--text body-1 py-0">Question</v-card-text>
      <v-card-actions class="mx-1">
        <v-text-field
          v-model="question"
          hide-details
          single-line
          flat
          solo
          placeholder="Ask a question"
        />
      </v-card-actions>

      <v-card-text class="primary--text body-1 mb-2 py-0">
        Poll options
      </v-card-text>
      <v-text-field
        v-for="i in count"
        :key="'opt-' + i"
        v-model="inputs[i - 1]"
        hide-details
        autofocus
        :append-icon="i === count ? mdiClose : undefined"
        class="mx-3"
        single-line
        flat
        solo
        placeholder="Option..."
        @click:append="() => (count -= 1)"
      />
      <v-btn
        v-if="count < 10"
        block
        text
        class="body-1 grey--text justify-start px-6"
        style="text-transform: none"
        @click="() => (count += count <= 10)"
      >
        Add an option...
      </v-btn>

      <v-card-text v-if="count < 10">
        You can add {{ 10 - count }} more options
      </v-card-text>
      <v-card-text v-else>
        You have added the maximum number of options
      </v-card-text>
      <v-card-actions class="d-flex justify-end">
        <v-btn text color="primary" @click="reset">
          Cancel
        </v-btn>
        <v-btn v-if="validation" text color="primary" @click="send">
          Send
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mdiClose } from '@mdi/js'

export default {
  props: {
    value: { type: Boolean, default: false }
  },
  data() {
    return {
      count: 0,
      inputs: Array(10).fill(''),
      mdiClose,
      question: ''
    }
  },
  computed: {
    options() {
      return this.inputs.slice(0, this.count)
    },
    validation() {
      return this.count >= 2 && this.question && this.options.every(v => !!v)
    }
  },
  methods: {
    send() {
      this.$emit('send', { question: this.question, options: this.options })
      this.reset()
    },
    reset() {
      this.$emit('input', false)
      this.question = ''
      this.inputs = Array(10).fill('')
      this.count = 0
    }
  }
}
</script>
