// auth.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { AppUser } from '@innkie/shared-models';
import { BehaviorSubject, Subscription, of, from, firstValueFrom, filter, map, catchError, switchMap, take } from 'rxjs';
import { Auth, signOut, User as FirebaseUser } from '@angular/fire/auth';
import {doc, Firestore, getDoc, updateDoc} from '@angular/fire/firestore';
import { authState } from 'rxfire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private _user$ = new BehaviorSubject<AppUser | null>(null);
  user$ = this._user$.asObservable();

  private _userReady$ = new BehaviorSubject<boolean>(false);
  userReady$ = this._userReady$.asObservable();

  private authSub: Subscription | null = null;

  constructor(private auth: Auth, private firestore: Firestore) {
    this.authSub = authState(this.auth)
      .pipe(
        switchMap((fbUser: FirebaseUser | null) => {
          if (!fbUser) {
            // signed out: publish null and mark ready
            this._user$.next(null);
            this._userReady$.next(true);
            return of(null);
          }

          // optimistic quick user while details load
          const quick: Partial<AppUser> = {
            uid: fbUser.uid,
            displayName: fbUser.displayName ?? '',
            email: fbUser.email ?? '',
            photoURL: fbUser.photoURL ?? '',
          };
          this._user$.next(quick as AppUser);

          return from(getDoc(doc(this.firestore, `users/${fbUser.uid}`)))
            .pipe(
              map(snapshot => {
                if (snapshot.exists()) {
                  return snapshot.data() as AppUser;
                }
                // fallback to quick if no document
                return quick as AppUser;
              }),
              catchError(err => {
                console.error('Error loading user details', err);
                return of(quick as AppUser);
              })
            );
        })
      )
      .subscribe((fullUser: AppUser | null) => {
        if (fullUser) {
          this._user$.next(fullUser);
        }
        this._userReady$.next(true);
      });
  }

  waitForInitialUser(): Promise<void> {
    return firstValueFrom(this.userReady$.pipe(
      filter(val => val),
      take(1),
      map(() => undefined)
    ));
  }

  get currentUser(): AppUser | null {
    return this._user$.value;
  }


  /**
   * Patch user both locally and in Firestore with rollback if update fails
   */
  async patchUser(updates: Partial<AppUser>): Promise<void> {
    const current = this._user$.value;
    if (!current?.uid) {
      return;
    }

    const oldUser = { ...current };
    const updated: AppUser = { ...current, ...updates };

    // Optimistic local update for instant UI feedback
    this._user$.next(updated);

    try {
      const userRef = doc(this.firestore, `users/${current.uid}`);
      await updateDoc(userRef, updates);
    } catch (error) {
      console.error('❌ Firestore update failed, rolling back user:', error);
      // Rollback to previous state
      this._user$.next(oldUser);
      throw error;
    }
  }


  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this._user$.next(null);
    } catch (err) {
      console.error('Error during logout', err);
      throw err;
    }
  }

  ngOnDestroy(): void {
    if (this.authSub) {
      this.authSub.unsubscribe();
      this.authSub = null;
    }
    this._user$.complete();
    this._userReady$.complete();
  }
}
