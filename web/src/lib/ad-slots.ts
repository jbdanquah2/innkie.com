/**
 * AdSense ad units. Create each unit in AdSense (Ads > By ad unit), then paste its numeric "data-ad-slot" id next to its name.
 * A unit with an empty id renders nothing, so it is safe to fill these in one at a time.
 * Keep the number of ads modest: Google rejects pages where ads outweigh the content.
 */
export const AD_SLOTS: Record<string, string> = {
  base64_bottom: '4975872266',
  image_compressor_sidebar: '4975872266',
  image_resizer_middle: '',
  image_to_pdf_middle: '',
  jwt_decoder_top: '4975872266',
  pdf_to_image_middle: '',
  png_to_jpeg_sidebar: '',
  qr_generator_sidebar: '4975872266',
  svg_to_png_sidebar: '',
  tools_hub_bottom: '1791626524',
  utm_builder_sidebar: '',
};

/** The numeric id for a placement name, or the value itself when a real id is passed directly. */
export const resolveAdSlot = (nameOrId: string): string => AD_SLOTS[nameOrId] ?? nameOrId;
