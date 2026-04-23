import {Component, OnInit, inject, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { Firestore, doc, setDoc, updateDoc, getDoc } from '@angular/fire/firestore';


import {
  Auth, GoogleAuthProvider, UserCredential, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup
} from '@angular/fire/auth';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../environments/environment';
import { AppUser, OauthProvider } from '@innkie/shared-models';
import { Timestamp } from '@angular/fire/firestore';
import { LogoComponent } from '../logo/logo.component';
import { ToastService } from '../shared/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LogoComponent,
  ],

  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  private auth: Auth = inject(Auth);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private firestore: Firestore = inject(Firestore);
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  loginForm!: FormGroup;
  isRegistering = false;
  isLoading = false;
  hidePassword = true;

  constructor() {
  }

  ngOnInit(): void {

    this.route.queryParams.subscribe((params) => {
      this.isRegistering = params['signUp'] === 'true';
    })

    this.initForm();
  }

  ngOnDestroy(): void {
    this.isRegistering = false;
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        // Only apply strong password validation for registration
        Validators.pattern(this.isRegistering ?
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/ :
          /.*/)
      ]]
    });
  }

  toggleRegistration(): void {
    this.isRegistering = !this.isRegistering;
    // Reset form errors and update password validation
    this.loginForm.get('password')?.updateValueAndValidity();
  }


  async onSubmitPassword(): Promise<void> {

    if (!this.loginForm.valid) {

        Object.keys(this.loginForm.controls).forEach(key => {
          this.loginForm.get(key)?.markAsTouched();
        });

        return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    try {

      let userCredential = null;
      let message = '';

      if (this.isRegistering) {

        userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

        const token = await userCredential.user.getIdToken();

        console.log("applying custom claims with token:", token);

        await this.addCustomClaims(userCredential);

        message = 'Account successfully created!';


      } else {

        userCredential= await signInWithEmailAndPassword(this.auth, email, password);

        message = 'Successfully logged in!';

      }

      if (!userCredential) {
        throw new Error('User credential is null');
      }

      await this.addOrUpdateUser(userCredential, 'password');

      this.toast.success(message);

      await this.router.navigate(['/dashboard']);

    } catch (error: any) {
      let errorMessage = 'Authentication failed. Please try again.';

      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      }

      this.toast.error(errorMessage);

      await this.auth.signOut();

    } finally {
      this.isLoading = false;
    }
  }

  async forgotPassword(): Promise<void> {
    const email = this.loginForm.get('email')?.value;

    if (!email || !this.loginForm.get('email')?.valid) {
      this.toast.warn('Please enter a valid email address first.');
      this.loginForm.get('email')?.markAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      await sendPasswordResetEmail(this.auth, email);

      this.toast.info('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      let message = 'Failed to send reset email. Please try again.';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email.';
      }
      this.toast.error(message);
    } finally {
      this.isLoading = false;
    }
  }


  async signInWithGoogle(): Promise<void> {
    this.isLoading = true;

    console.log("launching Google sign-in popup");

    const provider = new GoogleAuthProvider();

    try {

      const userCredential = await signInWithPopup(this.auth, provider);
      if (!userCredential) {
        throw new Error('Google sign-in failed');
      }

      // const isNewUser = getAdditionalUserInfo(userCredential)?.isNewUser;

      await this.addCustomClaims(userCredential);

      await this.addOrUpdateUser(userCredential, 'google.com');

      this.toast.success('Successfully logged in with Google!');

      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.toast.error('Google sign-in failed. Please try again.');
      console.error('Google sign-in error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async addCustomClaims(userCredential: any): Promise<any> {
    const token = await userCredential.user.getIdToken();

    console.log("applying custom claims with token:", token);

    return await firstValueFrom( this.http.post(environment.applyCustomClaims, {
      idToken: token
    }) );
  }

  async addOrUpdateUser(userCredential: UserCredential, providerId: OauthProvider): Promise<void> {

    console.log("###addOrUpdateUser", userCredential);

    const user = userCredential.user;
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const userDataSnap = await getDoc(userRef);

    if (!userDataSnap.exists()) {

      const appUser: Partial<AppUser> = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        providerIds: [providerId],
        emailVerified: user.emailVerified,
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
        role: 'admin',
        totalUrls: 0,
        maxUrls: 10000,
      }

      await setDoc(userRef, appUser);

      console.log("refreshing token for new user");
      await user.getIdToken(true);

    } else {

      console.log("###userData", providerId);
      const userData = userDataSnap.data() as AppUser;
      console.log("###userData", userData);


      const appUser: Partial<AppUser> = {
        displayName: userData?.displayName ? userData.displayName : user.displayName,
        photoURL: user.photoURL || '',
        providerIds: [providerId],
        emailVerified: user.emailVerified,
        lastLogin: Timestamp.now(),
      }

      await updateDoc(userRef, appUser);
    }
  }


  getPasswordErrorMessage(): string {
    const passwordControl = this.loginForm.get('password');

    if (!passwordControl?.errors) {
      return '';
    }

    if (passwordControl.hasError('required')) {
      return 'Password is required';
    }

    if (passwordControl.hasError('minlength')) {
      return 'Password must be at least 8 characters long';
    }

    if (passwordControl.hasError('pattern') && this.isRegistering) {
      return 'Password must contain uppercase, lowercase, number, and special character';
    }

    return 'Invalid password';
  }
}
