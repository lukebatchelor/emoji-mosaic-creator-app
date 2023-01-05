<template>
  <v-dialog v-model="showDialog" max-width="500px">
    <template v-slot:activator>
      <v-btn
        @click="showDialog = true"
        variant="outlined"
        color="success"
        icon="mdi-file-download"
        class="ml-2"
        size="small"
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
          class="w-100 px-4 py-0"
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
          variant="outlined"
          @click="showDialog = false"
          >Close</v-btn
        >
        <v-btn color="primary" right variant="flat" @click="onDownloadClick"
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

type QualityOption = {
  name: string;
  type: 'image/png' | 'image/jpeg';
  quality?: number;
  size?: number;
  blob?: Blob;
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
    qualityOptions.map(
      (q) =>
        new Promise<Blob | null>((resolve) => {
          props.canvasRef!.toBlob(resolve, q.type, q.quality);
        })
    )
  );
  blobs.forEach((blob, idx) => {
    qualityOptions[idx].blob = blob!;
    qualityOptions[idx].size = blob!.size;
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

function onDownloadClick() {
  const quality = qualityOptions.find((opt) => opt.name === selected.value);
  if (!quality) return;
  const fileType = quality.type.split('/')[1];
  if (quality.blob) {
    return saveAs(quality.blob, `mosaic.${fileType}`);
  }
  props.canvasRef!.toBlob(
    (blob) => saveAs(blob!, `mosaic.${fileType}`),
    quality.type,
    quality.quality
  );
}

function humanReadableFileSize(fileSize: number): string {
  if (fileSize > 1_000_000) return `${(fileSize / 1_000_000).toFixed(2)} mb`;
  else return `${(fileSize / 1000).toFixed(2)} kb`;
}
</script>
