import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize, take } from 'rxjs/operators';

import { AuthService } from '../../core/authentication/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  private fb          = inject(FormBuilder);
  private router      = inject(Router);
  private route       = inject(ActivatedRoute);
  private authService = inject(AuthService);

  loginForm: FormGroup = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    remember: [true],                       // 🔹 “remember me”
  });

  isLoading   = false;
  errorMessage = '';
  returnUrl    = '/';

  // ─────────────────────── life-cycle ───────────────────────
  ngOnInit(): void {
    this.returnUrl =
      this.route.snapshot.queryParams['returnUrl'] || '/';

    /* Already logged in? Skip the page */
    this.authService.user$
      .pipe(take(1))
      .subscribe((u) => u && this.router.navigateByUrl(this.returnUrl));
  }

  // ─────────────────────── submit ───────────────────────
  onSubmit() {
    if (this.loginForm.invalid || this.isLoading) return;

    this.isLoading   = true;
    this.errorMessage = '';

    const { email, password, remember } = this.loginForm.value;

    this.authService
      .login(email, password, remember)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => this.router.navigateByUrl(this.returnUrl),
        error: (err) => {
          console.error('Login error:', err);
          this.errorMessage = this.friendlyError(err);
        },
      });
  }

  /** Map Firebase error codes → human messages */
  private friendlyError(err: any): string {
    const code = err?.code || err?.error?.error?.message || '';
    switch (code) {
      case 'auth/user-not-found':
      case 'EMAIL_NOT_FOUND':
        return 'No account found for this e-mail.';
      case 'auth/wrong-password':
      case 'INVALID_PASSWORD':
        return 'Incorrect password.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts – try again later.';
      case 'auth/network-request-failed':
        return 'Network error – check your connection.';
      default:
        return 'Login failed. Please try again.';
    }
  }
}
