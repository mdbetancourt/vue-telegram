<template>
  <v-navigation-drawer permanent height="95vh" width="100%">
    <v-toolbar flat absolute height="64" width="100%">
      <template v-if="!isSearching">
        <v-menu offset-y>
          <template v-slot:activator="{ on }">
            <v-btn text icon v-on="on">
              <v-icon>{{ mdiMenu }}</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="logout">
              <v-list-item-title>
                Logout
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-toolbar-title>Telegram</v-toolbar-title>
      </template>
      <template v-else>
        <v-text-field
          ref="searchField"
          v-model="search"
          single-line
          hide-details
        />
      </template>

      <v-spacer />
      <v-btn icon @click="handleSearch">
        <v-icon>{{ isSearching ? mdiClose : mdiMagnify }}</v-icon>
      </v-btn>
    </v-toolbar>
    <div style="height: 64px"></div>

    <v-list
      id="chats-container"
      v-scroll:#chats-container="chatScroll"
      :nav="!isSearching"
      class="overflow-y-auto"
      style="max-height: calc(100% - 64px)"
    >
      <template v-if="!isSearching">
        <c-chat-user
          v-for="chat in localChats"
          :key="chat.id"
          :value="chat.id"
        />
      </template>
      <template v-else>
        <v-list-item-group color="primary">
          <template v-if="!searchIn">
            <v-subheader v-show="chats.length">
              Chats and contacts
            </v-subheader>
            <c-chat-user
              v-for="chat in chats"
              :key="'local' + (chat.id || chat)"
              :summarized="isSearching"
              :value="chat"
            />
            <v-subheader v-show="recently.length">Recently</v-subheader>
            <c-chat-user
              v-for="chat in recently"
              :key="'recent-' + (chat.id || chat)"
              :summarized="isSearching"
              :value="chat"
            />
            <v-subheader v-show="publicChats.length">
              Global search
            </v-subheader>
            <c-chat-user
              v-for="chat in publicChats"
              :key="'public-' + (chat.id || chat)"
              :summarized="isSearching"
              :value="chat"
            />
          </template>
          <template v-else>
            <v-subheader>
              Search messages in
            </v-subheader>
            <c-chat-user hide-details :value="searchIn" />
          </template>

          <v-subheader v-show="messagesCount">
            {{ `Found ${messagesCount} messages` }}
          </v-subheader>
          <v-subheader v-show="!messagesCount">No messages found</v-subheader>
          <c-chat-user
            v-for="chat in messages"
            :key="'found-' + (chat.id || chat)"
            :summarized="isSearching"
            :show-user="!!searchIn"
            :value="chat"
          />
        </v-list-item-group>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
import { mdiMenu, mdiMagnify, mdiClose } from '@mdi/js'
import { airgram } from '../plugins/tdweb'
import { mapActions, mapState, mapGetters, mapMutations } from 'vuex'
import { deleteDB } from 'idb'
import { MAX_OFFSET } from '../modules/constants'

export default {
  data() {
    return {
      mdiMenu,
      mdiMagnify,
      mdiClose,
      search: '',
      doSearch: false,
      conversation: null,
      maxChats: 10,
      loaded: false,
      currentChats: []
    }
  },
  computed: {
    localChats() {
      if (!this.loaded) return []
      return this.sortedChats.slice(0, this.maxChats)
    },
    isSearching() {
      return this.doSearch || !!this.searchIn
    },
    ...mapState('tdlib/search', [
      'publicChats',
      'recently',
      'chats',
      'messages',
      'searchIn',
      'messagesCount'
    ]),
    ...mapState('tdlib/chat', ['currentChat']),
    ...mapGetters('tdlib/chat', ['sortedChats', 'getChat'])
  },
  watch: {
    search: async function(query) {
      await this.searchAll({ query })
    }
  },
  mounted: async function() {
    await airgram.api.getChats({
      offsetOrder: MAX_OFFSET, // first chats
      offsetChatId: 0, // unknown chat id
      limit: 15
    })
    this.loaded = true
  },
  methods: {
    async logout() {
      await airgram.api.logOut()
      await deleteDB('tdlib')
      localStorage.clear()
    },
    async handleSearch() {
      this.doSearch = !this.doSearch && !this.searchIn
      this.search = ''
      await this.$nextTick()
      if (this.doSearch && !this.searchIn) this.$refs.searchField.focus()
      if (this.searchIn) this.setSearchIn(null)
    },
    async chatScroll({ target }) {
      const totalScroll = target.scrollHeight - target.offsetHeight
      const currentScroll = target.scrollTop
      if (currentScroll !== totalScroll) return
      const lastChat = this.sortedChats[this.sortedChats.length - 1]
      if (!lastChat) return
      await airgram.api.getChats({
        offsetOrder: lastChat.order, // first chats
        offsetChatId: lastChat.id, // unknown chat id
        limit: 15
      })
      this.maxChats += 15
    },
    ...mapMutations('tdlib/search', ['setSearchIn']),
    ...mapActions('tdlib/search', ['searchAll'])
  }
}
</script>
