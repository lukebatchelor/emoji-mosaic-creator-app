<template>
  <v-app :theme="theme">
    <v-app-bar title="Emoji Mosaic Creator">
      <template v-slot:prepend>
        <v-btn
          v-if="curView === 'Options'"
          @click="onBackClick"
          icon="mdi-arrow-left-circle"
        ></v-btn>
      </template>
      <v-btn :icon="themeIcon" @click="toggleTheme"></v-btn>
    </v-app-bar>
    <v-main class="mt-2">
      <LandingView @file-upload="onFileUpload" v-if="curView === 'Landing'" />
      <MainView :image="image!" v-if="curView === 'Options'" />
    </v-main>
  </v-app>
</template>

<style scoped></style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import LandingView from '@/components/LandingView.vue';
import MainView from '@/components/MainView.vue';

type View = 'Landing' | 'Options';

const theme = ref('dark');
const themeIcon = computed(() => {
  return theme.value === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night';
});
const curView = ref<View>('Landing');
const image = ref<HTMLImageElement | null>(null);

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
}
function onFileUpload(uploadedFile: File | Blob) {
  const img = new Image();
  img.onload = () => {
    image.value = img;
    curView.value = 'Options';
  };
  img.src = URL.createObjectURL(uploadedFile);
}
function onBackClick() {
  image.value = null;
  curView.value = 'Landing';
}

// Handle image uploads for the share api.
// If an image has been shared to the pwa, it will redirect to this page with a
// ?uploaded query param. If we find this param, we check the cache for the uploaded image
// and simulate the file upload event automatically
const q = new URLSearchParams(window.location.search);
onMounted(async () => {
  if (!q.has('uploaded')) return;
  try {
    const cache = await caches.open('uploadedImages');
    const found = await cache.match('upload');
    if (!found) return;
    // found will be a cached Response object, which contains a Blob body
    const blob = await found.blob();
    // remove the query param in case the user refreshes, we don't want to trigger this again
    window.history.replaceState(null, '', window.location.pathname);
    // simulate the file upload as if the user had uploaded the file manually
    onFileUpload(blob);
  } catch (e) {
    alert('Error Uploading file');
    alert(e);
  }
});
</script>
