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
    facts: ['Files stay on your device', 'Batch compression', 'Never makes a file bigger'],
    faqs: [
      { question: 'Are my images uploaded?', answer: 'No. Compression runs in your browser, so your images are never sent to a server. You can confirm this by watching the Network tab in your browser while you use the tool.' },
      { question: 'Does it resize my images?', answer: 'By default, images larger than 1920 by 1920 pixels are scaled down to fit, keeping their proportions, and smaller images are never enlarged. Change the limits, or untick "Shrink large images" to keep the original dimensions.' },
      { question: 'Which output format should I pick?', answer: 'WebP gives the smallest files for websites and is supported by all current browsers. JPEG is the safest choice for photos that must open anywhere. Use PNG for graphics that need transparency, or keep each file\'s original format.' },
      { question: 'Can the result be bigger than the original?', answer: 'Not when you keep a file\'s format: if recompressing would not make it smaller, the original is kept and marked as already well compressed. Changing the format, for example a small PNG to WebP, can make a file bigger, and the tool tells you when that happens.' },
      { question: 'Is hidden data removed?', answer: 'Yes. Camera details, GPS location and other metadata are not carried into the compressed image, which is useful before you publish photos.' },
      { question: 'Why can I not compress GIFs or SVGs?', answer: 'A GIF may be animated, and recompressing it would keep only the first frame. An SVG is already a compact vector format. The tool tells you when it skips a file and why.' },
      { question: 'Does the quality slider affect PNG?', answer: 'No. PNG is lossless, so it has no quality setting. To make a PNG smaller, resize it or switch to WebP or JPEG.' },
    ],
  },
  'image-resizer': {
    intro: 'Set an exact size in pixels, scale by a percentage, or start from a preset such as a square post, link preview or YouTube thumbnail. Crop to fill or stretch, and export as PNG, JPEG or WebP. The image is resized in your browser and never uploaded.',
    facts: ['Presets and percentages', 'Crop to fill or stretch', 'PNG, JPEG or WebP'],
    faqs: [
      { question: 'Is my image uploaded anywhere?', answer: 'No. The image is resized on your own device and never leaves your browser.' },
      { question: 'Will it crop or squash my photo?', answer: 'You choose. With "Crop to fill" the tool keeps the proportions and trims the edges equally to reach the exact size. With "Stretch" it fills the exact size but can distort the picture. If the proportions are locked, the shape never changes. The page always shows which of these will happen.' },
      { question: 'Why does a big reduction still look sharp?', answer: 'Shrinking an image by a large factor in one step makes jagged edges, so the tool uses the browser\'s high-quality resize, and halves the size step by step where that is not available, which keeps detail.' },
      { question: 'Can I resize several images at once?', answer: 'This tool handles one image at a time. To shrink a batch to a maximum width or height, use the Image Compressor.' },
      { question: 'What is the largest size I can export?', answer: 'Up to 16,384 pixels on either side and about 67 million pixels in total, which is what browsers can draw. Input images can be up to 50 MB. If you ask for more, the tool says so instead of giving you a blank image.' },
      { question: 'Why does my enlarged image look blurry?', answer: 'Making an image larger cannot add detail that was never captured, so enlarging a small image always softens it. Start from the largest original you have. The tool warns you when the output is larger than the original.' },
      { question: 'Are the preset sizes always right?', answer: 'They are common sizes, but platforms change their recommendations from time to time, so check the current guidance when an exact size matters.' },
    ],
  },
  'png-to-jpeg': {
    intro: 'Convert PNG images to JPEG in your browser. Choose the quality and the background for transparent areas, convert a whole batch, compare each result with the original, and download everything as a ZIP.',
    facts: ['Files stay on your device', 'Choose quality and background', 'Before and after comparison'],
    faqs: [
      { question: 'Is the converter free?', answer: 'Yes. There is no account and no daily limit. The practical limit is your device\'s memory when you convert very large batches.' },
      { question: 'Are my images uploaded?', answer: 'No. The conversion runs in your browser, so your PNG files never reach a server.' },
      { question: 'What happens to transparent areas?', answer: 'JPEG cannot store transparency, so transparent areas are filled with a solid colour. It is white by default and you can pick any colour. If you need to keep transparency, keep the file as PNG.' },
      { question: 'What quality should I choose?', answer: 'The default of 92% keeps photos looking the same at a much smaller size. Go lower, around 80%, for smaller files, and expect softer detail around text and edges. For stronger compression you can also run the JPEGs through the Image Compressor afterwards.' },
      { question: 'Does it change the size of my images?', answer: 'Not unless you ask it to. Tick "Shrink very large images" to scale anything bigger than a longest side you set down to fit, keeping its proportions.' },
      { question: 'Why is the JPEG sometimes bigger than the PNG?', answer: 'Flat graphics, logos and screenshots often compress better as PNG than JPEG. The tool tells you when a JPEG came out larger, so you can keep the PNG for those.' },
      { question: 'Can I rename the converted files?', answer: 'Yes. Add a prefix or a suffix, for example "-web", so the converted files do not overwrite your originals. Characters that are not allowed in file names are removed, and files with the same name are numbered in the ZIP so none is lost.' },
    ],
  },
  'svg-to-png': {
    intro: 'Convert SVG files, or SVG code you paste in, to PNG. Set the size as a scale from 1x to 8x or as an exact width in pixels, and choose a transparent or coloured background. Everything runs in your browser.',
    facts: ['Scale or exact width', 'Transparent or coloured background', 'Files or pasted code'],
    faqs: [
      { question: 'Is my artwork uploaded?', answer: 'No. The SVG is drawn and converted on your own device, so your files are never sent to a server. Scripts inside an SVG are never run.' },
      { question: 'How do I get a PNG of an exact size?', answer: 'Choose "Width", enter the pixels you need, and the height follows the SVG\'s proportions. Use "Scale" instead to multiply whatever size the SVG declares for itself.' },
      { question: 'Which scale should I choose?', answer: '2x is a good default and keeps icons sharp on high-density screens. Use 4x or more for print or large banners. Browsers limit how big an image can be, so very large results are reduced to the most your browser can draw, and the tool tells you when that happens.' },
      { question: 'Why does my SVG come out at 300 by 150?', answer: 'The SVG does not say how big it is: it has no width, height or viewBox. Browsers then assume 300 by 150, and so does this tool. Choose "Width" to set the output size you want, or add a viewBox to the SVG.' },
      { question: 'Will the background be transparent?', answer: 'Yes by default: areas your SVG leaves empty stay transparent. Untick "Transparent background" to fill with a colour, for destinations that do not support transparency.' },
      { question: 'Why does the PNG look different from my design app?', answer: 'SVGs that use fonts that are not embedded, linked external images, or HTML inside the SVG can render differently in a browser, and some of these are blocked for security. Convert text to outlines and embed any images before exporting.' },
      { question: 'Can I paste SVG code instead of uploading a file?', answer: 'Yes. Open "Paste SVG code", paste your markup, and it is converted like a file.' },
    ],
  },
  'pdf-to-image': {
    intro: 'Turn the pages of a PDF into PNG or JPEG images. Pick any pages, choose how sharp the images are, and download them as a ZIP. Your PDF never leaves your device.',
    facts: ['Files stay on your device', 'Pick any pages', 'Password-protected PDFs supported'],
    faqs: [
      { question: 'Is my PDF uploaded?', answer: 'No. The PDF is opened and drawn in your browser, so the document is never sent to a server. That makes it suitable for contracts, invoices and ID scans.' },
      { question: 'Can I convert only some pages?', answer: 'Yes. Click the pages you want in the preview grid, or type a range such as 1-3, 5, 8- in the Pages box. One page downloads as an image, and several download together as a ZIP with files named after your PDF.' },
      { question: 'How sharp will the images be?', answer: 'You choose a resolution from 1x to 4x. Scale 1 is 72 pixels per inch of page, so 2x is 144 DPI, which suits screens, and 4x is about 288 DPI, which suits printing. The tool shows the approximate size in pixels before you convert.' },
      { question: 'Should I choose PNG or JPEG?', answer: 'PNG keeps text and line art perfectly crisp. JPEG is smaller for pages that are mostly photographs, and you can set its quality.' },
      { question: 'Can it open a password-protected PDF?', answer: 'Yes. If a PDF needs a password, the tool asks for it. The password is used in your browser to open the file and is never sent anywhere.' },
      { question: 'Is there a size limit?', answer: 'PDFs up to 100 MB are supported. Long documents at a high resolution need a lot of memory, so convert fewer pages at a time or lower the resolution if your browser slows down. Very large pages, such as posters, are reduced to the largest size a browser can draw, and the tool tells you when that happens.' },
    ],
  },
  'image-to-pdf': {
    intro: 'Combine photos and scans into one PDF. Put them in order, rotate any that are sideways, choose A4, US Letter or pages that match each image, and download. Everything happens in your browser.',
    facts: ['Files stay on your device', 'Reorder and rotate pages', 'Right way up, never stretched'],
    faqs: [
      { question: 'Are my images uploaded?', answer: 'No. The PDF is built in your browser, so your images never reach a server.' },
      { question: 'Which image types can I use?', answer: 'Any image your browser can open, including JPG, PNG, WebP and GIF (a GIF contributes its first frame). Formats browsers cannot open, such as HEIC from some phones, are skipped with a message; save them as JPG or PNG first.' },
      { question: 'Why do my phone photos come out the right way up?', answer: 'Photos from phones and cameras carry a rotation note. The tool applies it before the image goes into the PDF, so a portrait photo is a portrait page rather than a sideways or stretched one. You can also rotate any image yourself.' },
      { question: 'What page sizes and layouts are available?', answer: 'A4 or US Letter, or "Fit image", where each page is exactly the size of its image plus the margin. On A4 and Letter, "Match image" gives wide images landscape pages and tall images portrait pages, or you can force one orientation for every page. Images are fitted inside the margins without being stretched.' },
      { question: 'Can I change the order of the pages?', answer: 'Yes. Use Up and Down on each image to reorder, Rotate to turn a page a quarter turn, and Remove to drop one.' },
      { question: 'How do I keep the PDF small?', answer: 'Choose "Balanced" or "Small" for image quality. Balanced scales large photos to about 300 DPI on an A4 page, and Small is smaller still, which suits email. "Original size" embeds every pixel and makes the biggest files.' },
      { question: 'What happens to transparent areas?', answer: 'Images are placed on a white page, so transparent areas appear white.' },
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
    intro: 'Add UTM tags to a link so Google Analytics can tell you which campaign, source and medium brought each visit. Your address is kept exactly as you wrote it. Copy the finished link, make a QR code, or shorten it.',
    facts: ['Keeps your address untouched', 'Tidies values for clean reports', 'Copy, QR code or short link'],
    faqs: [
      { question: 'Which fields do I have to fill in?', answer: 'The website address, source (where the traffic comes from, such as newsletter), medium (the channel, such as email) and campaign name. Term and content are optional.' },
      { question: 'Are UTM values case-sensitive?', answer: 'Yes. In Google Analytics "Email" and "email" are reported as different values. By default this tool lowercases your values and turns spaces into hyphens so they stay together; untick the option to keep exactly what you typed.' },
      { question: 'Does it change the rest of my address?', answer: 'No. Existing query parameters and the #fragment are kept exactly as written, and the UTM tags are added after them. Only a utm_ parameter that is already there is replaced, and the tool tells you when that happens.' },
      { question: 'Do UTM links affect SEO?', answer: 'Generally not. Most sites use canonical tags, so the tagged address is treated as the same page. Use UTM tags for links you share, not for links inside your own site.' },
      { question: 'Can I shorten a UTM link?', answer: 'Yes. Shortening keeps the tags and gives you a link that is cleaner for social posts and print. Building the link happens in your browser; only when you click Shorten is the address sent to iNNkie to create the short link.' },
      { question: 'Can I use a UTM link in a QR code?', answer: 'Yes. Use "Make a QR code" to put the link, or its short version, into a code, and tag it with a source such as qr-code so scans show up separately in your reports.' },
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
  'jwt-decoder': {
    intro: 'Decode a JSON Web Token and see straight away whether it has expired. Read the header and claims, and check an HS256 signature with a test secret. Everything runs in your browser.',
    facts: ['Expiry shown at a glance', 'Accepts "Bearer ..." headers', 'Nothing is uploaded'],
    faqs: [
      { question: 'Is my token sent anywhere?', answer: 'No. The token is decoded in your browser and never uploaded. A token is still a credential that works until it expires, so avoid pasting live production tokens into any website you do not need to.' },
      { question: 'Is decoding the same as verifying?', answer: 'No. A JWT is encoded, not encrypted, so anyone who has it can read its contents. Verifying checks the signature, which proves the token was issued by someone holding the key and has not been changed.' },
      { question: 'Can it verify the signature?', answer: 'Yes for HS256, HS384 and HS512, using the shared secret. Tokens signed with RS256, ES256 and similar algorithms are checked with a public key, which this tool does not handle, so verify those in your own code.' },
      { question: 'Why does it say expired when my server still accepts the token?', answer: 'The tool compares the exp claim with your device\'s clock. Servers often allow a few minutes of leeway, and clocks can differ. Check that exp is in seconds, not milliseconds.' },
      { question: 'Why does it say my token has five parts?', answer: 'A token with five parts is an encrypted JWT (JWE). Its contents cannot be read without the decryption key.' },
      { question: 'What are iat, nbf and exp?', answer: 'They are times, written as seconds since 1 January 1970 UTC: when the token was issued, the earliest time it is valid, and when it expires. The tool shows each in your local time and in UTC.' },
      { question: 'What does "alg: none" mean?', answer: 'It means the token has no signature at all. Anyone can create such a token with any contents, so a server must never accept it as proof of identity.' },
    ],
  },
  'csv-json-converter': {
    intro: 'Convert CSV to JSON and JSON to CSV in your browser. It handles quoted values, line breaks inside cells and any separator, and it never turns codes like 007 into numbers.',
    facts: ['Handles quotes and multi-line cells', 'Detects the separator for you', 'Nothing is uploaded'],
    faqs: [
      { question: 'Is my data uploaded?', answer: 'No. Files you open and text you paste are converted in your browser and never sent to a server.' },
      { question: 'Why did 007 stay as text instead of becoming a number?', answer: 'Numbers are converted only when that cannot change them. Values with leading zeros (007), a plus sign (+15551234567) or more than 15 digits would be altered by becoming JSON numbers, so they stay as text. Untick "Convert numbers and true/false" to keep every value as text.' },
      { question: 'What happens to nested JSON when I convert it to CSV?', answer: 'Nested objects are flattened into columns with dotted names, such as stats.clicks. Arrays are written into a single cell as JSON text. You can turn flattening off, in which case a nested object is written to one cell as JSON.' },
      { question: 'Which separators does it support?', answer: 'Comma, semicolon, tab and pipe. For CSV input it detects the separator automatically, and you can choose one yourself.' },
      { question: 'Why do accents look wrong when I open the CSV in Excel?', answer: 'Excel needs a byte-order mark to read a UTF-8 file correctly. Files saved with Download include one. Text you copy does not, so use Download for Excel.' },
      { question: 'What if some rows have a different number of cells?', answer: 'The tool tells you. Extra values are kept in columns named column_N, and missing values are left empty, so nothing is silently dropped.' },
      { question: 'How large a file can I convert?', answer: 'Files up to 20 MB can be opened, and the practical limit is your device\'s memory. The preview shows the first rows so the page stays responsive.' },
    ],
  },
  'base64-encoder': {
    intro: 'Encode text or files to Base64, or decode Base64 back into text, images and other files. It handles URL-safe Base64 and data: URIs, and everything runs in your browser.',
    facts: ['Every character counts', 'URL-safe and data: URIs', 'Text, images and files'],
    faqs: [
      { question: 'Is Base64 a way to keep data secret?', answer: 'No. Base64 is an encoding, not encryption. Anyone can decode it instantly with no key, so never use it to hide passwords or personal data.' },
      { question: 'Is my data uploaded?', answer: 'No. Encoding and decoding happen in your browser. Text and files never leave your device.' },
      { question: 'Why does the result end with = signs?', answer: 'They are padding. Base64 works in groups of three bytes, and padding fills the last group. You can leave it out when you encode, and the decoder accepts input with or without it.' },
      { question: 'What is URL-safe Base64?', answer: 'It swaps + and / for - and _ so the result can sit safely in a URL or file name. JSON Web Tokens use it. Tick the URL-safe option to produce it. When decoding, both forms are recognised automatically.' },
      { question: 'Can I encode an image or another file?', answer: 'Yes. Choose "Encode a file". For a file with a known type you can also copy the result as a data: URI to embed it in HTML or CSS. The encoded text is about a third larger than the file.' },
      { question: 'Can I decode an image or a PDF?', answer: 'Yes. If the decoded bytes are not text, the tool recognises common types such as PNG, JPEG, GIF, WebP, PDF and ZIP, shows a preview for images, and lets you download the file.' },
      { question: 'Why is my decoded text garbled?', answer: 'Text is read as UTF-8. If the data was encoded with another character set, or is not text at all, the result will not look right. The tool treats data that is not valid UTF-8 as a file instead of showing noise.' },
    ],
  },
  'uuid-generator': {
    intro: 'Generate random (v4) or time-ordered (v7) UUIDs in bulk. Choose the format, copy one or all of them, and check what version a UUID is. Nothing is sent or stored.',
    facts: ['v4 random and v7 time-ordered', 'Up to 1,000 at a time', 'Secure browser random generator'],
    faqs: [
      { question: 'What is a UUID?', answer: 'A universally unique identifier is a 128-bit value, written as 32 hexadecimal digits in groups of 8-4-4-4-12. It is designed so that different systems can create IDs independently without clashing.' },
      { question: 'What is the difference between v4 and v7?', answer: 'A v4 UUID is almost entirely random. A v7 UUID starts with the current time in milliseconds followed by random bits, so values created later sort later. That makes v7 friendlier to database indexes, but it also reveals when the ID was created.' },
      { question: 'Could two UUIDs ever be the same?', answer: 'In practice no. A v4 UUID has 122 random bits, so the chance of a repeat is vanishingly small. The values come from your browser\'s secure random number generator.' },
      { question: 'Are UUIDs safe to use as secrets?', answer: 'They are identifiers, not secrets. A v4 UUID is unpredictable, but it is not designed as an access token, and a v7 UUID contains its creation time. Use a purpose-made random token for anything that grants access.' },
      { question: 'Why are there uppercase and brace options?', answer: 'Different systems write the same value differently. Microsoft GUIDs often use braces and uppercase, and some databases store UUIDs without hyphens. All the formats represent the same ID.' },
      { question: 'Is v7 supported everywhere?', answer: 'v7 was standardised in RFC 9562 in 2024, so support in libraries and databases is still growing. Check that yours accepts it before you rely on it; it is stored and compared like any other UUID.' },
      { question: 'Is anything sent or stored?', answer: 'No. UUIDs are created in your browser and are not sent anywhere or saved.' },
    ],
  },
  'url-encoder': {
    intro: 'Percent-encode and decode text and URLs. It copes with broken input, spots double encoding, and breaks a URL into its parts and decoded query parameters. Everything runs in your browser.',
    facts: ['Decodes what it can', 'Spots double encoding', 'Shows the parts of a URL'],
    faqs: [
      { question: 'What is percent-encoding?', answer: 'It replaces characters that are not safe in a URL with a percent sign and the two hexadecimal digits of each UTF-8 byte. A space becomes %20, and é becomes %C3%A9.' },
      { question: 'What is the difference between "one value" and "a whole URL"?', answer: 'One value escapes every character that could be mistaken for URL structure, including ? & = / and #, so use it for a single query value or path segment. A whole URL keeps those structural characters and only escapes spaces and non-ASCII characters. Encoding a complete URL as one value is the classic mistake that breaks a link.' },
      { question: 'Should a space be %20 or +?', answer: '%20 works everywhere. A + means a space only in HTML form data. This tool writes %20 unless you tick "Write spaces as +", and when decoding it leaves + as a plus unless you tick "Read + as a space".' },
      { question: 'Why were parts of my text left as written when decoding?', answer: 'A stray % that is not followed by two hex digits, or bytes that are not valid UTF-8, cannot be decoded. The tool decodes everything else and lists each part it left alone with its position. Bytes like %E9 usually come from an older system that used Latin-1.' },
      { question: 'What is double encoding?', answer: 'It happens when already-encoded text is encoded again, so %20 becomes %2520. If the decoded result still contains percent sequences, the tool tells you and offers to decode it once more.' },
      { question: 'Which characters are never encoded?', answer: 'Letters, digits and - _ . ~ are always left alone. Encoding one value also leaves ! * \' ( ) as they are, unless you tick the option to escape them too.' },
      { question: 'Is my text uploaded?', answer: 'No. Encoding and decoding happen in your browser.' },
    ],
  },
  'timestamp-converter': {
    intro: 'Convert Unix timestamps to readable dates and back. It detects seconds, milliseconds, microseconds and nanoseconds, reads dates exactly, and shows the result in UTC, your local time and any time zone you choose.',
    facts: ['Seconds to nanoseconds', 'Show in any time zone', 'Exact ISO 8601 reading'],
    faqs: [
      { question: 'What is a Unix timestamp?', answer: 'The number of seconds that have passed since 1 January 1970 at 00:00:00 UTC, known as the epoch. It is the same instant everywhere in the world; only the way it is displayed depends on the time zone.' },
      { question: 'How does it tell seconds from milliseconds?', answer: 'By the size of the number: about 10 digits is seconds, 13 is milliseconds, 16 is microseconds and 19 is nanoseconds. The tool tells you what it assumed, and you can choose the unit yourself when the guess is wrong, for example for a very early date.' },
      { question: 'Why does a date without a time zone give different results on different computers?', answer: 'Without a zone, the text is read in a zone you pick, which is your local time by default, so two people in different zones get different timestamps. Choose UTC, or write a zone in the text, such as 2026-01-01T09:30:00Z or 2026-01-01T09:30:00+02:00, for a result that is the same everywhere.' },
      { question: 'Why do some tools treat 2026-01-01 and 2026-01-01T00:00 differently?', answer: 'JavaScript reads a date on its own as UTC, but a date with a time and no zone as local time. This tool reads both the same way, in the zone you choose.' },
      { question: 'What is the year 2038 problem?', answer: 'Systems that store the timestamp as a signed 32-bit number of seconds run out at 03:14:07 UTC on 19 January 2038, which is the value 2147483647. Newer systems use 64 bits.' },
      { question: 'Does Unix time include leap seconds?', answer: 'No. Unix time counts every day as exactly 86,400 seconds, so leap seconds are not represented.' },
      { question: 'Is anything sent to a server?', answer: 'No. Conversions happen in your browser, using your device clock and time zone data.' },
    ],
  },
};
