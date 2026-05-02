import {Injectable, inject, EnvironmentInjector, runInInjectionContext, PLATFORM_ID} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
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
import { ShortUrl, QrTemplate, isPersonalWorkspace } from '@innkie/shared-models';
import {environment} from '../../../environments/environment';
import {AppUser} from '@innkie/shared-models';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root'
})
export class ShortUrlService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private injector = inject(EnvironmentInjector);
  private platformId = inject(PLATFORM_ID);
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

  async getFirstPage(): Promise<ShortUrl[]> {
    this.currentPageIndex = 1;
    return this.allShortUrls.slice(0, this.PAGE_SIZE);
  }

  async getNextPage(): Promise<ShortUrl[]> {
    const start = this.currentPageIndex * this.PAGE_SIZE;
    const end = start + this.PAGE_SIZE;
    this.currentPageIndex++;
    if (start >= this.allShortUrls.length) {
      return [];
    }
    return this.allShortUrls.slice(start, end);
  }

  async getShortUrlByCode(shortCode: string) {
    return runInInjectionContext(this.injector, async () => {
      const ref = doc(this.firestore, `shortUrls/${shortCode}`);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        console.warn(`Short URL not found for code: ${shortCode}`);
        return null;
      }

      return {
        id: snap.id,
        ...snap.data()
      } as ShortUrl;
    });
  }

  async getShortUrlByAlias(customAlias: string) {
    return runInInjectionContext(this.injector, async () => {
      const shortUrlRef = collection(this.firestore, 'shortUrls');
      const qry = query(
        shortUrlRef,
        where('customAlias', '==', customAlias),
        limit(1)
      );

      const querySnapshot = await getDocs(qry);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShortUrl))[0];
    });
  }

  async getUserShortUrls(userId: string, workspaceId?: string): Promise<ShortUrl[]> {
    let url = `${environment.apiUrl}/v1/links/workspace/${workspaceId || 'personal'}`;
    
    try {
      const links = await firstValueFrom(this.http.get<ShortUrl[]>(url, {
        headers: { 'X-Skip-Loading': 'true' }
      }));
      this.allShortUrls = links;
      return links;
    } catch (error) {
      console.error('Failed to fetch workspace links via API, falling back to Firestore query', error);
      
      return runInInjectionContext(this.injector, async () => {
        const shortUrlRef = collection(this.firestore, 'shortUrls');
        let qry;

        if (isPersonalWorkspace(workspaceId)) {
          const personalIds = [`personal_${userId}`, 'personal', null];
          qry = query(
            shortUrlRef,
            where('userId', '==', userId),
            where('workspaceId', 'in', personalIds),
            orderBy('createdAt', 'desc'),
            limit(1000)
          );
        } else {
          qry = query(
            shortUrlRef,
            where('workspaceId', '==', workspaceId),
            orderBy('createdAt', 'desc'),
            limit(1000)
          );
        }
        
        const querySnapshot = await getDocs(qry);
        const links = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShortUrl));
        this.allShortUrls = links;
        return links;
      });
    }
  }

  async updateShortUrl(shortCode: string, updates: any) {
    const url = `${environment.apiUrl}/v1/links/${shortCode}`;
    await firstValueFrom(this.http.put(url, updates));
    
    // Optimistic local update
    const index = this.allShortUrls.findIndex(l => l.shortCode === shortCode);
    if (index !== -1) {
      this.allShortUrls[index] = { ...this.allShortUrls[index], ...updates };
    }
  }

  async deleteShortUrl(id: string) {
    const url = `${environment.apiUrl}/v1/links/${id}`;
    await firstValueFrom(this.http.delete(url));
    
    // Local cleanup
    this.allShortUrls = this.allShortUrls.filter(l => l.id !== id);
  }

  async checkAliasExists(customAlias: string) {
    if (!customAlias) {
      return false;
    }

    return runInInjectionContext(this.injector, async () => {
      const aliasRef = collection(this.firestore, 'shortUrls');

      const snap = await getDocs(
        query(aliasRef,
          where('customAlias', '==', customAlias),
          limit(1)
        ));

      return !snap.empty;  // true if exists
    });
  }

  async createShortUrl(originalUrl: string, workspaceId: string | null, customAlias: string = '', tags: string[] = []): Promise<any> {
    const userId = this.authService.currentUser?.uid || null;
    
    const result: any = await firstValueFrom(this.http.post(environment.shortenUrl, {
      originalUrl,
      userId,
      workspaceId,
      customAlias,
      tags
    }));

    if (result && !result.error) {
       this.updateShortUrlArray(result as ShortUrl);
       await this.incrementUrlCount();
    }
    
    return result;
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


  async getUniqueVisitors(shortCode: string) {
    const url = `${environment.apiUrl}/analytics/${shortCode}/visitors`;
    return firstValueFrom(this.http.get<any[]>(url, {
      headers: { 'X-Skip-Loading': 'true' }
    }));
  }

  async incrementUrlCount() {
    return runInInjectionContext(this.injector, async () => {
      const statsRef = doc(this.firestore, 'stats/global');
      await setDoc(statsRef, { totalUrlsShortened: increment(1) }, { merge: true });
    });
  }

  async getClicksAnalytics(shortCode: string, days: number = 7) {
    const url = `${environment.apiUrl}/analytics/${shortCode}/clicks?days=${days}`;
    return firstValueFrom(this.http.get<any>(url, {
      headers: { 'X-Skip-Loading': 'true' }
    }));
  }

  // --- Guest / LocalStorage Helpers ---
  private readonly GUEST_LINKS_KEY = 'innkie_guest_links';

  getGuestLinks(): ShortUrl[] {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(this.GUEST_LINKS_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  }

  saveGuestLink(link: ShortUrl) {
    if (isPlatformBrowser(this.platformId)) {
      const links = this.getGuestLinks();
      // Keep only the last 10 links for guests
      const updated = [link, ...links].slice(0, 10);
      localStorage.setItem(this.GUEST_LINKS_KEY, JSON.stringify(updated));
    }
  }

  removeGuestLink(shortCode: string) {
    if (isPlatformBrowser(this.platformId)) {
      const links = this.getGuestLinks();
      const updated = links.filter(l => l.shortCode !== shortCode);
      localStorage.setItem(this.GUEST_LINKS_KEY, JSON.stringify(updated));
    }
  }

  // --- QR Template Helpers ---
  async saveQrTemplate(userId: string, template: QrTemplate) {
    return runInInjectionContext(this.injector, async () => {
      const userRef = doc(this.firestore, `users/${userId}`);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const userData = userSnap.data() as AppUser;
      const templates = userData.qrTemplates || [];
      templates.push(template);

      await updateDoc(userRef, { qrTemplates: templates });
    });
  }

  async getQrTemplates(userId: string): Promise<QrTemplate[]> {
    return runInInjectionContext(this.injector, async () => {
      const userRef = doc(this.firestore, `users/${userId}`);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return [];

      const userData = userSnap.data() as AppUser;
      return userData.qrTemplates || [];
    });
  }
}
