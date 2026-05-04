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
import { SeoService } from '../shared/services/seo.service';
import { RegexTestPipe } from '../shared/pipes/regex-test.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LogoComponent,
    RegexTestPipe
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
  private seo = inject(SeoService);

  loginForm!: FormGroup;
  isRegistering = false;
  isPasswordLoading = false;
  isGoogleLoading = false;
  hidePassword = true;

  get isLoading(): boolean {
    return this.isPasswordLoading || this.isGoogleLoading;
  }

  constructor() {
    this.initForm(); // Initial init
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.isRegistering = params['signUp'] === 'true';
      this.initForm(); // Re-init based on params
      this.updateSeo();
    });
  }

  updateSeo() {
    const title = this.isRegistering ? 'Create Your Account' : 'Sign In';
    const description = this.isRegistering 
      ? 'Join iNNkie today to start managing your links with premium branding and analytics.' 
      : 'Sign in to your iNNkie dashboard to manage your short links and view analytics.';
    
    this.seo.updateSeo(title, description, '/login');
  }

  ngOnDestroy(): void {
    this.isRegistering = false;
  }

  private initForm(): void {
    const passwordValidators = [Validators.required, Validators.minLength(8)];
    
    // Only apply strong password validation for registration
    if (this.isRegistering) {
      passwordValidators.push(Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/));
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', passwordValidators]
    });
  }

  toggleRegistration(): void {
    this.isRegistering = !this.isRegistering;
    
    // Completely re-initialize the password control with new validators
    const passwordValidators = [Validators.required, Validators.minLength(8)];
    if (this.isRegistering) {
      passwordValidators.push(Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/));
    }
    
    this.loginForm.get('password')?.setValidators(passwordValidators);
    this.loginForm.get('password')?.updateValueAndValidity();
    
    this.updateSeo();
    
    // If user already typed something, don't clear it, but if they haven't touched it, reset might be cleaner.
    // For premium UX, we'll keep the email but maybe reset the password errors.
  }


  async onSubmitPassword(): Promise<void> {

    if (!this.loginForm.valid) {

        Object.keys(this.loginForm.controls).forEach(key => {
          this.loginForm.get(key)?.markAsTouched();
        });

        return;
    }

    this.isPasswordLoading = true;
    const { email, password } = this.loginForm.value;

    try {

      let userCredential = null;
      let message = '';

      if (this.isRegistering) {

        userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

        const token = await userCredential.user.getIdToken();

    
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
      this.isPasswordLoading = false;
    }
  }

  async forgotPassword(): Promise<void> {
    const email = this.loginForm.get('email')?.value;

    if (!email || !this.loginForm.get('email')?.valid) {
      this.toast.warn('Please enter a valid email address first.');
      this.loginForm.get('email')?.markAsTouched();
      return;
    }

    this.isPasswordLoading = true;

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
      this.isPasswordLoading = false;
    }
  }


  async signInWithGoogle(): Promise<void> {
    this.isGoogleLoading = true;

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
      this.isGoogleLoading = false;
    }
  }

  async addCustomClaims(userCredential: any): Promise<any> {
    const token = await userCredential.user.getIdToken();


    return await firstValueFrom( this.http.post(environment.applyCustomClaims, {
      idToken: token
    }) );
  }

  async addOrUpdateUser(userCredential: UserCredential, providerId: OauthProvider): Promise<void> {

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

      const userData = userDataSnap.data() as AppUser;


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
