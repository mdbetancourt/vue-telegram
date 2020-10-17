<template>
  <v-menu :close-on-content-click="false" open-on-hover top offset-y>
    <template v-slot:activator="{ on }">
      <v-btn icon large class="ma-2" v-on="on">
        <v-icon class="mx-2">{{ mdiEmoticonHappyOutline }}</v-icon>
      </v-btn>
    </template>
    <v-card
      class="d-flex flex-column"
      min-width="320"
      min-height="334"
      max-width="320"
      max-height="334"
    >
      <v-tabs v-model="selected" height="34" class="shrink" grow hide-slider>
        <v-tab>Emojis</v-tab>
        <v-tab>Stickers</v-tab>
      </v-tabs>
      <div v-show="selected === 0">
        <picker
          class="mx-auto"
          :data="emojiIndex"
          native
          set="apple"
          :per-line="8"
          style="height: 300px"
          :show-preview="false"
          @select="$emit('emoji', $event)"
        />
      </div>
      <div v-show="selected === 1" style="height: 300px">
        <div id="sticker-container" class="overflow-y-auto fill-height px-2">
          <v-row
            v-for="{ id, title, stickers } in filtersSets"
            :key="id"
            v-scroll:#sticker-container="stickerScroll"
            no-gutters
          >
            <span
              class="body-2 white py-1 stick"
              style="width: 100%; z-index: 99"
            >
              {{ title }}
            </span>
            <v-row wrap no-gutters class="fill-height" justify="space-around">
              <v-btn
                v-for="sticker in stickers"
                :key="sticker.sticker.id"
                text
                class="pa-1"
                icon
                style="min-width: 60px; max-width: 60px; min-height: 60px; max-height: 60px"
                @click="$emit('sticker', sticker)"
              >
                <c-content-render-sticker
                  disable-thumbnail
                  :sticker="sticker"
                />
              </v-btn>
            </v-row>
          </v-row>
        </div>
      </div>
    </v-card>
  </v-menu>
</template>
<style>
.stick {
  position: sticky;
  top: 0px;
}
</style>
<script>
import { Picker, EmojiIndex } from 'emoji-mart-vue-fast'
import { mdiEmoticonHappyOutline } from '@mdi/js'
import 'emoji-mart-vue-fast/css/emoji-mart.css'
import data from 'emoji-mart-vue-fast/data/apple.json'
import { airgram } from '../plugins/tdweb'
import { debounce } from '../utils/common'
const emojiIndex = new EmojiIndex(data)
export default {
  components: { Picker },

  data() {
    return {
      mdiEmoticonHappyOutline,
      selected: 0,
      emojiIndex,
      currentlyScroll: 30,
      stickerSets: []
    }
  },
  computed: {
    preFilterSets() {
      let count = 0
      return this.stickerSets.filter(crr => {
        if (count < this.currentlyScroll) {
          count += crr.stickers.length
          return true
        }
        return false
      })
    },
    filtersSets() {
      let count = 0
      return this.preFilterSets.map((value, idx) => {
        count += value.stickers.length
        if (idx !== this.preFilterSets.length - 1) return value
        return {
          ...value,
          stickers: value.stickers.slice(0, this.currentlyScroll - count)
        }
      })
    }
  },
  async mounted() {
    const stickers = await airgram.api.getInstalledStickerSets({
      isMasks: false
    })
    if (stickers._ === 'error') return console.error('Fail fetch stickers')
    const promises = stickers.sets.map(sticker =>
      airgram.api.getStickerSet({
        setId: sticker.id
      })
    )
    const stickersSets = await Promise.all(promises)
    this.stickerSets = stickersSets.filter(result => result._ === 'stickerSet')
  },
  methods: {
    stickerScroll: debounce(function({ target }) {
      const totalScroll = target.scrollHeight - target.offsetHeight
      const currentScroll = target.scrollTop
      if (currentScroll > totalScroll * 0.85) {
        this.currentlyScroll += 20
      }
    })
  }
}
</script>
