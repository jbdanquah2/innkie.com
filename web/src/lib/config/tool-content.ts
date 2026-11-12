import type { ToolFaq } from './tool-registry';

/**
 * Page copy for each tool that the registry alone does not carry: a plain intro, a short facts line and
 * the FAQ. Every statement here is checked against what the tool actually does; keep it that way.
 */
export interface ToolContent {
  intro: string;
  facts: string[];
  faqs?: ToolFaq[];
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
  'pdf-to-image': {
    intro: 'Turn the pages of a PDF into PNG or JPEG images. Convert one page or the whole document, choose how sharp the images are, and download them as a ZIP. Your PDF never leaves your device.',
    facts: ['Files stay on your device', 'One page or all pages', 'PNG or JPEG'],
    faqs: [
      { question: 'Is my PDF uploaded?', answer: 'No. The PDF is opened and drawn in your browser, so the document is never sent to a server. That makes it suitable for contracts, invoices and ID scans.' },
      { question: 'Can I convert every page at once?', answer: 'Yes. Choose all pages and download them as a ZIP, with files named page-1, page-2 and so on. Or pick a single page and download just that one.' },
      { question: 'How sharp will the images be?', answer: 'You choose a scale from 1x to 4x (2x by default). A higher scale gives sharper text and a larger file. 2x is a good balance for screens; go higher for printing.' },
      { question: 'Should I choose PNG or JPEG?', answer: 'PNG keeps text and line art perfectly crisp. JPEG is smaller for pages that are mostly photographs.' },
      { question: 'Is there a size limit?', answer: 'The tool accepts PDFs up to 50 MB. Long documents at a high scale need a lot of memory, so lower the scale if the browser slows down.' },
      { question: 'Can it open a password-protected PDF?', answer: 'No. Remove the password first, for example by printing the PDF to a new PDF, and then convert it.' },
    ],
  },
  'image-to-pdf': {
    intro: 'Combine photos and scans into one PDF. Put them in order, choose A4 or pages that match each image, set the orientation and margin, and download. Everything happens in your browser.',
    facts: ['Files stay on your device', 'Reorder pages', 'A4 or fit to image'],
    faqs: [
      { question: 'Are my images uploaded?', answer: 'No. The PDF is built in your browser, so your images never reach a server.' },
      { question: 'Which image types can I use?', answer: 'JPG and PNG are used as they are. Other formats, such as WebP and GIF, are converted to PNG automatically before they are added.' },
      { question: 'Can I change the order of the pages?', answer: 'Yes. Use the move up and move down buttons on each image, and remove any you do not want.' },
      { question: 'What page sizes and layouts are available?', answer: 'Choose A4 pages or pages that match each image\'s own size, portrait or landscape, and a margin in millimetres (10 by default). Images are fitted inside the page without being stretched.' },
      { question: 'Why is my PDF so large?', answer: 'The PDF contains your images, so its size follows theirs. Run large photos through the Image Compressor first to get a much smaller document.' },
    ],
  },
  'qr-generator': {
    intro: 'Make a QR code for a web address, text, Wi-Fi login, email or phone number. It updates as you type. Choose the size and colours, then download it as PNG or SVG.',
    facts: ['No sign-up', 'Link, Wi-Fi, email and phone codes', 'PNG up to 2048 px, or SVG'],
    faqs: [
      { question: 'Is the QR code generator free?', answer: 'Yes. There is no account, no watermark and nothing to pay for.' },
      { question: 'What can I put in a QR code?', answer: 'A web address, any text, a Wi-Fi network (phones that scan it join without typing the password), an email with a subject and message, or a phone number. A web address typed without https:// gets it added so phones open it as a link.' },
      { question: 'Does the code expire or track scans?', answer: 'It does neither. The code contains exactly what you entered, so it works for as long as that content does. To count scans, shorten the link with the URL Shortener first and put the short link in the code.' },
      { question: 'PNG or SVG, and what size?', answer: 'Use PNG for screens and documents, at 1024 px or more if it will be printed. Use SVG for print and anything that will be enlarged, because it stays sharp at any size.' },
      { question: 'What does error correction do?', answer: 'It lets a code still scan when part of it is dirty, worn or covered. Higher levels survive more damage but make the code denser. Medium is a good default; choose High only when something will cover part of the code.' },
      { question: 'Can I change the colours?', answer: 'Yes, pick any two colours. Scanners expect a dark code on a light background with strong contrast, and the tool warns you when the colours are inverted or too close together. For gradients, custom shapes and a logo, use QR Studio.' },
      { question: 'Is what I type sent anywhere?', answer: 'No. The code is created in your browser, including Wi-Fi passwords and email addresses.' },
    ],
  },
  'qr-studio': {
    intro: 'Design a QR code that matches your brand: colours or gradients, dot and corner styles, and your logo in the middle. Download it as PNG or SVG.',
    facts: ['Colours and gradients', 'Your logo in the middle', 'PNG and SVG export'],
    faqs: [
      { question: 'Do I need an account?', answer: 'No. You can design and download a code without signing in.' },
      { question: 'Is my logo uploaded?', answer: 'No. A logo you add is read by your browser and used to draw the code on your device. It is not sent to a server.' },
      { question: 'Will a styled code still scan?', answer: 'Usually, if you keep strong contrast between the code and its background and keep the logo small. Always test the finished design with a few phones before printing in bulk.' },
      { question: 'Does the code track scans?', answer: 'No. It contains the address you enter. To count scans, create a short link with the URL Shortener and use that as the address.' },
      { question: 'Can I save a design or apply it to my links?', answer: 'Yes, with a free account. In the QR Studio inside your dashboard you can save designs as templates and apply one to any of your links. On this page you can design and download a code without an account.' },
    ],
  },
  'utm-builder': {
    intro: 'Add UTM tags to a link so Google Analytics can tell you which campaign, source and medium brought each visit. Copy the finished link, or shorten it.',
    facts: ['Runs in your browser', 'Copy or shorten the result', 'Required fields marked'],
    faqs: [
      { question: 'Which fields do I have to fill in?', answer: 'The website address, source (where the traffic comes from, such as newsletter), medium (the channel, such as email) and campaign name. Term and content are optional.' },
      { question: 'Are UTM values case-sensitive?', answer: 'Yes. In Google Analytics "Email" and "email" are reported as different values, so pick one style, preferably lowercase, and stick to it.' },
      { question: 'Do UTM links affect SEO?', answer: 'Generally not. Most sites use canonical tags, so the tagged address is treated as the same page. Use UTM tags for links you share, not for links inside your own site.' },
      { question: 'Can I shorten a UTM link?', answer: 'Yes. Shortening keeps the tags and gives you a link that is cleaner for social posts and print. Building the link happens in your browser; only when you click Shorten is the address sent to iNNkie to create the short link.' },
      { question: 'Do UTM links expire?', answer: 'No. The tags are part of the address, so they work for as long as the destination page does.' },
    ],
  },
  'word-counter': {
    intro: 'Count words, characters, sentences and paragraphs as you type, and see how long the text takes to read or speak. Nothing you type leaves your browser.',
    facts: ['Live counts', 'Reading and speaking time', 'Nothing is uploaded'],
  },
  'json-formatter': {
    intro: 'Format, validate and minify JSON, explore it as a tree, and copy it as a TypeScript interface. Formatting never changes your data, and nothing you paste leaves your browser.',
    facts: ['Never rounds your numbers', 'Errors with line and column', 'Tree view and TypeScript'],
    faqs: [
      { question: 'Is my JSON uploaded?', answer: 'No. Everything runs in your browser, so tokens, customer data and API responses you paste are never sent to a server.' },
      { question: 'Does formatting change my data?', answer: 'No. Format and Minify work on the text itself, so large numbers, key order and duplicate keys stay exactly as you wrote them. Many formatters parse and rewrite the JSON instead, which can round a large ID such as 12345678901234567890 without telling you.' },
      { question: 'How do I find a syntax error?', answer: 'The tool shows the line and column and the offending line with a marker, with a plain explanation such as a trailing comma, single quotes, an unquoted key, a comment or a missing comma.' },
      { question: 'What does Copy as TypeScript do?', answer: 'It builds an interface from your JSON. Keys that are not valid names are quoted, arrays of mixed values become unions, and null stays null. It works from the one sample you give it, so it cannot tell which fields are optional; review the result before using it.' },
      { question: 'Can it fix invalid JSON for me?', answer: 'No. It tells you exactly what is wrong and where, so you can fix it without the tool guessing and changing your meaning.' },
      { question: 'How big a document can I use?', answer: 'It depends on your device\'s memory. Documents of several megabytes work, and for large ones the tree view starts collapsed so it stays responsive.' },
    ],
  },
};
