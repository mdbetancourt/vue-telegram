<template>
  <v-navigation-drawer right height="95vh" width="100%">
    <c-full-user-info :chat-id="currentChat" @close="togglePanelInfo" />
  </v-navigation-drawer>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

export default {
  computed: {
    ...mapState('tdlib/chat', ['currentChat'])
  },
  methods: mapMutations('config', ['togglePanelInfo'])
}
</script>
