<template>
  <v-container class="fill-height">
    <v-sheet
      class="d-flex flex-column justify-center align-center pa-4"
      :style="{ gap: '10px' }"
    >
      <p class="text-body">Preview</p>
      <canvas ref="canvasRef" :class="{ loadingFilter: loading }"></canvas>

      <div class="flex">
        <v-btn
          color="success"
          @click="onGenerateClick"
          :disabled="loading"
          :loading="loading"
          class="generateBtn"
        >
          Generate
          <template v-slot:loader>
            <div class="generateBtn">Loading... {{ calcProgress }}</div>
          </template>
        </v-btn>
        <SaveDialog :canvas-ref="canvasRef" v-if="canDownload && !loading" />
      </div>
      <v-divider light thickness="1px" class="w-100"></v-divider>
      <div class="w-100">
        <v-radio-group
          v-model="backgroundMode"
          inline
          label="Background"
          density="compact"
        >
          <v-radio label="Mosaic" value="Mosaic"></v-radio>
          <v-radio label="Transparent" value="Transparent"></v-radio>
        </v-radio-group>
        <v-radio-group
          v-model="rotationMode"
          inline
          label="Rotation"
          density="compact"
        >
          <v-radio label="Enabled" value="Rotate"></v-radio>
          <v-radio label="Disabled" value="NoRotate"></v-radio>
        </v-radio-group>
      </div>
    </v-sheet>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { type MosaicOptions } from '../types';
import { mosaic, clearPaletteCache } from '../mosaic';
import SaveDialog from './SaveDialog.vue';

type BackgroundMode = 'Mosaic' | 'Transparent';
type RotationMode = 'Rotate' | 'NoRotate';

const props = defineProps<{ image: HTMLImageElement }>();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const loading = ref<boolean>(false);
const backgroundMode = ref<BackgroundMode>('Mosaic');
const rotationMode = ref<RotationMode>('Rotate');
const canDownload = ref<boolean>(false);
const calcProgress = ref<string>('');

onMounted(() => {
  if (!canvasRef.value) return;

  canvasRef.value.height = props.image.height;
  canvasRef.value.width = props.image.width;
  const ctx = canvasRef.value?.getContext('2d');
  ctx?.drawImage(props.image, 0, 0);
});

onUnmounted(() => {
  clearPaletteCache();
});

async function onGenerateClick() {
  if (!canvasRef.value) return;
  loading.value = true;
  const options: MosaicOptions = {
    gridSize: 32,
    rotation: rotationMode.value === 'Rotate',
    background: backgroundMode.value === 'Mosaic',
    onProgress,
  };
  await mosaic(props.image, canvasRef.value, options);
  loading.value = false;
  canDownload.value = true;
}

function onProgress(progress: number) {
  const progressStr = String((progress * 100).toFixed(1)) + '%';
  calcProgress.value = progressStr;
}
</script>

<style scoped>
canvas {
  max-width: 80vw;
  max-height: 80vh;
  display: block;
  margin: auto;
}
.loadingFilter {
  filter: brightness(0.3);
}
.generateBtn {
  min-width: 150px;
}
</style>
