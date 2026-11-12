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
      heading: 'What image compression really does',
      paragraphs: [
        'Compression reduces file size by removing data your eyes are unlikely to notice. Lossy compression, used by JPEG and WebP, discards fine colour and detail variations. Lossless compression, used by PNG, rewrites the same pixels more efficiently. The compressor here lets you balance quality against size, and shows the saving for every image so you can decide when to stop.',
        'Because the work happens in your browser, your photos are never uploaded. That matters for unreleased product shots, client work and personal pictures.',
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
        'Your PDF is opened and drawn page by page onto a canvas in your browser, using the same engine that powers Firefox\'s built-in PDF viewer. Each canvas is then exported as a PNG or JPEG file. Because rendering happens on your own device, the document is never uploaded, which makes the tool suitable for contracts, invoices and ID scans.',
      ],
    },
    {
      heading: 'Picking the right settings',
      paragraphs: [
        'Higher resolution gives sharper text but larger files. Use a moderate scale for sharing on screen, and a higher one when the image will be printed or processed by OCR software. PNG keeps text perfectly crisp; JPEG is smaller for pages that are mostly photographs.',
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
        'If a page looks blank, try a different scale; some PDFs use transparency that renders differently at certain sizes. Password-protected files must be unlocked first. Very large pages such as posters or maps can exhaust browser memory at high scales, so lower the resolution for those.',
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
      heading: 'Getting a sharp result',
      paragraphs: [
        'Because a PNG has a fixed size, choose the output dimensions carefully. Export at the largest size you will need, or at twice the display size so the image stays sharp on high-density screens. You can always scale a large PNG down without losing quality, but scaling a small one up makes it blurry.',
      ],
      bullets: [
        'Social profile images: export at 800 to 1000 pixels square.',
        'Email signatures: about 2x the displayed size, for example 400 pixels for a 200-pixel logo.',
        'Print: export at a large size, or keep the SVG and give it to the printer.',
        'Favicons and app icons: export separate sizes such as 192 and 512 pixels.',
      ],
    },
    {
      heading: 'Transparency and backgrounds',
      paragraphs: [
        'PNG supports transparency, so an SVG with no background converts to a PNG that blends into any page. If your destination does not support transparency, or you see a black background after upload, choose a solid background colour before converting.',
      ],
    },
    {
      heading: 'Why an SVG may look different',
      paragraphs: [
        'SVGs that rely on fonts not embedded in the file, external images, or advanced filters may render differently in a browser than in a design program. Convert text to outlines in your design tool before exporting, and make sure referenced images are embedded. These steps remove most surprises.',
        'The conversion runs entirely in your browser, so your artwork stays on your device.',
      ],
    },
  ],
};
