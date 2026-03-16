import {Injectable} from '@angular/core';
import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  limit,
  orderBy,
  startAfter,
  increment,
  QueryDocumentSnapshot,
  DocumentData, deleteDoc, setDoc,
} from '@angular/fire/firestore';
import {ShortUrl, QrTemplate} from '../models/short-url.model';
import {environment} from '../../../environments/environment';
import {AppUser} from '../models/user.model';


@Injectable({
  providedIn: 'root'
})
export class ShortUrlService {
  private PAGE_SIZE: number = 5;
  private lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
  private currentPageIndex: number = 0;
  private allShortUrls: ShortUrl[] = []; // reactive update not needed here. so no need for RxJs (BehaviorSubject)


  constructor(private firestore: Firestore) {

  }

  updateShortUrlArray(shortUrl: ShortUrl) {

    // const alreadyExist = this.allShortUrls.find(shortUrl => shortUrl?.originalUrl === shortUrl.originalUrl);
    // if (!alreadyExist) {
      this.allShortUrls.push(shortUrl);
    // }
  }

  updateAllShortUrlsArray(shortUrls: ShortUrl[]) {

    this.allShortUrls = shortUrls;
  }

  get getAll(){
    return this.allShortUrls;
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

  async getShortUrlByAlias(customAlias: string) {
    const shortUrlRef = collection(this.firestore, 'shortUrls');
    const qry = query(
      shortUrlRef,
      where('customAlias', '==', customAlias),
      limit(1)
    );

    const querySnapshot = await getDocs(qry);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))[0];
  }

  async getUserShortUrls(userId: string): Promise<ShortUrl[]> {
    const shortUrlRef = collection(this.firestore, 'shortUrls');

    const qry = query(
      shortUrlRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(5000)
    );

    const querySnapshot = await getDocs(qry);

    // Store the last document for pagination
    this.lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShortUrl));
  }


  // async getFirstPage(userId: string) {
  //   const shortUrlRef = collection(this.firestore, 'shortUrls');
  //
  //   const q = query(
  //     shortUrlRef,
  //     where('userId', '==', userId),
  //     orderBy('createdAt', 'desc'),
  //     limit(this.PAGE_SIZE)
  //   );
  //
  //   const querySnapshot = await getDocs(q);
  //
  //   // Store the last document for pagination
  //   this.lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
  //
  //   return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // }

  async getFirstPage() {// just t
    this.currentPageIndex = 0;
    return this.allShortUrls.slice(0, this.PAGE_SIZE);
  }


  // async getNextPage(userId: string) {
  //   if (!this.lastDoc) return [];
  //
  //   const shortUrlRef = collection(this.firestore, 'shortUrls');
  //
  //   const q = query(
  //     shortUrlRef,
  //     where('userId', '==', userId),
  //     orderBy('createdAt', 'desc'),
  //     startAfter(this.lastDoc),
  //     limit(this.PAGE_SIZE)
  //   );
  //
  //   const querySnapshot = await getDocs(q);
  //
  //   this.lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
  //
  //   return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // }

  async getNextPage() {
    const start = (this.currentPageIndex + 1) * this.PAGE_SIZE;
    const end = start + this.PAGE_SIZE;

    if (start >= this.allShortUrls.length) {
      return []; // No more data
    }

    this.currentPageIndex++;
    return this.allShortUrls.slice(start, end);
  }


  async updateShortUrl(shortCode: string, updates: any) {
    const shortUrlRef = doc(this.firestore, `shortUrls/${shortCode}`);
    await updateDoc(shortUrlRef, updates);
  }

  async deleteShortUrl(id: string) {
    const ref = doc(this.firestore, `shortUrls/${id}`);
    delete this.allShortUrls[this.allShortUrls.findIndex(shortUrl => shortUrl?.id === id)];

    await deleteDoc(ref);
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

    console.log('data', data);

    // SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    console.log('hashBuffer', hashBuffer);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return { password: hashHex, passwordSalt: saltValue };
  }


  async getUniqueVisitors(shortCode: String) {
    const ref = collection(this.firestore, 'uniqueVisitors');
    const snap = await getDocs(
      query(ref,
        where('shortCode', '==', shortCode)))


    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }
    ));
  }

  async incrementUrlCount() {
    const statsRef = doc(this.firestore, 'stats/global');
    await setDoc(statsRef, { totalUrlsShortened: increment(1) }, { merge: true });
  }

  async getClicksAnalytics(shortCode: string, days: number = 7) {
    const url = `${environment.appUrl}/api/analytics/${shortCode}/clicks?days=${days}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return await response.json();
  }

  // --- Guest / LocalStorage Helpers ---
  private readonly GUEST_LINKS_KEY = 'innkie_guest_links';

  getGuestLinks(): ShortUrl[] {
    const stored = localStorage.getItem(this.GUEST_LINKS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  saveGuestLink(link: ShortUrl) {
    const links = this.getGuestLinks();
    // Keep only the last 10 links for guests
    const updated = [link, ...links].slice(0, 10);
    localStorage.setItem(this.GUEST_LINKS_KEY, JSON.stringify(updated));
  }

  removeGuestLink(shortCode: string) {
    const links = this.getGuestLinks();
    const updated = links.filter(l => l.shortCode !== shortCode);
    localStorage.setItem(this.GUEST_LINKS_KEY, JSON.stringify(updated));
  }

  // --- QR Template Helpers ---
  async saveQrTemplate(userId: string, template: QrTemplate) {
    const userRef = doc(this.firestore, `users/${userId}`);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data() as AppUser;
    const templates = userData.qrTemplates || [];
    templates.push(template);

    await updateDoc(userRef, { qrTemplates: templates });
  }

  async getQrTemplates(userId: string): Promise<QrTemplate[]> {
    const userRef = doc(this.firestore, `users/${userId}`);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return [];

    const userData = userSnap.data() as AppUser;
    return userData.qrTemplates || [];
  }
}
