<template>
  <v-app style="user-select: none">
    <v-content>
      <v-container fluid style="height: 100%">
        <v-row class="mx-auto fill-height" align="center" justify="center">
          <p-layout v-if="isLoggedIn" />
          <p-login v-else />
        </v-row>
      </v-container>
    </v-content>
  </v-app>
</template>
<style>
html,
body {
  overflow-y: hidden !important;
}
</style>
<script>
import PLayout from '@/views/Layout.vue'
import PLogin from '@/views/Login.vue'
import { mapGetters } from 'vuex'

export default {
  name: 'App',
  components: { PLayout, PLogin },
  computed: {
    ...mapGetters('tdlib/auth', ['isLoggedIn'])
  }
}
</script>
