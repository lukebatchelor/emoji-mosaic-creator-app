<template>
  <v-container class="fill-height">
    <v-sheet
      class="d-flex flex-column justify-center align-center pa-4"
      :style="{ gap: '20px' }"
    >
      <p class="text-high-emphasis">Create awesome emoji mosaics!</p>
      <v-card>
        <v-img
          :src="heroImgSrc"
          max-height="80vh"
          max-width="80vw"
          width="400"
          ref="heroImg"
          @load="loadHighResHero"
        ></v-img>
      </v-card>
      <v-file-input
        @change="onUpload"
        id="file"
        ref="fileInput"
        class="d-none"
        label="File input"
      ></v-file-input>
      <v-btn @click="fileInput?.click()" round color="primary" dark>
        Upload an image
      </v-btn>
    </v-sheet>
  </v-container>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
const emit = defineEmits<{ (e: 'fileUpload', file: File): void }>();
const fileInput = ref<HTMLInputElement | null>(null);
const heroImg = ref<HTMLImageElement | null>(null);
const heroImgSrc = ref('scream-v-low.jpeg');

function onUpload() {
  if (!fileInput.value || !fileInput.value?.files?.length) return;
  const file = fileInput.value.files[0];
  emit('fileUpload', file);
}

function loadHighResHero(e: string | undefined) {
  if (!e?.endsWith('scream-v-low.jpeg')) return;
  const img = new Image();
  img.onload = () => {
    heroImgSrc.value = img.src;
  };
  img.src = '/scream.jpeg';
}
</script>
