<template>
  <v-dialog v-model="showDialog" max-width="500px">
    <template v-slot:activator>
      <v-btn
        @click="showDialog = true"
        variant="tonal"
        color="success"
        icon="mdi-share-variant"
        class="ml-2 pa-2"
        size="medium"
      ></v-btn>
    </template>
    <v-card class="pa-4">
      <div
        class="d-flex justify-center align-center mb-4"
        style="min-height: 20vh"
      >
        <v-progress-circular
          v-if="fetchingSizes"
          indeterminate
          color="primary"
          style="margin-top: 52px"
        ></v-progress-circular>

        <v-list
          v-else
          lines="one"
          class="w-100 px-2 py-2"
          style="border: 1px solid grey"
        >
          <v-list-item
            v-for="item in qualityOptions"
            :value="item"
            :key="item.type"
            :active="selected === item.name"
            @click="selected = item.name"
          >
            <v-list-item-title>
              <span>{{ item.name }}</span>
              <span
                v-if="item.quality === RECOMMENDED_QUALITY"
                class="ml-2 font-weight-medium text-caption text-red size"
              >
                Recommended
              </span>
            </v-list-item-title>
            <v-list-item-subtitle>{{
              item.size ? humanReadableFileSize(item.size) : 'unknown size'
            }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>

      <v-card-actions>
        <v-btn
          v-if="showSizeButton"
          color="primary"
          right
          variant="outlined"
          @click="getQualitySizes"
          >Get filesizes</v-btn
        >
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          right
          variant="tonal"
          @click="onShareClick"
          v-if="supportsShare"
          >Share</v-btn
        >
        <v-btn color="primary" right variant="tonal" @click="onDownloadClick"
          >Download</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts" setup>
import { saveAs } from 'file-saver';
import { ref, watch } from 'vue';

const RECOMMENDED_QUALITY = 0.95;
const DEFAULT_SELECTED = 'JPG Very High';

const props = defineProps<{ canvasRef: HTMLCanvasElement | null }>();
const showDialog = ref(false);
const fetchingSizes = ref(false);
const showSizeButton = ref(false);
const selected = ref(DEFAULT_SELECTED);
const supportsShare = ref<boolean>(!!window.navigator.share);

type QualityOption = {
  name: string;
  type: 'image/png' | 'image/jpeg';
  quality?: number;
  size?: number;
  blob?: Blob;
  fileName?: string;
};
const qualityOptions: QualityOption[] = [
  { name: 'PNG Full', type: 'image/png' },
  { name: 'JPG Full', type: 'image/jpeg', quality: 1 },
  { name: 'JPG Very High', type: 'image/jpeg', quality: 0.95 },
  { name: 'JPG High', type: 'image/jpeg', quality: 0.9 },
  { name: 'JPG Med', type: 'image/jpeg', quality: 0.8 },
  { name: 'JPG Low', type: 'image/jpeg', quality: 0.7 },
];

watch(showDialog, (isShowing) => {
  if (!isShowing) return;
  const maxPixels = 4096 * 4096;
  const imgSize = props.canvasRef!.height * props.canvasRef!.width;
  if (imgSize < maxPixels) {
    getQualitySizes();
  } else {
    showSizeButton.value = true;
  }
});

async function getQualitySizes() {
  fetchingSizes.value = true;
  performance.mark('start-get-sizes');
  const blobs = await Promise.all(
    qualityOptions.map((q) => getBlobAndNameForQuality(q))
  );
  blobs.forEach(({ blob, fileName }, idx) => {
    qualityOptions[idx].blob = blob!;
    qualityOptions[idx].size = blob!.size;
    qualityOptions[idx].fileName = fileName;
  });
  performance.mark('end-get-sizes');
  const perf = performance.measure(
    'get-sizes',
    'start-get-sizes',
    'end-get-sizes'
  );
  console.log('Getting quality sizes', perf.duration);
  fetchingSizes.value = false;
  showSizeButton.value = false;
}

async function onDownloadClick() {
  const quality = qualityOptions.find((opt) => opt.name === selected.value);
  if (!quality) return;
  const { blob, fileName } =
    quality || (await getBlobAndNameForQuality(quality));
  return saveAs(blob!, fileName);
}

function humanReadableFileSize(fileSize: number): string {
  if (fileSize > 1_000_000) return `${(fileSize / 1_000_000).toFixed(2)} mb`;
  else return `${(fileSize / 1000).toFixed(2)} kb`;
}

async function getBlobAndNameForQuality(quality: QualityOption) {
  const fileType = quality.type.split('/')[1];
  const suffix = Math.floor(Math.random() * 1000);
  const fileName = `mosaic-${suffix}.${fileType}`;
  return new Promise<{ blob: Blob; fileName: string }>((resolve) => {
    props.canvasRef!.toBlob(
      (b) => resolve({ blob: b!, fileName }),
      quality.type,
      quality.quality
    );
  });
}

async function onShareClick() {
  const quality = qualityOptions.find((opt) => opt.name === selected.value);
  if (!quality) return;
  const { blob, fileName } =
    quality || (await getBlobAndNameForQuality(quality));
  await navigator.share({
    files: [new File([blob!], fileName!, { type: blob!.type })],
    title: 'Emoji Mosaic',
    text: 'Check out my emoji mosaic!',
  });
}
</script>
