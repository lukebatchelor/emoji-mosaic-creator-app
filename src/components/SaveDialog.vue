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
      <div class="d-flex justify-center align-center" style="min-height: 20vh">
        <v-progress-circular
          v-if="isLoadingBlob"
          indeterminate
          color="primary"
        ></v-progress-circular>

        <v-list
          v-else
          lines="one"
          class="w-100 px-2 py-2"
          style="border: 1px solid grey"
        >
          <v-list-item
            v-for="item in options"
            :value="item"
            :key="item.type"
            :active="selected.name === item.name"
            @click="selected = item"
          >
            <v-list-item-title>
              <span>{{ item.name }}</span>
              <span
                v-if="item.reccomended"
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

      <p
        v-if="isLargeImage && !isLoadingBlob"
        class="text-red text-caption text-center mt-2"
      >
        This image is quite large so we have not calculated all the file sizes
        automatically
      </p>
      <v-card-actions v-if="!isLoadingBlob" class="mt-4">
        <v-spacer />
        <v-btn
          v-if="!selected.blob"
          color="primary"
          variant="outlined"
          @click="getBlobForQuality(selected)"
          >Calculate Filesize</v-btn
        >
        <v-btn
          color="primary"
          right
          variant="tonal"
          @click="onShareClick"
          v-if="supportsShare && !!selected.blob"
          >Share</v-btn
        >
        <v-btn
          v-if="!!selected.blob"
          color="primary"
          right
          variant="tonal"
          @click="onDownloadClick"
          >Download</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts" setup>
import { saveAs } from 'file-saver';
import { ref, watch, computed } from 'vue';

type QualityOption = {
  name: string;
  type: 'image/png' | 'image/jpeg';
  quality?: number;
  size?: number;
  blob?: Blob;
  fileName?: string;
  reccomended?: boolean;
  loading?: boolean;
};
const qualityOptionsData: QualityOption[] = [
  { name: 'PNG Full', type: 'image/png' },
  { name: 'JPG Full', type: 'image/jpeg', quality: 1 },
  {
    name: 'JPG Very High',
    type: 'image/jpeg',
    quality: 0.95,
    reccomended: true,
  },
  { name: 'JPG High', type: 'image/jpeg', quality: 0.9 },
  { name: 'JPG Med', type: 'image/jpeg', quality: 0.8 },
  { name: 'JPG Low', type: 'image/jpeg', quality: 0.7 },
];

const props = defineProps<{ canvasRef: HTMLCanvasElement | null }>();
const showDialog = ref(false);
const options = ref<QualityOption[]>(qualityOptionsData);
const selected = ref<QualityOption>(options.value.find((q) => q.reccomended)!);
const supportsShare = ref<boolean>(!!window.navigator.share);
const isLargeImage = computed<boolean>(() => {
  const maxPixels = 4096 * 4096;
  const imgSize = props.canvasRef!.height * props.canvasRef!.width;
  // return true;
  return imgSize > maxPixels;
});
const isLoadingBlob = computed<boolean>(() => {
  return options.value.some((option) => option.loading);
});

watch(showDialog, (isShowing) => {
  if (!isShowing) return;
  if (!isLargeImage.value) {
    getAllBlobs();
  }
});

async function getBlobForQuality(quality: QualityOption) {
  quality.loading = true;
  const fileType = quality.type.split('/')[1];
  const suffix = Math.floor(Math.random() * 1000);
  const fileName = `mosaic-${suffix}.${fileType}`;
  const blob = await new Promise<Blob>((resolve) => {
    props.canvasRef!.toBlob((b) => resolve(b!), quality.type, quality.quality);
  });
  quality.blob = blob;
  quality.fileName = fileName;
  quality.size = blob.size;
  quality.loading = false;
}

async function getAllBlobs() {
  performance.mark('start-get-blobs');
  await Promise.all(options.value.map((q) => getBlobForQuality(q)));
  performance.mark('end-get-blobs');
  const perf = performance.measure(
    'get-blobs',
    'start-get-blobs',
    'end-get-blobs'
  );
  console.log('Generated all blobs', perf.duration);
}

async function onDownloadClick() {
  const { blob, fileName } = selected.value;
  return saveAs(blob!, fileName);
}

async function onShareClick() {
  const { blob, fileName } = selected.value;
  await navigator.share({
    files: [new File([blob!], fileName!, { type: blob!.type })],
    title: 'Emoji Mosaic',
    text: 'Check out my emoji mosaic!',
  });
}

function humanReadableFileSize(fileSize: number): string {
  if (fileSize > 1_000_000) return `${(fileSize / 1_000_000).toFixed(2)} mb`;
  else return `${(fileSize / 1000).toFixed(2)} kb`;
}
</script>
