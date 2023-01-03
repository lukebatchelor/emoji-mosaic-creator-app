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
        >
          Generate
          <template v-slot:loader> Loading... </template>
        </v-btn>
        <v-btn
          v-if="canDownload && !loading"
          @click="onDownloadClick"
          variant="outlined"
          color="success"
          icon="mdi-file-download"
          class="ml-2"
          size="small"
        ></v-btn>
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
import { ref, onMounted } from 'vue';
import { saveAs } from 'file-saver';
import { mosaic } from '../mosaic';

type BackgroundMode = 'Mosaic' | 'Transparent';
type RotationMode = 'Rotate' | 'NoRotate';
const props = defineProps<{ image: HTMLImageElement }>();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const loading = ref<boolean>(false);
const backgroundMode = ref<BackgroundMode>('Mosaic');
const rotationMode = ref<RotationMode>('Rotate');
const canDownload = ref<boolean>(false);

onMounted(() => {
  if (!canvasRef.value) return;

  canvasRef.value.height = props.image.height;
  canvasRef.value.width = props.image.width;
  const ctx = canvasRef.value?.getContext('2d');
  ctx?.drawImage(props.image, 0, 0);
});

async function onGenerateClick() {
  loading.value = true;
  const options = {
    gridSize: 32,
    rotation: rotationMode.value === 'Rotate',
    background: backgroundMode.value === 'Mosaic',
  };
  mosaic(props.image, canvasRef.value!, options).then(() => {
    loading.value = false;
    canDownload.value = true;
  });
}
function onDownloadClick() {
  canvasRef.value?.toBlob(function (blob) {
    saveAs(blob!, 'mosaic.png');
  });
}
</script>

<style scoped>
canvas {
  max-width: 250px;
  display: block;
  margin: auto;
}
.loadingFilter {
  filter: brightness(0.3);
}
</style>
