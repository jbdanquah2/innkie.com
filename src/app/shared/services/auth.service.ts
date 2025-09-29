import {Injectable} from '@angular/core';
import {AppUser} from '../models/user.model';
import {BehaviorSubject, of, switchMap} from 'rxjs';
import {Auth, User as FirebaseUser} from '@angular/fire/auth';
import {doc, Firestore, getDoc} from '@angular/fire/firestore';
import {authState} from 'rxfire/auth';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _user$ = new BehaviorSubject<AppUser | null>(null);
  user$ = this._user$.asObservable();

  constructor(private auth: Auth,
              private firestore: Firestore) {

    authState(auth)
      .pipe(
        switchMap((user: FirebaseUser | null) => {

          if (!user) return of(null);

          const quick: Partial<AppUser> = {
            uid: user.uid,
            displayName: user.displayName ?? '',
            email: user.email ?? '',
            photoURL: user.photoURL ?? '',
          };

          this._user$.next(quick as AppUser);

          setTimeout(async () => {
            const userDetails$ = (await this.getUserDetails(user.uid)).data() as AppUser;
            return this._user$.next(userDetails$)
          })

          return this._user$

        }
      )).subscribe()
  }

  async getUserDetails(uid: string) {
    return getDoc(doc(this.firestore, `users/${uid}`));
  }

}
