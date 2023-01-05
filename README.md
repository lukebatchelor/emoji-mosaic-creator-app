# Emoji Mosaic Creator App

Small little webapp for generating emoji mosaics from images

![./mosaic.png](mosaic.png)

## Browser Compatibility

This app makes use of [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) for performing expensive calculations in [WebWorkers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API). Unfortunately, this [still isn't supported in webkit browsers](https://bugs.webkit.org/show_bug.cgi?id=183720) (safari and any browser on ios). If OffscreenCanvas support is missing, the app will fall back to performing the calculations in the browser instead, which still works, but may cause some lag/ui issues on very large images.

## Credits

Absolutely all of the heavy lifting was done by these librarys, I just glued them together

- Emoji Images: [https://github.com/googlefonts/noto-emoji](https://github.com/googlefonts/noto-emoji)
- Getting average colors: [npm:fast-average-color](https://www.npmjs.com/package/fast-average-color)
- Getting colors distances: [npm:color-diff](https://www.npmjs.com/package/color-diff)
- Saving files: [npm:file-saver](https://www.npmjs.com/package/file-saver)
