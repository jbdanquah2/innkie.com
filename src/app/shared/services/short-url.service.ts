import {Injectable} from '@angular/core';
import {collection, doc, Firestore, getDoc, getDocs, query, where, updateDoc, limit} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ShortUrlService {


  constructor(private firestore: Firestore) {

  }


  async getShortUrlByCode(shortCode: string) {
    const ref = doc(this.firestore, `shortUrls/${shortCode}`);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.warn(`Short URL not found for code: ${shortCode}`);
      return null;
    }

    return {
      id: snap.id,
      ...snap.data()
    };
  }


  async getUserShortUrls(userId: string) {

    const shortUrlRef = collection(this.firestore, 'shortUrls');
    const querySnapshot = await getDocs(
      query(shortUrlRef,
        where('userId', '==', userId)
      ));

    return querySnapshot
      .docs
      .map(doc => {
        return doc.data()
      });
  }

  async updateShortUrl(shortCode: string, updates: any) {
    const shortUrlRef = doc(this.firestore, `shortUrls/${shortCode}`);
    await updateDoc(shortUrlRef, updates);
  }

  async checkAliasExists(customAlias: string) {

    if (!customAlias) {
      return false
    }

    const aliasRef = collection(this.firestore, 'shortUrls');

    const snap = await getDocs(
      query(aliasRef,
        where('customAlias', '==', customAlias),
        limit(1)
      ));

    return !snap.empty;  // true if exists
  }


  async hashPassword(password: string, passwordSalt: string): Promise<{ password: string, passwordSalt: string }> {

    const saltValue = passwordSalt || crypto.getRandomValues(new Uint8Array(16)).join('-');

    const encoder = new TextEncoder();
    const data = encoder.encode(password + saltValue);

    // SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return { password: hashHex, passwordSalt: saltValue };
  }


}
