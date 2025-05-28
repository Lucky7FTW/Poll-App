import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/authentication/auth.service';
import { TextService } from '../../services/text.service';
import { Observable, firstValueFrom } from 'rxjs';

interface SignupTexts {
  title: string;
  subtitle: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: string;
  hidePassword: string;
  terms: string;
  termsLink: string;
  privacy: string;
  privacyLink: string;
  createAccount: string;
  or: string;
  continueWithGoogle: string;
  continueWithGitHub: string;
  alreadyHaveAccount: string;
  signIn: string;
  loading: string;
  passwordMismatch: string;
  signupFailed: string;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  // Use Angular inject() for standalone components
  private authService = inject(AuthService);
  private router = inject(Router);
  private textService = inject(TextService);

  signupData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';
  isLoading = false;

  // Safe to use as property!
  readonly t$: Observable<SignupTexts> = this.textService.section<SignupTexts>('signup');

  async onSubmit() {
    const t = await firstValueFrom(this.t$);

    this.errorMessage = '';

    if (this.signupData.password !== this.signupData.confirmPassword) {
      this.errorMessage = t.passwordMismatch;
      return;
    }

    this.isLoading = true;

    this.authService
      .signup(this.signupData.email, this.signupData.password)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage =
            err.error?.error?.message || t.signupFailed;
        },
      });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
