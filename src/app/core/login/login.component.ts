import { Component, OnInit, inject } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Firestore, doc, setDoc, updateDoc, serverTimestamp, getDoc } from '@angular/fire/firestore';



import { Auth, GoogleAuthProvider, UserCredential, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    NgOptimizedImage
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private auth: Auth = inject(Auth);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private firestore: Firestore = inject(Firestore);


  loginForm!: FormGroup;
  isRegistering = false;
  isLoading = false;
  hidePassword = true;

  ngOnInit(): void {

    window.scrollTo(0, 0);

    this.initForm();
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


onSubmit(): void {
  if (this.loginForm.valid) {
  this.isLoading = true;
  const { email, password } = this.loginForm.value;

  const authAction = this.isRegistering
    ? createUserWithEmailAndPassword(this.auth, email, password)
    : signInWithEmailAndPassword(this.auth, email, password);

  authAction
    .then(async (userCredential: UserCredential) => {
      const user = userCredential.user;
      const userRef = doc(this.firestore, `users/${user.uid}`);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create new user doc if it doesn't exist
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          providerId: user.providerData[0]?.providerId || 'password',
          emailVerified: user.emailVerified,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          role: 'user',
          totalUrls: 0
        });
      } else {
        // Update lastLogin for existing user
        await updateDoc(userRef, {
          lastLogin: serverTimestamp()
        });
      }

      const message = this.isRegistering
        ? 'Account successfully created!'
        : 'Successfully logged in!';
      this.snackBar.open(message, 'Close', { duration: 3000 });
      this.router.navigate(['/dashboard']);
    })
    .catch((error) => {
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

      this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
    })
    .finally(() => {
      this.isLoading = false;
    });
} else {
  Object.keys(this.loginForm.controls).forEach(key => {
    this.loginForm.get(key)?.markAsTouched();
  });
}
}



forgotPassword(): void {
    const email = this.loginForm.get('email')?.value;

    if (!email || !this.loginForm.get('email')?.valid) {
      this.snackBar.open('Please enter a valid email address first.', 'Close', {
        duration: 5000
      });
      this.loginForm.get('email')?.markAsTouched();
      return;
    }

    this.isLoading = true;
    sendPasswordResetEmail(this.auth, email)
      .then(() => {
        this.snackBar.open('Password reset email sent! Check your inbox.', 'Close', {
          duration: 5000
        });
      })
      .catch((error) => {
        let message = 'Failed to send reset email. Please try again.';
        if (error.code === 'auth/user-not-found') {
          message = 'No account found with this email.';
        }
        this.snackBar.open(message, 'Close', { duration: 5000 });
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  signInWithGoogle(): void {
    this.isLoading = true;
    const provider = new GoogleAuthProvider();

    signInWithPopup(this.auth, provider)
      .then(() => {
        this.snackBar.open('Successfully logged in with Google!', 'Close', {
          duration: 3000
        });
        this.router.navigate(['/dashboard']);
      })
      .catch((error) => {
        this.snackBar.open('Google sign-in failed. Please try again.', 'Close', {
          duration: 5000
        });
        console.error('Google sign-in error:', error);
      })
      .finally(() => {
        this.isLoading = false;
      });
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
