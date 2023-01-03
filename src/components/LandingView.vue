<template>
  <v-container class="fill-height">
    <v-sheet
      class="d-flex flex-column justify-center align-center pa-4"
      :style="{ gap: '20px' }"
    >
      <p class="text-high-emphasis">Create awesome emoji mosaics!</p>

      <v-avatar color="info" size="150">
        <v-img src="/obama-mos.png" alt="Obama" :cover="false"></v-img>
      </v-avatar>
      <v-file-input
        @change="onUpload"
        ref="fileInput"
        class="d-none"
        label="File input"
      ></v-file-input>
      <v-btn @click="fileInput?.click()" round color="primary" dark
        >Upload an image</v-btn
      >
    </v-sheet>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, defineEmits } from 'vue';
const emit = defineEmits<{ (e: 'fileUpload', file: File): void }>();
const fileInput = ref<HTMLInputElement | null>(null);

function onUpload() {
  if (!fileInput.value || !fileInput.value?.files?.length) return;
  const file = fileInput.value.files[0];
  emit('fileUpload', file);
}
</script>
