import type { ToolFaq } from './tool-registry';

/**
 * Page copy for each tool that the registry alone does not carry: a plain intro, a short facts line and
 * the FAQ. Every statement here is checked against what the tool actually does; keep it that way.
 */
export interface ToolContent {
  intro: string;
  facts: string[];
  faqs: ToolFaq[];
}

export const TOOL_CONTENT: Record<string, ToolContent> = {
  'image-compressor': {
    intro: 'Make JPG, PNG and WebP images smaller before you upload or send them. Compress a whole batch at once, compare each result with the original, and download everything as a ZIP.',
    facts: ['Files stay on your device', 'Batch compression', 'Before and after comparison'],
    faqs: [
      { question: 'Are my images uploaded?', answer: 'No. Compression runs in your browser, so your images are never sent to a server. You can confirm this by watching the Network tab in your browser while you use the tool.' },
      { question: 'Does it resize my images?', answer: 'By default, images larger than 1920 pixels on their longest side are scaled down. Set a maximum width or height to choose your own limit.' },
      { question: 'Which output format should I pick?', answer: 'WebP gives the smallest files for websites and is supported by all current browsers. JPEG is the safest choice for photos that must open anywhere. Use PNG for graphics that need transparency, or keep each file\'s original format.' },
      { question: 'Can I compress many images at once?', answer: 'Yes. Add as many images as your device can handle, then download them individually or all together as a ZIP file.' },
      { question: 'Why did a file barely shrink?', answer: 'Images that were already well optimised have little left to remove, and switching format can sometimes make a small file larger. The tool shows the bytes saved for each image, so keep your original if the result is not smaller.' },
    ],
  },
  'image-resizer': {
    intro: 'Set an exact size in pixels, or start from a preset for Instagram, X, YouTube or HD. The image is resized in your browser and never uploaded.',
    facts: ['Aspect ratio lock', 'Crop to fill or stretch', 'PNG or JPEG export'],
    faqs: [
      { question: 'Is my image uploaded anywhere?', answer: 'No. The image is resized on your own device and never leaves your browser.' },
      { question: 'Will it crop or squash my photo?', answer: 'You choose. With "Crop to fill" the tool keeps the proportions and trims the edges equally to reach the exact size. With "Stretch" it fills the exact size but can distort the picture. If the aspect ratio is locked, the shape never changes.' },
      { question: 'Can I resize several images at once?', answer: 'This tool handles one image at a time. To shrink a batch to a maximum width or height, use the Image Compressor.' },
      { question: 'What is the largest size I can export?', answer: 'Up to 16,384 pixels on either side. Browsers cannot draw larger images reliably. Input images can be PNG, JPEG or WebP, up to 20 MB.' },
      { question: 'Why does my enlarged image look blurry?', answer: 'Making an image larger cannot add detail that was never captured, so enlarging a small image always softens it. Start from the largest original you have.' },
    ],
  },
  'png-to-jpeg': {
    intro: 'Convert PNG images to JPEG in your browser. Convert a whole batch, compare each result with the original, and download everything as a ZIP.',
    facts: ['Files stay on your device', 'Batch conversion', 'Before and after comparison'],
    faqs: [
      { question: 'Is the converter free?', answer: 'Yes. There is no account and no daily limit. The practical limit is your device\'s memory when you convert very large batches.' },
      { question: 'Are my images uploaded?', answer: 'No. The conversion runs in your browser, so your PNG files never reach a server.' },
      { question: 'What happens to transparent areas?', answer: 'JPEG cannot store transparency, so transparent areas are filled with white. If you need to keep transparency, keep the file as PNG.' },
      { question: 'Can I choose the JPEG quality?', answer: 'Conversion uses a fixed high quality setting of 92%, which keeps photos looking the same at a much smaller size. For stronger compression, run the JPEGs through the Image Compressor afterwards.' },
      { question: 'Are there size limits?', answer: 'Images larger than 4096 pixels on their longest side are scaled down, and each result is kept to about 5 MB or less.' },
      { question: 'Can I rename the converted files?', answer: 'Yes. Add a prefix or a suffix to the file names, for example "-web", so the converted files do not overwrite your originals.' },
    ],
  },
  'svg-to-png': {
    intro: 'Convert SVG files, or SVG code you paste in, to PNG at 1x to 8x scale. Everything runs in your browser.',
    facts: ['1x to 8x output scale', 'Files or pasted code', 'Batch download as ZIP'],
    faqs: [
      { question: 'Is my artwork uploaded?', answer: 'No. The SVG is drawn and converted on your own device, so your files are never sent to a server.' },
      { question: 'Which scale should I choose?', answer: '2x is a good default and keeps icons sharp on high-density screens. Use 4x or more for print or large banners. Very large scales need more memory, and browsers limit how big an image can be.' },
      { question: 'Can I paste SVG code instead of uploading a file?', answer: 'Yes. Use "Add vector code", paste your markup, and it is converted like a file.' },
      { question: 'Will the background be transparent?', answer: 'Areas your SVG leaves empty stay transparent in the PNG. If your destination does not support transparency, add a background shape to the SVG first.' },
      { question: 'Why does the PNG look different from my design app?', answer: 'SVGs that use fonts that are not embedded, linked external images, or advanced filters can render differently in a browser. Convert text to outlines and embed any images before exporting.' },
    ],
  },
};
