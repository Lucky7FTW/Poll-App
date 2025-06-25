import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../core/authentication/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  /* ─────────── DI ─────────── */
  private fb          = inject(FormBuilder);
  private router      = inject(Router);
  private authService = inject(AuthService);

  /* ─────────── form ─────────── */
  signupForm: FormGroup = this.fb.group(
    {
      firstName: ['', Validators.required],
      lastName:  ['', Validators.required],
      email:     ['', [Validators.required, Validators.email]],
      password:  ['', [Validators.required, Validators.minLength(6)]],
      confirm:   ['', Validators.required],
    },
    { validators: this.passwordsMatch }
  );

  /* ─────────── ui state ─────────── */
  showPassword         = false;
  showConfirmPassword  = false;
  errorMessage         = '';
  isLoading            = false;

  /* ===== password matcher ===== */
  private passwordsMatch(g: FormGroup) {
    const pass = g.get('password')!.value;
    const conf = g.get('confirm')!.value;
    return pass === conf ? null : { mismatch: true };
  }

  /* ─────────── submit ─────────── */
  onSubmit() {
    if (this.signupForm.invalid || this.isLoading) return;

    this.errorMessage = '';
    this.isLoading    = true;

    const { email, password } = this.signupForm.value;

    this.authService
      .register(email, password)   // sends verification e-mail
      .subscribe({
        next: () => {
          this.isLoading = false;
          // You could display a toast like “Check your inbox to verify your e-mail”
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Signup error:', err);
          this.isLoading = false;
          this.errorMessage = this.friendlyError(err);
        },
      });
  }

  /* friendlier error messages */
  private friendlyError(err: any): string {
    const code = err?.code || err?.error?.error?.message || '';
    switch (code) {
      case 'auth/email-already-in-use':
      case 'EMAIL_EXISTS':
        return 'This e-mail is already registered.';
      case 'auth/weak-password':
        return 'Password is too weak (min 6 characters).';
      default:
        return 'Signup failed. Please try again.';
    }
  }

  /* ─────────── helpers for template ─────────── */
  togglePassword()        { this.showPassword        = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }
}
