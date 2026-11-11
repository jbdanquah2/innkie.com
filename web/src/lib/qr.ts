/** QR as a PNG data URL (same options as the Angular generateQrCode()). qrcode is loaded on demand. */
export async function generateQrDataUrl(text: string, width = 300): Promise<string | null> {
  try {
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toDataURL(text, { errorCorrectionLevel: 'H', margin: 2, width });
  } catch (e) {
    console.error('Failed to generate QR code:', e);
    return null;
  }
}
