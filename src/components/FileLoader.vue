<script>
import { mapState, mapActions } from 'vuex'
import { getObject } from '../plugins/db'
import { airgram } from '../plugins/tdweb'
import { convertSize } from '../utils/media'

/** @typedef {import('@airgram/api').File} File */
export default {
  name: 'FileLoader',
  props: {
    lazy: { type: Boolean, default: false },
    priority: { type: Number, default: 1 },
    fileId: { type: [Number, null], default: null }
  },
  data: () => {
    return {
      source: ''
    }
  },
  computed: {
    file() {
      return this.mediaItems[this.fileId] || null
    },
    isDownloadingActive() {
      return this.file ? this.file.local.isDownloadingActive : false
    },
    isDownloadingCompleted() {
      return this.file ? this.file.local.isDownloadingCompleted : false
    },
    size() {
      if (!this.file) return 0
      return this.file.size === 0 ? this.file.expectedSize : this.file.size
    },
    formattedProgress() {
      if (!this.file) return ''
      const [size, tLetter] = convertSize(this.size)
      if (this.isDownloadingCompleted || !this.isDownloadingActive)
        return `${size} ${tLetter}`
      const [progress, pLetter] = convertSize(this.downloadedSize)

      return `${progress} ${pLetter}/${size} ${tLetter}`
    },
    downloadedSize() {
      if (!this.file) return 0
      return this.file.local.downloadedSize
    },
    progress() {
      if (!this.file) return 0
      if (this.isDownloadingCompleted) return 100
      return (this.downloadedSize / this.size) * 100
    },
    ...mapState('tdlib/media', ['mediaItems'])
  },
  watch: {
    isDownloadingCompleted: async function(value) {
      if (value) {
        this.$emit('downloaded')
      }
      this.readFile()
    }
  },
  created() {
    this.getFile(this.fileId)
  },
  mounted: async function() {
    /** @type {File} */
    const id = this.fileId
    if (!this.isDownloadingCompleted && !this.lazy) {
      await this.downloadFile({ id, priority: this.priority })
    }
    await this.readFile()
  },
  beforeDestroy() {
    window.URL.revokeObjectURL(this.source)
  },
  methods: {
    async startDownload() {
      await this.downloadFile({ id: this.fileId, priority: this.priority })
      await this.readFile()
    },
    async cancelDownload() {
      await airgram.api.cancelDownloadFile({ fileId: this.fileId })
    },
    readFile: async function() {
      if (this.isDownloadingCompleted === true && this.file) {
        const blob = await getObject(this.file.remote.id)
        this.source = URL.createObjectURL(blob) || ''
        this.$emit('ready', this.source)
      }
    },
    ...mapActions('tdlib/media', ['downloadFile', 'getFile'])
  },
  render: function() {
    return this.$scopedSlots.default({
      source: this.source,
      progress: this.progress,
      size: this.size,
      startDownload: this.startDownload,
      cancelDownload: this.cancelDownload,
      formattedProgress: this.formattedProgress,
      isDownloadingActive: this.isDownloadingActive,
      isDownloadingCompleted: this.isDownloadingCompleted
    })
  }
}
</script>
