// saved on the collection urls/{shortCode}
export interface ShortUrl {
  id: string;             // document id in Firestore
  userId: string;         // reference to AppUser.uid
  originalUrl: string;
  shortCode: string;      // e.g., abc123
  createdAt: Date;
  clickCount: number;

  // Optional extras
  expiryDate?: Date;
  customAlias?: string;
  qrCodeUrl?: string;
}
