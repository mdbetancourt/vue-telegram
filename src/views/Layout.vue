<template>
  <v-card max-height="100%">
    <v-row align="stretch" style="height: 100%" no-gutters>
      <v-col style="width: 24vw"><c-panel-chats /></v-col>
      <v-col style="min-width: 50vw"><c-panel-messages /></v-col>
      <v-col v-if="showPanelInfo" style="width: 24vw"><c-panel-info /></v-col>
      <c-message-viewer />
    </v-row>
    <v-dialog v-model="showModal" max-width="330">
      <v-card flat>
        <c-full-user-info
          :chat-id="modalInfoChatId"
          @close="setModalInfoChatId(0)"
        />
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
export default {
  computed: {
    showModal: {
      set(value) {
        if (!value) this.setModalInfoChatId(0)
      },
      get() {
        return this.modalInfoChatId
      }
    },
    ...mapState('config', ['showPanelInfo', 'modalInfoChatId'])
  },
  methods: mapMutations('config', ['setModalInfoChatId'])
}
</script>
