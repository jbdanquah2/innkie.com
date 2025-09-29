import {Injectable} from '@angular/core';
import {collection, doc, Firestore, getDoc, getDocs, query, where} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ShortUrlService {


  constructor(private firestore: Firestore) {

  }


  async getShortUrlByCode(shortCode: string) {
    const shortUrlSnap = await getDoc(doc(this.firestore, `shortUrls/${shortCode}`));
    return shortUrlSnap.data();
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

}
