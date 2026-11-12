/** Long-form explanatory copy shown under a tool, keyed by tool id. Server-rendered and crawlable. */
export interface ToolArticleSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export const TOOL_ARTICLES: Record<string, ToolArticleSection[]> = {
  'word-counter': [
    {
      heading: 'How the word counter works',
      paragraphs: [
        'The counter splits your text on whitespace to count words, counts every character with and without spaces, and detects sentences and paragraphs from punctuation and blank lines. It also estimates reading time at about 200 to 250 words per minute, and speaking time at about 130 words per minute, which are the averages most editors and speech coaches use.',
        'Everything is calculated in your browser as you type. Nothing is sent to a server, so you can safely paste drafts, essays or confidential documents.',
      ],
    },
    {
      heading: 'Common word-count targets',
      paragraphs: ['Many platforms enforce limits, and hitting them exactly matters:'],
      bullets: [
        'Meta descriptions: about 150 to 160 characters before search results cut them off.',
        'Page titles: about 50 to 60 characters.',
        'X (Twitter) posts: 280 characters; LinkedIn posts: up to 3,000 characters.',
        'Blog posts: 800 to 1,500 words for most topics; long guides often exceed 2,000.',
        'College application essays: commonly 250 to 650 words, and strictly enforced.',
        'SMS messages: 160 characters per segment for plain text.',
      ],
    },
    {
      heading: 'Why words and characters are counted differently',
      paragraphs: [
        'Word counts depend on how a tool defines a word. Hyphenated terms such as "well-known" and contractions such as "don\'t" count as one word here, which matches most word processors. Numbers and URLs also count as a single word each.',
        'Character counts differ when spaces are included or excluded, and some systems count emoji and accented letters as more than one character internally. If a platform has a hard limit, use its own counter for the final check.',
      ],
    },
    {
      heading: 'Tips for tighter writing',
      paragraphs: [
        'A word count is a starting point, not a quality score. Use it to spot padding: if a paragraph can lose a third of its words without losing meaning, it should. Watch for long sentences (over 25 words), repeated openers, and filler such as "really", "very" and "in order to". Reading your text aloud while checking the speaking-time estimate is a reliable way to find clumsy phrasing.',
      ],
    },
  ],
  'image-compressor': [
    {
      heading: 'What you can set',
      paragraphs: [
        'Quality starts at 75% and can be moved up or down. You can also set a maximum width or height, choose the output format (JPEG, PNG, WebP, or keep each file as it is), and set a target maximum size, which starts at 0.5 MB. The compressor lowers quality and, if needed, dimensions to reach your target.',
        'If you leave the width and height empty, images larger than 1920 pixels on their longest side are scaled down. That is usually what a web page needs, and it is where most of the saving comes from.',
      ],
    },
    {
      heading: 'Choosing a quality setting',
      paragraphs: [
        'For photographs, a quality of 75 to 85 percent usually cuts the file size by more than half with no visible difference at normal viewing size. Below about 60 percent, blocky artefacts start to appear around edges and in skies and gradients.',
        'Screenshots, logos and diagrams are different: they contain sharp edges and flat colours that JPEG handles badly. Keep these as PNG, or convert them to WebP, which handles both photos and graphics well.',
      ],
    },
    {
      heading: 'Check before you download',
      paragraphs: [
        'Each image shows the bytes saved. Click one to open the quality inspection and compare the original with the compressed version side by side. Look at text, faces and fine textures, which show damage first.',
      ],
    },
    {
      heading: 'Why smaller images matter',
      paragraphs: [
        'Images are usually the heaviest part of a web page. Large, uncompressed pictures slow down loading, hurt Core Web Vitals scores such as Largest Contentful Paint, and increase bounce rates on mobile connections. Search engines use page speed as a ranking signal, so compression helps both visitors and visibility.',
      ],
      bullets: [
        'Resize to the largest size the image is actually displayed at before compressing; a 4000-pixel photo shown at 800 pixels wastes most of its bytes.',
        'Prefer WebP for the web; keep JPEG as a fallback for older software.',
        'Strip metadata such as camera details and GPS location when you publish photos.',
        'Compress once from the original; re-compressing an already compressed JPEG compounds the quality loss.',
      ],
    },
    {
      heading: 'When not to compress',
      paragraphs: [
        'Keep an untouched original for print work, archives and anything you may need to edit later. Compression is irreversible, so treat the compressed copy as a delivery format only.',
      ],
    },
  ],
  'pdf-to-image': [
    {
      heading: 'How PDF to image conversion works here',
      paragraphs: [
        'Your PDF is opened and drawn page by page onto a canvas in your browser, using the same engine that powers Firefox\'s built-in PDF viewer. Each page is then exported as a PNG or JPEG. Convert the whole document and download a ZIP of page-1, page-2 and so on, or select one page and download only that. Because rendering happens on your own device, the document is never uploaded, which makes the tool suitable for contracts, invoices and ID scans.',
      ],
    },
    {
      heading: 'Picking the right settings',
      paragraphs: [
        'The scale runs from 1x to 4x, with 2x as the default. A higher scale gives sharper text and a larger file, so use a moderate one for sharing on screen and a higher one when the image will be printed or processed by OCR software. PNG keeps text and line art perfectly crisp; JPEG is smaller for pages that are mostly photographs.',
        'Our guide to PDF to image resolution and quality explains DPI, formats and file size in detail.',
      ],
    },
    {
      heading: 'Typical uses',
      paragraphs: ['People convert PDFs to images for many everyday reasons:'],
      bullets: [
        'Posting a single page of a report or flyer to social media.',
        'Inserting a page into a slide deck or a design tool that does not accept PDFs.',
        'Sending a preview that cannot be edited.',
        'Sharing a page in a chat app that does not display PDFs inline.',
        'Preparing scanned pages for text recognition (OCR).',
      ],
    },
    {
      heading: 'Troubleshooting',
      paragraphs: [
        'If a page looks blank, try a different scale; some PDFs use transparency that renders differently at certain sizes. Password-protected files must be unlocked first. Very long documents or very large pages at a high scale can exhaust browser memory, so lower the scale for those. The limit for a single PDF is 50 MB.',
      ],
    },
  ],
  'svg-to-png': [
    {
      heading: 'SVG versus PNG',
      paragraphs: [
        'SVG is a vector format: it describes shapes with maths, so it stays sharp at any size and is usually tiny. PNG is a raster format: a fixed grid of pixels. SVG is ideal for logos and icons on your own website, but many places only accept raster images, including email clients, social networks, presentation tools and some content management systems. Converting to PNG solves that.',
      ],
    },
    {
      heading: 'How the converter works',
      paragraphs: [
        'Drop one or more .svg files, or choose "Add vector code" and paste markup. Each is drawn in your browser at the scale you choose, from 1x to 8x (2x by default), and shown next to the original so you can check it. Add a prefix or suffix to name the files, then download one PNG or a ZIP of all of them.',
      ],
    },
    {
      heading: 'Getting a sharp result',
      paragraphs: [
        'Because a PNG has a fixed size, the scale decides how sharp it is. Use 2x for icons that must look crisp on high-density screens, and 4x or more for print or large banners. You can always shrink a large PNG without losing quality, but enlarging a small one makes it blurry.',
        'Very large scales need a lot of memory and browsers cap the size of an image, so if a conversion fails, lower the scale.',
      ],
      bullets: [
        'Social profile images: about 800 to 1000 pixels square.',
        'Email signatures: roughly 2x the displayed size.',
        'Favicons and app icons: export separate sizes such as 192 and 512 pixels.',
      ],
    },
    {
      heading: 'Transparency and backgrounds',
      paragraphs: [
        'PNG supports transparency, so areas your SVG leaves empty stay transparent and blend into any page. If a destination turns transparency black, add a background rectangle to the SVG before converting.',
      ],
    },
    {
      heading: 'Why an SVG may look different',
      paragraphs: [
        'SVGs that rely on fonts not embedded in the file, external images, or advanced filters may render differently in a browser than in a design program. Convert text to outlines in your design tool before exporting, and make sure referenced images are embedded. These steps remove most surprises.',
      ],
    },
  ],
  'png-to-jpeg': [
    {
      heading: 'What this converter does',
      paragraphs: [
        'Each PNG is converted to a JPEG at a fixed 92% quality, which keeps photos looking the same while making them much smaller. Images larger than 4096 pixels on their longest side are scaled down, and each result is kept to about 5 MB or less. You can add a prefix or suffix to the file names and see the saving for every file.',
        'Click any image to open the quality check and compare the original PNG with the converted JPEG side by side before you download, either one by one or all at once as a ZIP.',
      ],
    },
    {
      heading: 'What happens to transparent areas',
      paragraphs: [
        'JPEG cannot store transparency. Transparent areas in your PNG are filled with white, so a logo with no background will come out on a white one. If you need the transparency, keep the file as PNG, or use a format such as WebP.',
      ],
    },
    {
      heading: 'When JPEG is the right choice',
      paragraphs: [
        'PNG is lossless, which is ideal for logos, icons, text and screenshots with sharp edges. JPEG is lossy and designed for photographs and smooth gradients. Photos saved as PNG are often far larger than they need to be, and converting them can cut the size by more than half with no difference you would notice.',
        'The reverse is also true: flat graphics and screenshots can come out larger as JPEG, and text can look fuzzy around the edges. Use the comparison view to check before you commit.',
      ],
      bullets: [
        'Convert from your original PNG, not from a file that has already been through several saves.',
        'Add a suffix such as "-web" so converted files never overwrite your originals.',
        'For even smaller files, run the JPEGs through the Image Compressor afterwards.',
      ],
    },
  ],
  'image-resizer': [
    {
      heading: 'How resizing works here',
      paragraphs: [
        'Load an image and set the width and height in pixels. With the lock on, changing one side updates the other so the proportions stay the same. Switch the lock off to set both sides freely, or start from a preset: Instagram Square (1080 by 1080), Twitter Post (1200 by 675), YouTube Thumbnail (1280 by 720) or Standard HD (1920 by 1080).',
        'Then export as PNG or JPEG. The preview shows exactly what will be downloaded. Sizes up to 16,384 pixels per side are supported.',
      ],
    },
    {
      heading: 'Crop or stretch',
      paragraphs: [
        'When the new shape is different from the photo\'s, you decide what gives. "Crop to fill" keeps the proportions, scales the picture until it covers the new size, and trims the overflow equally from both sides. "Stretch" fits the whole image into the exact size and can distort it. Cropping is almost always what you want for social media sizes; stretching is for the rare case where the content must not be cut.',
      ],
    },
    {
      heading: 'Choosing a size',
      paragraphs: [
        'Resize to the size the image is actually shown at. For sharp results on high-density screens, use about twice the displayed size. Making an image larger never adds detail, so start from the biggest original you have, and avoid enlarging small images.',
        'Platforms change their recommended sizes from time to time, so check the current guidance when it matters.',
      ],
    },
    {
      heading: 'PNG or JPEG export',
      paragraphs: [
        'PNG is lossless and keeps transparency. JPEG is smaller for photographs but cannot be transparent, so transparent areas are exported on a white background. If the file is still too big after resizing, compress it with the Image Compressor.',
      ],
    },
  ],
  'image-to-pdf': [
    {
      heading: 'How it works',
      paragraphs: [
        'Add your images, put them in the order you want with the move up and move down buttons, and remove any you do not need. Choose A4 pages, or pages that take the size of each image, then portrait or landscape and a margin in millimetres (10 by default). Each image is fitted inside its page without being stretched, and the combined PDF is built in your browser.',
        'JPG and PNG images are used as they are. Other formats such as WebP and GIF are converted to PNG first so they can be embedded.',
      ],
    },
    {
      heading: 'Choosing a page size',
      paragraphs: [
        'A4 is right when the document will be printed or emailed as a standard document. Choose the option that matches each image when you want the PDF to look exactly like the pictures, for example a set of screenshots or a design that should not get white borders. Landscape suits wide images, portrait suits photos of pages.',
      ],
    },
    {
      heading: 'Keeping the PDF small',
      paragraphs: [
        'A PDF made from photos is as large as those photos. Modern phone pictures are often 3 to 8 MB each, so a ten-page document can easily exceed an email limit. Run the images through the Image Compressor first, then combine them. Scans of documents are usually fine at a few hundred kilobytes per page.',
      ],
    },
    {
      heading: 'A note on privacy',
      paragraphs: [
        'IDs, receipts and signed paperwork are the files people most often turn into PDFs. Because the PDF is created on your device and nothing is uploaded, there is no copy of it on our side. You can check this in your browser\'s Network tab while you use the tool.',
      ],
    },
  ],
  'qr-generator': [
    {
      heading: 'What is inside a QR code',
      paragraphs: [
        'A QR code is just your content drawn as a pattern of squares. For a web address, the code holds the address itself, so a phone that scans it opens the page directly. There is no server in between, which means the code never expires and cannot be switched off, but it also cannot count scans or be pointed somewhere else later.',
        'Besides links and plain text, this generator can make codes for a Wi-Fi network, an email with a ready-written subject and message, and a phone number. Scanning a Wi-Fi code lets a guest join the network without typing the password, which is handy for a cafe, an office or a guest room.',
      ],
    },
    {
      heading: 'Choosing the size and error correction',
      paragraphs: [
        'The PNG size sets the number of pixels in the file. Use 512 px for a web page or slide, and 1024 px or more for anything printed. For posters and signs, download the SVG instead, because a vector file stays sharp at any size.',
        'Error correction lets a code still scan when part of it is dirty, worn or covered. Medium (15%) is right for nearly everything. Higher levels survive more damage but make the pattern denser, so they need more room to print. The tool shows the QR version of your code and warns when it gets dense.',
      ],
    },
    {
      heading: 'When to use a short link instead',
      paragraphs: [
        'If you want to know how many people scanned a code, create a short link with the URL Shortener and put that short link in the QR code. A short address also makes the code simpler, with fewer squares, so it scans more reliably at small sizes. You can switch the link off or give it an expiry date later, even after the code has been printed.',
      ],
    },
    {
      heading: 'Colours and scanning',
      paragraphs: [
        'You can change both colours, but scanners are built to read a dark code on a light background. Light-on-dark (inverted) codes fail on some devices, and colours that are too close together may not scan at all, so the tool warns you about both. Black on white is the safest choice.',
      ],
    },
    {
      heading: 'Before you print',
      paragraphs: ['A few checks prevent almost every failed scan:'],
      bullets: [
        'Scan the final file with an iPhone and an Android phone.',
        'Keep a blank border around the code, and do not crop it.',
        'Print it at least 2 cm wide, and larger for anything read from a distance.',
        'Use SVG for anything that will be enlarged.',
      ],
    },
    {
      heading: 'Want a logo or custom shapes?',
      paragraphs: [
        'For a logo in the middle, gradients and different dot and corner shapes, use QR Studio. When you cover part of the code with a logo, use a higher error correction level. Our QR code guide explains size, contrast and error correction in more detail.',
      ],
    },
  ],
  'qr-studio': [
    {
      heading: 'What you can design',
      paragraphs: [
        'Choose a dot style (rounded, dots, classy, classy rounded, square or extra rounded), a corner shape and a corner eye. Pick a brand colour from presets or your own, or switch to a gradient and choose its direction, and set the background colour. Add a logo by uploading one or choosing a common social icon, then adjust its size and margin and hide the dots behind it. The preview updates as you change things, and you can download the result as PNG or SVG.',
      ],
    },
    {
      heading: 'Keeping it scannable',
      paragraphs: [
        'A QR code is read by comparing dark and light squares, so style should never get in the way of contrast. Keep the foreground much darker than the background, avoid gradients that fade towards the background colour, and keep the logo small, because it covers part of the data. Test the finished design on several phones, in normal and dim light, before you print.',
      ],
      bullets: [
        'Dark on light is the safest combination; inverted codes fail on some scanners.',
        'Convert the design to greyscale: if it is hard to read there, it is hard to scan.',
        'Print a proof at the final size and on the final material.',
      ],
    },
    {
      heading: 'What the code contains',
      paragraphs: [
        'The code holds the address you enter. It does not track scans on its own. To count them, create a short link with the URL Shortener and use that address. Our QR code guide covers sizing, contrast and tracking in more detail.',
      ],
    },
    {
      heading: 'PNG or SVG',
      paragraphs: [
        'Download PNG for screens, slides and documents. Download SVG for print, signs and packaging, because a vector file stays sharp at any size.',
      ],
    },
  ],
  'utm-builder': [
    {
      heading: 'What UTM parameters are',
      paragraphs: [
        'UTM parameters are short tags added to the end of a link, such as ?utm_source=newsletter&utm_medium=email&utm_campaign=spring-sale. When someone clicks, analytics tools such as Google Analytics read the tags and credit the visit to that source, medium and campaign. Without them, much of your traffic is lumped together as direct or referral.',
      ],
    },
    {
      heading: 'The five fields',
      paragraphs: ['Three are required, two are optional:'],
      bullets: [
        'Source: where the traffic comes from, such as a newsletter, a site or a platform.',
        'Medium: the kind of channel, such as email, social or cpc.',
        'Campaign: the name of the promotion, such as spring-sale.',
        'Term (optional): a paid search keyword.',
        'Content (optional): tells apart two links in the same campaign, such as header-button and footer-link.',
      ],
    },
    {
      heading: 'Naming rules that keep reports clean',
      paragraphs: [
        'Values are case-sensitive in reports, so "Email" and "email" show up as two different mediums. Decide on lowercase, use hyphens instead of spaces, and keep a shared list so everyone on the team uses the same words. Our guide on UTM naming conventions gives a full scheme.',
      ],
    },
    {
      heading: 'Shortening and privacy',
      paragraphs: [
        'A tagged link can get long. You can shorten it, which keeps the tags and makes it tidier for social posts and print. The link is built in your browser; only when you click Shorten is the address sent to iNNkie to create the short link. Remember that anyone can read the tags in a link, so never put personal data, such as an email address, into a UTM value.',
      ],
    },
  ],
  'json-formatter': [
    {
      heading: 'What you can do with it',
      paragraphs: [
        'Paste JSON and it is checked as you type. Format re-indents it with 2 spaces, 4 spaces or tabs, and Minify strips every unnecessary space. Sort keys orders every object alphabetically, the Tree tab lets you open and close nested parts, and Download saves the formatted result as a .json file. Pasting a single-line JSON document formats it automatically.',
      ],
    },
    {
      heading: 'Why formatting should never change your data',
      paragraphs: [
        'The usual way to pretty-print JSON is to parse it and write it back out. That quietly changes things: whole numbers larger than 9,007,199,254,740,991 are rounded (a database ID can end up wrong), keys that look like numbers are reordered, and duplicate keys disappear. Here, Format and Minify only change whitespace, so every value comes out exactly as it went in.',
        'When your JSON contains numbers that JavaScript cannot hold exactly, the tool tells you. They stay exact in the formatted text; the tree and TypeScript views, and Sort keys, work with approximate numbers, so Sort keys is switched off for those documents.',
      ],
    },
    {
      heading: 'Reading an error',
      paragraphs: [
        'JSON is strict, and a single stray character makes the whole document invalid. The error panel shows the line and column and the line itself with a marker underneath. The mistakes behind most errors are the same few:',
      ],
      bullets: [
        'A trailing comma after the last item in an object or array.',
        'Single quotes instead of double quotes, or property names without quotes.',
        'Comments, which JSON does not allow.',
        'A missing comma between two items.',
        'NaN, Infinity or undefined, which are not valid JSON values.',
      ],
    },
    {
      heading: 'TypeScript from JSON',
      paragraphs: [
        'Copy as TypeScript turns your document into an interface you can paste into code. It quotes keys that are not valid names, such as "user-id", describes arrays of mixed values as unions, and keeps null as null. Because it only sees one example, it cannot know which fields are optional or which strings are really dates or enums, so treat the result as a starting point.',
      ],
    },
  ],
  'jwt-decoder': [
    {
      heading: 'What is inside a JWT',
      paragraphs: [
        'A JSON Web Token is three pieces of text joined by dots. The first is the header, which says how the token is signed. The second is the payload, a set of claims such as who the token is for and when it expires. The third is the signature. The header and payload are just JSON written in Base64URL, so anyone can decode them, which is what this tool does.',
      ],
    },
    {
      heading: 'Reading the result',
      paragraphs: [
        'The coloured banner answers the question people usually come with: is this token still valid? It compares the exp and nbf claims with your device\'s clock and says how long ago the token expired, or how long it has left. Below it you will see the header and payload as formatted JSON, then the standard claims in plain words, with every time shown in your local time and in UTC.',
      ],
      bullets: [
        'iss is the issuer, the service that created the token.',
        'sub is the subject, usually the user ID.',
        'aud is the audience the token is meant for.',
        'iat, nbf and exp are the issued-at, not-before and expiry times.',
        'jti is a unique ID for the token.',
      ],
    },
    {
      heading: 'Decoded does not mean trusted',
      paragraphs: [
        'Because the payload is only encoded, never put secrets in it. And because anyone can build a token with any payload, a server must check the signature before it believes any claim. This tool can check HS256, HS384 and HS512 signatures if you give it the shared secret, which is a convenient way to confirm that a token and a secret belong together. Use test secrets for this. For RS256 and similar algorithms, verification needs the public key and should be done in your own code.',
        'Be especially wary of tokens with alg set to none. They carry no signature, and a service that accepts them accepts forged logins.',
      ],
    },
    {
      heading: 'Common problems',
      paragraphs: ['Most confusing results come from a few things:'],
      bullets: [
        'Pasting a whole header: "Bearer eyJ..." works here, but not in most libraries, which want the token alone.',
        'Line breaks added when a token is copied from a log or email. They are removed automatically here.',
        'Milliseconds instead of seconds in exp. JWT times are seconds, so a value with 13 digits is wrong.',
        'Clock differences between the machine that issued the token and the one checking it.',
      ],
    },
  ],
  'csv-json-converter': [
    {
      heading: 'What it does',
      paragraphs: [
        'Choose a direction, paste your data or open a file, and the converted result appears as you type. For CSV the separator is detected for you, or you can pick comma, semicolon, tab or pipe. A preview table shows the first rows so you can check the columns lined up, and Convert back sends the result straight back through in the other direction to prove nothing was lost.',
      ],
    },
    {
      heading: 'Why conversion should not change your data',
      paragraphs: [
        'A CSV has no types: every value is text. Turning it into JSON means deciding which values are numbers, and a careless converter guesses wrong. Zip codes and product codes such as 007 lose their zeros, phone numbers lose their plus sign, and long IDs are rounded because JavaScript cannot hold them exactly. Here a value becomes a number only when it is a plain number of up to 15 digits with no leading zero or sign. Everything else stays as text.',
        'Plain numbers do get normalised, as JSON requires: 450000.50 becomes 450000.5. If you need every value exactly as written, untick the option and all values stay as text. Going the other way, from JSON to CSV, numbers are copied exactly as they were written.',
      ],
    },
    {
      heading: 'Quoting rules that spreadsheets expect',
      paragraphs: [
        'CSV looks simple until a value contains the separator, a quote or a line break. The standard answer (RFC 4180) is to wrap such a value in double quotes and write any quote inside it twice. This converter reads and writes that format, so a cell that contains a comma, or a whole address spread over two lines, stays in one cell instead of breaking the row. Files from Excel often start with an invisible byte-order mark, which is removed so it does not end up in your first column name.',
      ],
    },
    {
      heading: 'Converting JSON to CSV',
      paragraphs: [
        'A CSV is a flat table, but JSON can nest. By default nested objects are flattened into columns named with dots, such as stats.clicks, and arrays are written into one cell as JSON text. Objects do not all need the same keys: the columns are the union of every key, in the order they first appear, and missing values are left empty. A list of plain values, such as [1, 2, 3], becomes a single column named value.',
      ],
    },
  ],
  'base64-encoder': [
    {
      heading: 'What it does',
      paragraphs: [
        'Type or paste text and the Base64 appears as you go, or choose a file to encode. In the other direction, paste Base64 or a data: URI and the tool works out what is inside. Text is shown exactly as it was encoded. Anything else, such as an image, a PDF or a ZIP file, is recognised from its first bytes, previewed if it is an image, and offered as a download.',
      ],
    },
    {
      heading: 'Exactly what you typed',
      paragraphs: [
        'Base64 encodes bytes, so every character counts, including spaces and line breaks at the start or end. "hello" and "hello" followed by a new line produce different results. This tool encodes your input exactly and does not trim it, and when decoding, it shows the text exactly as it was, without reformatting it. If the decoded text is JSON, a Format JSON button lets you pretty-print it while keeping the exact version one click away.',
      ],
    },
    {
      heading: 'Standard, URL-safe and padding',
      paragraphs: [
        'Standard Base64 uses + and / and ends with = padding. The URL-safe variant uses - and _ instead, because + and / have special meanings in addresses and file names; it often drops the padding too. JSON Web Tokens are built from this variant. When you encode, you choose which one you want. When you decode, the tool accepts both, with or without padding, and ignores line breaks, so a block copied from an email or a certificate works as it is.',
      ],
    },
    {
      heading: 'Files and data URIs',
      paragraphs: [
        'Encoding a file gives you text you can paste into JSON, an email or a config file. For a file with a known type you can copy it as a data: URI, such as data:image/png;base64,..., which lets you embed a small image directly in HTML or CSS. Keep that for tiny files: Base64 is about a third larger than the original, and an embedded image cannot be cached on its own.',
      ],
    },
    {
      heading: 'Base64 is not security',
      paragraphs: [
        'Because anyone can decode Base64 without a key, treat anything encoded this way as readable. Basic authentication headers, the middle part of a JWT and many API tokens are only Base64, not protected. If something must stay private, it needs real encryption.',
      ],
    },
  ],
  'uuid-generator': [
    {
      heading: 'What a UUID is for',
      paragraphs: [
        'A UUID lets any system create an identifier on its own, with no central counter, and still be confident it will not collide with anyone else\'s. That is why they are used for database keys, request and trace IDs, file names and anything created in several places at once. They look like 550e8400-e29b-41d4-a716-446655440000: 32 hexadecimal digits in five groups.',
      ],
    },
    {
      heading: 'v4 or v7',
      paragraphs: [
        'Version 4 is the familiar random UUID: apart from a few bits that mark the version and variant, all 122 bits are random. Version 7, defined in RFC 9562, begins with a 48-bit Unix timestamp in milliseconds and fills the rest with random data. Because the start of the value is the time, UUIDs generated later sort after earlier ones.',
        'That ordering matters for databases. Random v4 keys land all over an index, which can slow inserts into large tables, while v7 keys are appended near the end like an auto-incrementing number but without a central counter. The trade-off is that a v7 UUID exposes roughly when it was created. When you generate a batch here, the v7 values come out in increasing order, even when many are created in the same millisecond.',
      ],
    },
    {
      heading: 'Formats',
      paragraphs: [
        'The same ID can be written several ways. Uppercase and braces are common in Microsoft tooling, and hyphenless 32-digit strings are common in databases and URLs. You can also copy a batch as one per line, comma separated, or a JSON array ready to paste into code or a test fixture.',
      ],
    },
    {
      heading: 'Not a secret',
      paragraphs: [
        'A UUID identifies something; it does not prove you are allowed to access it. Do not treat one as a password or a session token, and remember that a v7 UUID reveals its creation time. For access tokens, use a dedicated random token of sufficient length from a cryptographic generator.',
      ],
    },
  ],
  'url-encoder': [
    {
      heading: 'What percent-encoding does',
      paragraphs: [
        'URLs can only carry a limited set of characters. Anything else, such as a space, an accented letter or an emoji, is written as a percent sign followed by the hexadecimal value of each of its UTF-8 bytes. A space becomes %20 and é becomes %C3%A9. Decoding turns those sequences back into the original text.',
      ],
    },
    {
      heading: 'One value or a whole URL',
      paragraphs: [
        'The most common mistake is using the wrong scope. Encoding one value is for a single piece, such as a search term that goes after q=. It escapes every character that could be mistaken for structure, including ? & = / and #, so a term like "fish & chips" cannot break your query string. Encoding a whole URL is for a complete address that is already structured. It leaves : / ? # & = alone and only fixes spaces and non-ASCII characters.',
        'If you encode a complete URL as one value you get https%3A%2F%2Fexample.com..., which is correct only when that URL is itself a parameter of another URL, such as a redirect target.',
      ],
    },
    {
      heading: 'Spaces: %20 or +',
      paragraphs: [
        'In a URL path, a space is always %20. In the query part of an HTML form submission, a space is traditionally written as +, and a real plus sign is written %2B. Many servers accept both in query strings, but only %20 is safe everywhere, which is why it is the default here. Switch on the plus options when you are working with form data.',
      ],
    },
    {
      heading: 'Broken and double-encoded text',
      paragraphs: [
        'Real-world text is often not clean. A stray % in the middle of a sentence, or bytes from an older Latin-1 system, make a strict decoder fail on the whole string. This tool decodes everything it can, leaves the rest exactly as written, and lists each problem with its position so you can see what to fix. If the result still contains percent sequences, the text was probably encoded twice, and you can decode it again with one click.',
      ],
    },
    {
      heading: 'Reading a URL',
      paragraphs: [
        'When your text is an address, the tool also breaks it into scheme, host, port, path and fragment, and lists each query parameter with its value decoded. That is the quickest way to see what a long tracking link actually contains.',
      ],
    },
  ],
  'timestamp-converter': [
    {
      heading: 'What a Unix timestamp is',
      paragraphs: [
        'A Unix timestamp counts the time since the epoch, 00:00:00 UTC on 1 January 1970. Because it is a single number with no time zone attached, it identifies the same instant everywhere, which is why logs, databases and APIs use it. A time zone only matters when you display it, so the same timestamp reads as different clock times in different places.',
      ],
    },
    {
      heading: 'Seconds, milliseconds and beyond',
      paragraphs: [
        'Systems disagree about the unit. Many Unix tools and JWT claims use seconds, JavaScript and Java use milliseconds, and databases and tracing systems may use microseconds or nanoseconds. You can usually tell by length: 10 digits is seconds, 13 is milliseconds, 16 is microseconds and 19 is nanoseconds. The tool detects this and tells you what it assumed. If you paste a value that is much too small or large for what you expect, the unit is the first thing to check, and you can set it yourself.',
        'Integers are read exactly, so a 19-digit nanosecond value keeps its full precision instead of being rounded by floating-point arithmetic.',
      ],
    },
    {
      heading: 'Dates without a time zone',
      paragraphs: [
        'Turning a date into a timestamp needs a time zone, and many tools quietly pick one for you. JavaScript, for instance, reads 2026-01-01 as UTC but 2026-01-01T00:00 as your local time, so two neighbouring formats can differ by hours. Here, ISO 8601 text is read exactly in the zone you choose, local time or UTC, unless the text carries its own offset such as Z or +02:00. Impossible dates, such as 30 February or hour 24, are rejected instead of being rolled forward into the next month.',
        'Text that is not ISO 8601, such as "Jan 1 2026 9:30 AM", is passed to your browser, whose rules vary, and the tool says so. For anything you need to reproduce, use ISO format.',
      ],
    },
    {
      heading: 'Show it in any time zone',
      paragraphs: [
        'Pick a zone such as America/New_York or Asia/Tokyo to see the same instant as local time there, including daylight saving. That makes it easy to answer "what time was this for the customer?" without doing the arithmetic by hand.',
      ],
    },
    {
      heading: 'Pitfalls',
      paragraphs: ['A few things cause most timestamp bugs:'],
      bullets: [
        'Mixing seconds and milliseconds is the most common bug: a value 1000 times too large puts a date thousands of years in the future.',
        'Signed 32-bit seconds overflow on 19 January 2038 at 03:14:07 UTC (2147483647).',
        'Unix time ignores leap seconds, so every day is exactly 86,400 seconds.',
        'Always store and compare timestamps, and convert to a time zone only for display.',
      ],
    },
  ],
};
