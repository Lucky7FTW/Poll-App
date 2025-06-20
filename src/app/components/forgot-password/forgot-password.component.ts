// features/auth/forgot-password/forgot-password.component.ts
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../core/authentication/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private fb          = inject(FormBuilder);
  private authService = inject(AuthService);
  private router      = inject(Router);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  isLoading     = false;
  errorMessage  = '';
  successNotice = '';

  // ─────────────────────── submit ───────────────────────
  onSubmit() {
    if (this.form.invalid || this.isLoading) return;

    const { email } = this.form.value;
    this.isLoading     = true;
    this.errorMessage  = '';
    this.successNotice = '';

    this.authService
      .resetPassword(email)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.successNotice =
            'We’ve e-mailed you a link to reset your password. ' +
            'Check your inbox (and spam folder).';
          // Optionally navigate back after a delay:
          // setTimeout(() => this.router.navigate(['/']), 5000);
        },
        error: (err) => {
          console.error('Reset-password error:', err);
          this.errorMessage = this.friendlyError(err);
        },
      });
  }

  /** Firebase → human-readable */
  private friendlyError(err: any): string {
    const code = err?.code || err?.error?.error?.message || '';
    switch (code) {
      case 'auth/user-not-found':
      case 'EMAIL_NOT_FOUND':
        return 'No account found for this e-mail.';
      case 'auth/invalid-email':
      case 'INVALID_EMAIL':
        return 'Invalid e-mail address.';
      case 'auth/network-request-failed':
        return 'Network error – check your connection.';
      default:
        return 'Request failed. Please try again.';
    }
  }
}
