/// <reference types="vite-plugin-pwa/dist/index.d.ts" />
// Completely unable to get this working, leaving attempts here in case I come back to it

// declare module 'vite-plugin-pwa' {
//   declare interface Options {
//     test: 'foo';
//   }
// }
// interface ManifestOptions extends import('vite-plugin-pwa').ManifestOptions {
//   share_target: ShareTarget;
//   foo: string;
// }
// interface ShareTarget {
//   action: string;
//   method: string;
//   enctype: string;
//   params: Params;
//   foo: string;
// }
// interface Params {
//   files: File[];
// }
// interface File {
//   name: string;
//   accept: string[];
// }
// }
