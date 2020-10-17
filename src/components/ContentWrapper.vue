<template>
  <v-alert
    class="my-1 py-0 body-2 content-wrapper px-1 d-flex"
    dense
    style="background: transparent"
    color="primary"
    border="left"
    colored-border
  >
    <template v-if="logo" v-slot:prepend>
      <c-file-loader v-slot="{ source }" :file-id="logo.id">
        <v-img
          :src="source"
          style="border-radius: 6px"
          height="40"
          width="40"
          max-height="40"
          max-width="40"
        />
      </c-file-loader>
    </template>

    <slot>
      <h4 class="ml-3 primary--text body-2">{{ title }}</h4>
      <span
        class="ml-3 body-2 d-block text-truncate"
        style="color: rgba(0, 0, 0, 0.54); max-width: 40vw"
        >{{ description }}</span
      >
    </slot>

    <slot name="append">
      <v-img v-if="image" :src="image" />
    </slot>
  </v-alert>
</template>
<style>
.content-wrapper .v-alert__border.v-alert__border--left {
  border-width: thin;
}
</style>

<script>
export default {
  props: {
    logo: { type: [Object, null], default: null },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: [String, null], required: false, default: null }
  }
}
</script>
