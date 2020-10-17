<template>
  <v-col cols="5" style="min-width: 390px">
    <v-card class="pa-12">
      <v-form ref="form" v-model="valid" @submit.prevent.stop="nextHandler">
        <h2 class="title mb-6">{{ title }}</h2>
        <p class="body-1">{{ subtitle }}</p>
        <v-text-field
          v-model="fieldText"
          :rules="rule"
          :counter="counter"
          :disabled="disabled"
          required
        />

        <v-row>
          <v-col v-if="isNeededBack">
            <v-btn
              :disabled="disabled"
              text
              block
              color="warning"
              @click="clean"
            >
              Back
            </v-btn>
          </v-col>
          <v-col>
            <v-btn
              text
              block
              :disabled="disabled || !valid"
              color="primary"
              type="submit"
            >
              Next
              <v-icon right>{{ mdiSend }}</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-card>
  </v-col>
</template>

<script>
import { mdiSend } from '@mdi/js'
import { airgram } from '@/plugins/tdweb'
import { AUTHENTICATION_CODE_TYPE, AUTHORIZATION_STATE } from '@airgram/api'
import { mapState, mapMutations, mapGetters } from 'vuex'

const {
  authenticationCodeTypeTelegramMessage,
  authenticationCodeTypeSms,
  authenticationCodeTypeCall,
  authenticationCodeTypeFlashCall
} = AUTHENTICATION_CODE_TYPE
const {
  authorizationStateWaitPhoneNumber,
  authorizationStateClosed,
  authorizationStateWaitCode
} = AUTHORIZATION_STATE

export default {
  data() {
    return {
      mdiSend,
      fieldText: '',
      disabled: false,
      valid: false
    }
  },
  computed: {
    title() {
      const messages = {
        [authorizationStateClosed]: 'Your phone',
        [authorizationStateWaitPhoneNumber]: 'Your phone',
        [authorizationStateWaitCode]: 'Your code'
      }
      return messages[this.current]
    },
    subtitle() {
      const messages = {
        null: 'Please confirm your country code and enter your phone number.',
        [authenticationCodeTypeCall]: `Telegram dialed your number`,
        [authenticationCodeTypeFlashCall]: `Telegram dialed your number`,
        [authenticationCodeTypeSms]: `We have sent you a message with activation code to your phone. Please enter it below.`,
        [authenticationCodeTypeTelegramMessage]: `Please enter the code you've just received in your previous Telegram app.`
      }

      return messages[this.codeType]
    },
    rule() {
      const rules = {
        [authorizationStateWaitPhoneNumber]: [
          v => !!v || 'Phone is required',
          v =>
            (typeof v === 'string' && !!v.match(/^[\d]+$/)) ||
            'Phone must be only numbers',
          v =>
            (typeof v === 'string' && v.length === 12) ||
            'Phone must have 12 numbers'
        ],
        [authorizationStateWaitCode]: [
          v => !!v || 'Code is required',
          v =>
            (typeof v === 'string' && !!v.match(/^[\d]+$/)) ||
            'Code must be only numbers',
          v =>
            (typeof v === 'string' && v.length === 5) ||
            'Code must have 5 numbers'
        ]
      }
      return rules[this.current]
    },
    counter() {
      const counters = {
        [authorizationStateWaitPhoneNumber]: 12,
        [authorizationStateWaitCode]: this.codeLength
      }
      return counters[this.current]
    },
    isNeededBack() {
      return this.current === authorizationStateWaitCode
    },
    ...mapState('tdlib/auth', ['current']),
    ...mapGetters('tdlib/auth', ['codeType', 'codeLength'])
  },
  methods: {
    async nextHandler() {
      if (!this.$refs.form.validate()) return
      this.disable = true
      let result
      switch (this.current) {
        case authorizationStateWaitPhoneNumber:
          await airgram.api.setAuthenticationPhoneNumber({
            phoneNumber: this.fieldText
          })
          airgram.api.code
          break
        case authorizationStateWaitCode:
          result = await airgram.api.checkAuthenticationCode({
            code: this.fieldText,
            firstName: 'A',
            lastName: 'B'
          })
          if (result._ === 'ok') localStorage.isLoggedIn = true
          break
      }
      if (this.$refs.form) this.$refs.form.reset()
      this.disabled = false
    },
    clean() {
      this.reset()
    },
    ...mapMutations('tdlib/auth', ['reset'])
  }
}
</script>
