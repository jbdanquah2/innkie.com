import { ShortUrl } from '@innkie/shared-models';

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolAlias {
  path: string;
  name?: string;
  title?: string;
  description?: string;
  faqs?: ToolFaq[];
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
  };
  faqs: ToolFaq[];
  aliases?: ToolAlias[];
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
        answer: 'Never. Links shortened on iNNkie stay active permanently unless you manually delete them from your dashboard.'
      },
      {
        question: 'Is it free to use?',
        answer: 'Yes, the basic shortener is completely free. You can shorten links as a guest or create a free account to track analytics.'
      },
      {
        question: 'Can I create branded short links?',
        answer: 'Branded link management is supported for Pro workspaces. This allows you to use your own brand identity in your short links.'
      }
    ],
    aliases: [
      {
        path: '/tools/custom-short-links',
        title: 'Custom Branded Short Links | iNNkie',
        description: 'Create custom branded short links for your marketing campaigns. Increase CTR and build brand trust with iNNkie.'
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
        title: 'Compress Images for Shopify - Free Online Tool',
        description: 'Optimize your Shopify store speed by compressing images locally. Faster load times, better SEO, 100% private.'
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
      }
    ]
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
      description: 'Convert PDF pages to high-quality JPG or PNG images. Fast, secure, and processed entirely in your browser.',
      keywords: ['pdf to image', 'pdf to jpg', 'pdf to png', 'extract pdf pages', 'pdf converter']
    },
    faqs: [
      {
        question: 'Can I convert multi-page PDFs?',
        answer: 'Yes, the tool will process all pages and allow you to download them individually or as a ZIP archive.'
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
    description: 'Create high-resolution, customizable QR codes for any URL or text instantly.',
    icon: 'fas fa-qrcode',
    route: '/tools/qr-generator',
    category: 'link',
    color: 'emerald',
    seo: {
      title: 'Fast QR Code Generator - Free & Secure',
      description: 'Generate high-resolution QR codes instantly. No registration required. Private and secure browser-side generation.',
      keywords: ['qr code', 'generate qr code', 'free qr code', 'quick qr code']
    },
    faqs: [
      {
        question: 'Is registration required?',
        answer: 'No, you can generate as many QR codes as you want without creating an account.'
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
        title: 'LinkedIn Banner Resizer - Perfect Fit Every Time',
        description: 'Resize your images to the perfect LinkedIn banner dimensions (1584 x 396). 100% free and private.'
      }
    ]
  },
  {
    id: 'svg-to-png',
    name: 'SVG to PNG',
    description: 'Convert SVG vectors to high-quality PNG images with custom scaling. Fast and secure.',
    icon: 'fas fa-image',
    route: '/tools/svg-to-png',
    category: 'media',
    color: 'indigo',
    seo: {
      title: 'SVG to PNG Converter - High Resolution Export',
      description: 'Convert SVG files to high-quality PNG images. Custom scale support for crisp exports at any size.',
      keywords: ['svg to png', 'convert svg', 'vector to png', 'high res svg conversion']
    },
    faqs: [
      {
        question: 'Will the PNG be blurry?',
        answer: 'No. Since SVG is a vector format, you can specify a scale (e.g., 2x, 4x) to get a perfectly crisp high-resolution PNG.'
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
    name: 'Secure JWT Decoder',
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
  }
];
