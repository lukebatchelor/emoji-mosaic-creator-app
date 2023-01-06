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
function onFileUpload(uploadedFile: File | Blob) {
  const img = new Image();
  img.onload = () => {
    image.value = img;
    curView.value = 'Options';
  };
  img.onerror = () => {
    alert(img.src);
  };
  img.src = URL.createObjectURL(uploadedFile);
}
function onBackClick() {
  image.value = null;
  curView.value = 'Landing';
}
const q = new URLSearchParams(window.location.search);
if (q.has('uploaded')) {
  try {
    caches.open('uploadedImages').then((cache) => {
      cache
        .match('upload')
        .then((r) => {
          return r?.blob();
        })
        .then((blob) => {
          const reader = new FileReader();
          reader.addEventListener(
            'load',
            () => {
              console.log(reader.result);
              const i = document.createElement('img');
              i.src = reader.result as string;
              document.body.append(i);
            },
            false
          );
          reader.readAsDataURL(blob!);

          // alert(blob);
          // const url = URL.createObjectURL(blob!);
          // window.location.href = url;
          // onFileUpload(blob!);
        });
    });
  } catch (e) {
    alert('error');
    alert(e);
  }
}
</script>
