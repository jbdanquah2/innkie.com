import { ShortUrl } from '@innkie/shared-models';

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolContentItem {
  title: string;
  description: string;
  icon?: string;
}

export interface ToolContentSection {
  title: string;
  description?: string;
  items: ToolContentItem[];
}

export interface ToolAlias {
  path: string;
  name?: string;
  h1?: string;
  intro?: string;
  title?: string;
  description?: string;
  image?: string;
  faqs?: ToolFaq[];
  sections?: ToolContentSection[];
}

export interface UtilityTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  category: 'media' | 'link' | 'dev' | 'docs';
  color: 'primary' | 'emerald' | 'blue' | 'rose' | 'amber' | 'indigo';
  seo: {
    title: string;
    description: string;
    keywords?: string[];
    image?: string;
  };
  faqs: ToolFaq[];
  aliases?: ToolAlias[];
  sections?: ToolContentSection[];
}

export const TOOL_REGISTRY: UtilityTool[] = [
  {
    id: 'link-shortener',
    name: 'URL Shortener',
    description: 'Create clean, high-performance short URLs with advanced tracking and analytics.',
    icon: 'fas fa-link',
    route: '/tools/link-shortener',
    category: 'link',
    color: 'primary',
    seo: {
      title: 'Free URL Shortener & Analytics',
      description: 'Shorten links and track smarter with iNNkie. Advanced analytics, custom aliases, and secure redirects for modern teams.',
      keywords: ['url shortener', 'link shortener', 'shorten url', 'track links', 'branded links']
    },
    faqs: [
      {
        question: 'Do my links expire?',
        answer: 'Only if you choose. A link stays active until you delete or switch it off, or until an expiry you set is reached. With an account you can expire a link on a date, after a number of clicks, after a time window, or after a single use.'
      },
      {
        question: 'Is it free to use?',
        answer: 'Yes. You can shorten links as a guest, or create a free account to keep your links, see click analytics and use options such as passwords and expiry.'
      },
      {
        question: 'Can I choose what the short link looks like?',
        answer: 'Yes. Add a custom ending such as innkie.com/spring-sale. Using your own domain instead of innkie.com is not available yet.'
      },
      {
        question: 'Can I change where a link points after creating it?',
        answer: 'No. The destination is fixed once a link is created, which keeps links that have already been shared trustworthy. Create a new link for a different page and switch the old one off if you no longer want it used.'
      },
      {
        question: 'What happens to links used for phishing or spam?',
        answer: 'They are disabled and the account may be closed. If you come across one, use the Report abuse page.'
      }
    ],
    aliases: [
      {
        path: '/tools/custom-short-links',
        name: 'Custom Short Links',
        h1: 'Custom Short Links for Branded Campaigns',
        intro: 'Create memorable short links with custom aliases that are easier to share, recognize, and trust across campaigns.',
        title: 'Custom Branded Short Links',
        description: 'Create custom branded short links for your marketing campaigns. Increase CTR and build brand trust with iNNkie.',
        faqs: [
          {
            question: 'What is a custom short link?',
            answer: 'A custom short link lets you choose the readable alias after innkie.com, so your link can match a product, campaign, or call to action.'
          },
          {
            question: 'Can custom links improve trust?',
            answer: 'Yes. Clear aliases are easier to recognize than random codes, which can make links feel safer and more professional when shared.'
          },
          {
            question: 'Can I track custom short links?',
            answer: 'Yes. Custom short links use the same iNNkie tracking flow, so you can measure clicks and performance from your dashboard.'
          }
        ],
        sections: [
          {
            title: 'Build links people understand',
            description: 'Use custom aliases for launches, newsletters, events, and ads where a readable URL matters.',
            items: [
              {
                title: 'Campaign-friendly aliases',
                description: 'Create links like innkie.com/spring-sale or innkie.com/demo so the destination feels intentional before someone clicks.',
                icon: 'fas fa-bullhorn'
              },
              {
                title: 'Cleaner offline sharing',
                description: 'Short readable links are easier to place on flyers, packaging, slides, podcasts, and videos.',
                icon: 'fas fa-share-nodes'
              },
              {
                title: 'Analytics included',
                description: 'Measure how each custom alias performs across channels without changing your campaign workflow.',
                icon: 'fas fa-chart-line'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'image-compressor',
    name: 'Image Compressor',
    description: 'Reduce file size of JPG, PNG, and WebP images without losing quality. 100% client-side.',
    icon: 'fas fa-compress-arrows-alt',
    route: '/tools/image-compressor',
    category: 'media',
    color: 'blue',
    seo: {
      title: 'Free Online Image Compressor - 100% Private',
      description: 'Compress PNG, JPG, and WebP images locally in your browser. No files are uploaded to any server. Secure and fast.',
      keywords: ['compress image', 'reduce image size', 'image optimizer', 'png compressor', 'jpg compressor']
    },
    faqs: [
      {
        question: 'Is it safe to compress my images here?',
        answer: 'Yes, it is 100% safe. iNNkie uses browser-side compression, meaning your images never leave your computer.'
      },
      {
        question: 'Does it support bulk compression?',
        answer: 'Yes, you can upload multiple images at once and download them all as a single ZIP file.'
      }
    ],
    aliases: [
      {
        path: '/tools/compress-images-for-shopify',
        name: 'Shopify Image Compressor',
        h1: 'Compress Images for Shopify',
        intro: 'Reduce Shopify product, collection, and theme image file sizes locally in your browser to help storefront pages load faster.',
        title: 'Compress Images for Shopify - Free Online Tool',
        description: 'Optimize your Shopify store speed by compressing images locally. Faster load times, better SEO, 100% private.',
        faqs: [
          {
            question: 'Why compress Shopify images?',
            answer: 'Large product and banner images can slow storefront pages. Compressing them reduces file size while preserving useful visual quality.'
          },
          {
            question: 'Are my product photos uploaded?',
            answer: 'No. Compression runs in your browser, so product photos stay on your device during optimization.'
          },
          {
            question: 'Which format should I use for Shopify?',
            answer: 'WebP is usually a strong default for storefront performance. JPEG is a practical fallback for product photography.'
          },
          {
            question: 'Can I optimize several Shopify images at once?',
            answer: 'Yes. You can add multiple images and download the optimized set as a ZIP file.'
          }
        ],
        sections: [
          {
            title: 'Storefront image optimization',
            description: 'Prepare lighter Shopify visuals before uploading them to your store.',
            items: [
              {
                title: 'Product photos',
                description: 'Compress catalog images so product pages stay responsive without making photos look obviously degraded.',
                icon: 'fas fa-bag-shopping'
              },
              {
                title: 'Collection banners',
                description: 'Reduce hero and collection banner sizes before they become the largest assets on a page.',
                icon: 'fas fa-image'
              },
              {
                title: 'Private workflow',
                description: 'Keep unreleased product imagery local while you prepare assets for launch.',
                icon: 'fas fa-shield-alt'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'qr-studio',
    name: 'Branded QR Studio',
    description: 'Design professional QR codes with custom colors, gradients, and your company logo.',
    icon: 'fas fa-palette',
    route: '/tools/qr-studio',
    category: 'link',
    color: 'emerald',
    seo: {
      title: 'Branded QR Code Studio - Professional Custom Designs',
      description: 'Create professional, branded QR codes with your logo, custom colors, and gradients. High-resolution exports for print and digital.',
      keywords: ['qr code generator', 'custom qr code', 'branded qr code', 'qr code with logo', 'qr studio']
    },
    faqs: [
      {
        question: 'Can I add my logo to the QR code?',
        answer: 'Absolutely. You can upload any image to be placed in the center of your QR code.'
      },
      {
        question: 'Are these QR codes high-resolution?',
        answer: 'Yes, our studio exports high-DPI images suitable for everything from business cards to billboards.'
      },
      {
        question: 'What formats can I export in?',
        answer: 'You can export your branded QR codes as PNG for digital use or SVG as a vector format for high-quality printing.'
      },
      {
        question: 'Is it really free?',
        answer: 'Yes, QR Studio is free to use for personal and commercial projects, and you do not need an account to design and download a code.'
      }
    ],
  },
  {
    id: 'png-to-jpeg',
    name: 'PNG to JPEG',
    description: 'Convert PNG images to high-quality JPEG format instantly. Fast and secure browser-side processing.',
    icon: 'fas fa-file-export',
    route: '/tools/png-to-jpeg',
    category: 'media',
    color: 'rose',
    seo: {
      title: 'PNG to JPEG Converter - Free & 100% Private',
      description: 'Convert PNG to JPEG instantly in your browser. No server uploads, maximum privacy, and high-quality conversion.',
      keywords: ['png to jpeg', 'convert png to jpg', 'online image converter', 'png to jpg converter']
    },
    faqs: [
      {
        question: 'Why should I convert PNG to JPEG?',
        answer: 'JPEG files are typically much smaller than PNGs, making them better for websites and emails where fast loading is crucial.'
      }
    ]
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Clean, validate, and format your JSON data for better readability.',
    icon: 'fas fa-code',
    route: '/tools/json-formatter',
    category: 'dev',
    color: 'amber',
    seo: {
      title: 'JSON Formatter & Validator - Secure Developer Tool',
      description: 'Format, beautify, and validate your JSON data locally. Privacy-focused developer utility with syntax highlighting.',
      keywords: ['json formatter', 'beautify json', 'json validator', 'format json online', 'json tools']
    },
    faqs: [
      {
        question: 'Is my data secure?',
        answer: 'Yes. The formatting happens entirely within your browser. No JSON data is ever sent to our servers.'
      }
    ]
  },
  {
    id: 'pdf-to-image',
    name: 'PDF to Image',
    description: 'Extract pages from your PDF documents and convert them to high-quality images privately.',
    icon: 'fas fa-file-pdf',
    route: '/tools/pdf-to-image',
    category: 'docs',
    color: 'rose',
    seo: {
      title: 'PDF to Image Converter - Extract Pages Privately',
      description: 'Convert PDF pages to high-quality JPG or PNG images. Fast, secure, and processed entirely in your browser. 100% private document processing.',
      keywords: ['pdf to image', 'pdf to jpg', 'pdf to png', 'extract pdf pages', 'pdf converter', 'convert pdf to image online'],
      image: 'assets/preview.png'
    },
    faqs: [
      {
        question: 'Can I convert multi-page PDFs?',
        answer: 'Yes, the tool will process all pages and allow you to download them individually or as a ZIP archive.'
      },
      {
        question: 'Is it safe to upload my PDF?',
        answer: 'You don\'t have to! iNNkie processes your PDF entirely in your browser. Your document never leaves your computer, ensuring total privacy for sensitive files.'
      },
      {
        question: 'What image formats are supported?',
        answer: 'You can export your PDF pages as high-quality PNG or JPEG images.'
      }
    ],
    sections: [
      {
        title: 'Professional PDF Extraction',
        description: 'Get high-fidelity images from your documents without expensive software.',
        items: [
          {
            title: 'High Resolution',
            description: 'Scale your output up to 4x for crystal clear text and diagrams that look great on any screen.',
            icon: 'fas fa-search-plus'
          },
          {
            title: 'Bulk Export',
            description: 'Convert every page of a long document at once and download them all in a single organized ZIP file.',
            icon: 'fas fa-file-archive'
          },
          {
            title: 'Privacy First',
            description: 'Processed entirely on your local machine. Perfect for legal, financial, and personal documents.',
            icon: 'fas fa-shield-alt'
          }
        ]
      }
    ]
  },
  {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    description: 'Combine multiple images into a single professional PDF document instantly.',
    icon: 'fas fa-images',
    route: '/tools/image-to-pdf',
    category: 'docs',
    color: 'rose',
    seo: {
      title: 'Image to PDF Converter - Merge Images Securely',
      description: 'Combine JPG, PNG, or WebP images into a single PDF document. Professional layout and high-quality output.',
      keywords: ['image to pdf', 'jpg to pdf', 'png to pdf', 'merge images to pdf', 'pdf creator']
    },
    faqs: [
      {
        question: 'Can I reorder the images?',
        answer: 'Yes, you can drag and drop images to arrange them in the exact order you want them to appear in the PDF.'
      }
    ]
  },
  {
    id: 'qr-generator',
    name: 'QR Code Generator',
    description: 'Make QR codes for links, text, Wi-Fi, email and phone numbers. Choose size and colours, then download PNG or SVG.',
    icon: 'fas fa-qrcode',
    route: '/tools/qr-generator',
    category: 'link',
    color: 'emerald',
    seo: {
      title: 'Fast QR Code Generator - Free & Secure',
      description: 'Free QR code generator for links, text, Wi-Fi, email and phone numbers. Pick the size and colours and download PNG or SVG. Runs in your browser, no sign-up.',
      keywords: ['qr code', 'generate qr code', 'free qr code', 'quick qr code']
    },
    faqs: [
      {
        question: 'Is registration required?',
        answer: 'No, you can generate as many QR codes as you want without creating an account.'
      },
      {
        question: 'Are these QR codes permanent?',
        answer: 'Static QR codes generated here do not expire. If the destination URL changes, the QR code will need to be regenerated.'
      },
      {
        question: 'Is there a scan limit?',
        answer: 'No. QR codes generated with this tool can be scanned an unlimited number of times.'
      },
      {
        question: 'What can I put in a QR code?',
        answer: 'You can encode URLs, plain text, email addresses, Wi-Fi details, or other short text. Shorter content generally scans faster.'
      },
      {
        question: 'Are my QR codes private?',
        answer: 'Yes. QR generation happens locally in your browser, and iNNkie does not need to upload the text you enter.'
      }
    ]
  },
  {
    id: 'image-resizer',
    name: 'Image Resizer & Cropper',
    description: 'Scale, crop, and set specific dimensions for your images instantly in your browser.',
    icon: 'fas fa-expand',
    route: '/tools/image-resizer',
    category: 'media',
    color: 'blue',
    seo: {
      title: 'Online Image Resizer - Crop & Scale Privately',
      description: 'Resize and crop your images to exact pixel dimensions. High-quality output for social media and web.',
      keywords: ['resize image', 'crop image', 'image scaler', 'photo resizer']
    },
    faqs: [
      {
        question: 'Can I resize for social media?',
        answer: 'Yes, we provide presets for common social media platforms like LinkedIn, Instagram, and Twitter.'
      }
    ],
    aliases: [
      {
        path: '/tools/resize-linkedin-banner',
        name: 'LinkedIn Banner Resizer',
        h1: 'LinkedIn Banner Resizer',
        intro: 'Resize and crop images to LinkedIn banner dimensions so profile and company page headers fit cleanly without awkward cropping.',
        title: 'LinkedIn Banner Resizer - Perfect Fit Every Time',
        description: 'Resize your images to the perfect LinkedIn banner dimensions (1584 x 396). 100% free and private.',
        faqs: [
          {
            question: 'What size should a LinkedIn banner be?',
            answer: 'A common LinkedIn profile banner size is 1584 x 396 pixels. This tool helps you resize images to that wide header format.'
          },
          {
            question: 'Will LinkedIn crop my banner?',
            answer: 'LinkedIn can crop previews differently across devices. Starting from the recommended banner dimensions reduces the risk of important content being cut off.'
          },
          {
            question: 'Can I preserve image quality?',
            answer: 'Yes. For best results, start with a large source image and resize down to the LinkedIn banner dimensions.'
          },
          {
            question: 'Are uploaded banners private?',
            answer: 'Yes. Resizing runs locally in your browser, so your banner image is not uploaded to iNNkie servers.'
          }
        ],
        sections: [
          {
            title: 'Design LinkedIn headers that fit',
            description: 'Prepare professional LinkedIn visuals before uploading them to your profile or company page.',
            items: [
              {
                title: 'Profile banners',
                description: 'Resize personal branding images to the wide LinkedIn header format without guessing dimensions.',
                icon: 'fab fa-linkedin'
              },
              {
                title: 'Company pages',
                description: 'Create consistent company cover graphics for hiring, launches, events, and announcements.',
                icon: 'fas fa-building'
              },
              {
                title: 'No upload required',
                description: 'Crop and resize locally so drafts, brand assets, and unreleased campaign visuals stay private.',
                icon: 'fas fa-lock'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'svg-to-png',
    name: 'SVG to PNG Converter',
    description: 'Convert vector SVG files or raw SVG code to high-resolution PNG images instantly. 100% private and secure.',
    icon: 'fas fa-image',
    route: '/tools/svg-to-png',
    category: 'media',
    color: 'indigo',
    seo: {
      title: 'SVG to PNG Converter - High Resolution & Secure',
      description: 'Convert SVG files or raw code to crisp, high-DPI PNG images. Perfect for logos, icons, and web graphics. 100% browser-side processing.',
      keywords: ['svg to png', 'convert svg', 'vector to png', 'high res svg conversion', 'online svg converter', 'svg to png high quality'],
      image: 'assets/preview.png'
    },
    faqs: [
      {
        question: 'Can I paste raw SVG code?',
        answer: 'Yes! iNNkie supports both file uploads and direct code pasting for maximum flexibility.'
      },
      {
        question: 'Will the PNG be blurry?',
        answer: 'No. Since SVG is a vector format, you can specify a scale (e.g., 2x, 4x, 8x) to get a perfectly crisp high-resolution PNG at any size.'
      },
      {
        question: 'Is it safe to convert sensitive graphics?',
        answer: 'Absolutely. All processing happens locally in your browser. Your images and code never leave your computer.'
      }
    ]
  },
  {
    id: 'utm-builder',
    name: 'UTM Link Builder',
    description: 'Generate tracking URLs with Google Analytics UTM parameters for your marketing campaigns.',
    icon: 'fas fa-link',
    route: '/tools/utm-builder',
    category: 'link',
    color: 'primary',
    seo: {
      title: 'Google Analytics UTM Builder - Campaign Tracking',
      description: 'Easily build tracking URLs with UTM parameters. Standardized campaign tracking for Google Analytics.',
      keywords: ['utm builder', 'campaign tracking', 'google analytics utm', 'link builder']
    },
    faqs: [
      {
        question: 'What are UTM parameters?',
        answer: 'UTM parameters are tags added to a URL that help you track the effectiveness of your marketing campaigns in Google Analytics.'
      }
    ]
  },
  {
    id: 'jwt-decoder',
    name: 'JWT Decoder',
    description: 'Decode and inspect JSON Web Tokens locally. No data ever leaves your browser.',
    icon: 'fas fa-shield-alt',
    route: '/tools/jwt-decoder',
    category: 'dev',
    color: 'indigo',
    seo: {
      title: 'JWT Decoder - Secure & Private Token Inspection',
      description: 'Inspect and decode JSON Web Tokens locally. 100% private, no tokens are ever sent to a server.',
      keywords: ['jwt decoder', 'decode jwt', 'inspect jwt', 'json web token']
    },
    faqs: [
      {
        question: 'Is it safe to paste my JWT here?',
        answer: 'Yes. The decoding happens entirely within your browser using JavaScript. We never see or store your tokens.'
      }
    ]
  },
  {
    id: 'csv-json-converter',
    name: 'CSV <> JSON Converter',
    description: 'Transform spreadsheets into code instantly. Support for bidirectional conversion and auto-detection.',
    icon: 'fas fa-table',
    route: '/tools/csv-json-converter',
    category: 'dev',
    color: 'primary',
    seo: {
      title: 'CSV to JSON Converter - Bidirectional Data Tool',
      description: 'Convert CSV to JSON and JSON to CSV instantly. Fast, secure, and processes everything in your browser.',
      keywords: ['csv to json', 'json to csv', 'data converter', 'convert spreadsheet']
    },
    faqs: [
      {
        question: 'Does it handle large files?',
        answer: 'Yes, it can handle large CSV files efficiently using browser-side streaming.'
      }
    ]
  },
  {
    id: 'base64-encoder',
    name: 'Base64 Encoder & Decoder',
    description: 'Securely encode and decode strings into Base64 format locally in your browser.',
    icon: 'fas fa-code-branch',
    route: '/tools/base64-encoder',
    category: 'dev',
    color: 'primary',
    seo: {
      title: 'Base64 Encoder & Decoder - Secure Developer Tool',
      description: 'Encode and decode Base64 strings instantly. 100% private and secure browser-side processing.',
      keywords: ['base64 encoder', 'base64 decoder', 'encode base64', 'decode base64']
    },
    faqs: [
      {
        question: 'What is Base64 used for?',
        answer: 'Base64 encoding is commonly used to embed binary data (like images) into text documents (like HTML or CSS).'
      }
    ]
  },

  {
    id: 'url-encoder',
    name: 'URL Encoder & Decoder',
    description: 'Percent-encode and decode URLs and query strings, and break a URL into its parts.',
    icon: 'fas fa-percent',
    route: '/tools/url-encoder',
    category: 'dev',
    color: 'blue',
    seo: {
      title: 'URL Encoder & Decoder - Percent-Encode Online',
      description: 'Percent-encode and decode text and URLs online. Decodes broken input, spots double encoding and shows the parts of a URL with decoded parameters. Runs in your browser.',
      keywords: ['url encoder', 'url decoder', 'percent encoding', 'encodeURIComponent online', 'urlencode'],
    },
    sections: [
      {
        title: 'Why use iNNkie\'s URL encoder?',
        description: 'Query strings, redirects and API calls break when special characters are not escaped. Encode them correctly in one step.',
        items: [
          { title: 'Component or full URL', description: 'Escape a single query value, or encode a whole address while keeping its : / ? # & = structure intact.', icon: 'fas fa-sliders' },
          { title: 'Full UTF-8 support', description: 'Accents, emoji and non-Latin scripts are converted to their UTF-8 percent-encoded bytes, such as é to %C3%A9.', icon: 'fas fa-globe' },
          { title: 'Private by design', description: 'Everything runs in your browser. The URLs and tokens you paste are never uploaded.', icon: 'fas fa-shield-alt' },
        ],
      },
    ],
    faqs: [
      { question: 'What is the difference between Component and Full URL?', answer: 'Component mode uses encodeURIComponent and escapes reserved characters such as / ? & = #, which is what you want for one query value. Full URL mode uses encodeURI and leaves those characters alone so a complete address stays valid.' },
      { question: 'Should a space be %20 or +?', answer: 'In a URL path or a modern query string, %20 is always correct. A plus sign means a space only in application/x-www-form-urlencoded data (HTML form submissions). This tool produces %20 and does not turn + into a space when decoding.' },
      { question: 'Why do I see %25 in my URL?', answer: 'The percent sign itself is encoded as %25. If you see %2520, the value was encoded twice: the first pass produced %20 and the second turned its % into %25. Decode once and encode once.' },
      { question: 'Why does decoding fail with a malformed error?', answer: 'A percent sign must be followed by two hexadecimal digits, and multi-byte characters need a complete, valid UTF-8 sequence. A stray % or a truncated sequence cannot be decoded.' },
    ],
  },
  {
    id: 'uuid-generator',
    name: 'UUID Generator',
    description: 'Generate random (v4) or time-ordered (v7) UUIDs in bulk, with copy and format options.',
    icon: 'fas fa-fingerprint',
    route: '/tools/uuid-generator',
    category: 'dev',
    color: 'indigo',
    seo: {
      title: 'UUID Generator - Random v4 UUIDs Online',
      description: 'Generate v4 random and v7 time-ordered UUIDs online, up to 1,000 at a time, as lines, commas or a JSON array. Check what version a UUID is. Runs in your browser.',
      keywords: ['uuid generator', 'guid generator', 'uuid v4', 'random uuid', 'generate uuid online'],
    },
    sections: [
      {
        title: 'Generate UUIDs the safe way',
        description: 'Identifiers for databases, tests and APIs, created with your browser\'s cryptographic random number generator.',
        items: [
          { title: 'Bulk generation', description: 'Create up to 100 UUIDs at once and copy them all as a list, or copy a single one.', icon: 'fas fa-layer-group' },
          { title: 'Flexible formats', description: 'Switch between lowercase and uppercase, with or without hyphens, and with optional braces for GUID style.', icon: 'fas fa-text-height' },
          { title: 'Nothing is stored', description: 'UUIDs are generated locally and are never sent to a server or saved.', icon: 'fas fa-shield-alt' },
        ],
      },
    ],
    faqs: [
      { question: 'What is a version 4 UUID?', answer: 'A version 4 UUID is a 128-bit identifier made almost entirely of random bits. Six bits are fixed to mark the version and variant, leaving 122 random bits. It is written as 32 hexadecimal digits in the 8-4-4-4-12 pattern.' },
      { question: 'Can two UUIDs collide?', answer: 'In theory yes, in practice no. With 122 random bits you would need to generate billions of UUIDs per second for many years before a collision becomes likely, so they are safe to use as unique identifiers without coordination.' },
      { question: 'Is a UUID the same as a GUID?', answer: 'Effectively yes. GUID is Microsoft\'s name for the same 128-bit format, and it is often written in uppercase and in braces. Use the Uppercase and Braces options for that style.' },
      { question: 'Are these UUIDs safe to use as secrets?', answer: 'They are unpredictable, but a UUID is meant to be an identifier, not a password or API key. Use a dedicated secret generator with enough length for authentication tokens.' },
    ],
  },
  {
    id: 'word-counter',
    name: 'Word & Character Counter',
    description: 'Count words, characters, sentences and reading time as you type, privately in your browser.',
    icon: 'fas fa-align-left',
    route: '/tools/word-counter',
    category: 'docs',
    color: 'emerald',
    seo: {
      title: 'Word Counter - Count Words, Characters & Reading Time',
      description: 'Free word and character counter with sentences, paragraphs, reading time and keyword frequency. Updates live and never uploads your text.',
      keywords: ['word counter', 'character counter', 'reading time calculator', 'count words online', 'sentence counter'],
    },
    sections: [
      {
        title: 'More than a word count',
        description: 'Check length limits, estimate reading time and spot overused words while you write.',
        items: [
          { title: 'Live statistics', description: 'Words, characters with and without spaces, sentences, paragraphs and lines update on every keystroke.', icon: 'fas fa-gauge-high' },
          { title: 'Reading and speaking time', description: 'Estimates assume about 200 words per minute reading and 130 words per minute speaking.', icon: 'fas fa-clock' },
          { title: 'Keyword frequency', description: 'See your most used words, ignoring common filler words, to catch repetition.', icon: 'fas fa-ranking-star' },
        ],
      },
    ],
    faqs: [
      { question: 'How are words counted?', answer: 'Words are runs of characters separated by whitespace, so "well-known" counts as one word and numbers count as words. This matches how most word processors count.' },
      { question: 'Do characters include spaces?', answer: 'Both are shown. Characters counts every character including spaces and line breaks, and No spaces excludes all whitespace. Emoji and accented letters count as one character each.' },
      { question: 'How is reading time calculated?', answer: 'Reading time divides your word count by 200 words per minute, a common average for adult silent reading. Speaking time uses 130 words per minute, a typical pace for presentations.' },
      { question: 'Is my text uploaded anywhere?', answer: 'No. Counting happens entirely in your browser, so drafts, emails and confidential documents stay on your device.' },
    ],
  },
  {
    id: 'timestamp-converter',
    name: 'Unix Timestamp Converter',
    description: 'Convert Unix timestamps in seconds to nanoseconds to readable dates and back, in any time zone.',
    icon: 'fas fa-clock-rotate-left',
    route: '/tools/timestamp-converter',
    category: 'dev',
    color: 'amber',
    seo: {
      title: 'Unix Timestamp Converter - Epoch to Date & Back',
      description: 'Convert Unix timestamps (seconds, milliseconds, microseconds, nanoseconds) to dates and dates to timestamps. Show UTC, local and any time zone. Runs in your browser.',
      keywords: ['unix timestamp converter', 'epoch converter', 'timestamp to date', 'date to timestamp', 'epoch time'],
    },
    sections: [
      {
        title: 'Epoch time without the guesswork',
        description: 'Debug logs, JWT expiry claims and database fields faster by seeing exactly what a timestamp means.',
        items: [
          { title: 'Seconds or milliseconds', description: 'Paste either form. Values with 12 or more digits are treated as milliseconds, otherwise as seconds.', icon: 'fas fa-hashtag' },
          { title: 'Every format at once', description: 'See UTC, ISO 8601, your local timezone and a relative description such as "3 hours ago", each with a copy button.', icon: 'fas fa-list' },
          { title: 'Live current time', description: 'A running Unix clock is always on screen, with one-click "use now" for both directions.', icon: 'fas fa-bolt' },
        ],
      },
    ],
    faqs: [
      { question: 'What is a Unix timestamp?', answer: 'It is the number of seconds that have elapsed since 00:00:00 UTC on 1 January 1970, known as the Unix epoch, not counting leap seconds. It is the same number everywhere in the world, regardless of timezone.' },
      { question: 'How do I tell seconds from milliseconds?', answer: 'Current timestamps in seconds have 10 digits (about 1.7 billion) and in milliseconds have 13 digits. JavaScript\'s Date.now() returns milliseconds, while most databases and the JWT exp claim use seconds.' },
      { question: 'What is the Year 2038 problem?', answer: 'A signed 32-bit integer can store at most 2,147,483,647 seconds, which is 03:14:07 UTC on 19 January 2038. Systems still using 32-bit time overflow after that moment. Modern 64-bit systems are unaffected.' },
      { question: 'Why does my local time differ from UTC?', answer: 'The timestamp is the same instant everywhere. UTC is the reference time, and your local time adds your timezone offset (and daylight saving if applicable). Store and exchange UTC, and convert to local only for display.' },
    ],
  },
];
