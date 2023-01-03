<template>
  <v-app :theme="theme">
    <v-app-bar title="Emoji Mosaic Creator">
      <v-btn :icon="themeIcon" @click="toggleTheme" class="d"></v-btn>
    </v-app-bar>
    <v-main class="mt-2">
      <LandingView @file-upload="onFileUpload" v-if="curView === 'Landing'" />
      <OptionsView :image="image!" v-if="curView === 'Options'" />
    </v-main>
  </v-app>
</template>

<style scoped></style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import LandingView from '@/components/LandingView.vue';
import OptionsView from '@/components/OptionsView.vue';

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
function onFileUpload(uploadedFile: File) {
  const img = new Image();
  img.onload = () => {
    image.value = img;
    curView.value = 'Options';
  };
  img.src = URL.createObjectURL(uploadedFile);
}
</script>