<template>
  <c-file-loader v-slot="{ source }" :file-id="thumbnail.photo.id">
    <v-img class="media-border" :src="source" contain v-bind="sizes">
      <v-row no-gutters class="fill-height flex-column" align="start">
        <span
          class="ma-2 px-2 white--text caption"
          style="background: #00000070; border-radius: 4px"
        >
          {{ duration + ' ' + size }}
        </span>
        <v-spacer />
        <v-btn fab color="#00000070" depressed class="align-self-center">
          <v-icon color="white">
            {{ mdiPlay }}
          </v-icon>
        </v-btn>
        <v-spacer />
      </v-row>
    </v-img>
  </c-file-loader>
</template>

<script>
import { mdiPlay } from '@mdi/js'
import { convertTime, convertSize, fitSize } from '@/utils/media'

/**
 * @typedef {import('@airgram/api').Message} Message
 * @typedef {import('@airgram/api').MessageVideo} MessageVideo
 * */
export default {
  name: 'MessageVideo',
  props: {
    /** @type {import('vue').PropOptions<Message>} */
    message: { type: Object, required: true }
  },
  data() {
    return { mdiPlay }
  },
  computed: {
    /** @returns {MessageVideo} */
    content() {
      return this.message.content
    },
    thumbnail() {
      return this.content.video.thumbnail
    },
    duration() {
      return convertTime(this.content.video.duration)
    },
    size() {
      const video = this.content.video.video
      return convertSize(video.size || video.expectedSize)
    },
    sizes() {
      return fitSize(this.content.video)
    }
  }
}
</script>
