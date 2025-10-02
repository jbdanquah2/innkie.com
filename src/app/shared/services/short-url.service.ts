import {Injectable} from '@angular/core';
import {collection, doc, Firestore, getDoc, getDocs, query, where, updateDoc} from '@angular/fire/firestore';

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

}
