import { Component, inject } from '@angular/core';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/authentication/auth.service';
import { TextService } from '../../services/text.service'; // Adjust path as needed
import { Observable } from 'rxjs';

interface LoginTexts {
  title: string;
  emailLabel: string;
  emailPh: string;
  emailError: string;
  passwordLabel: string;
  passwordPh: string;
  passwordError: string;
  submitIdle: string;
  submitBusy: string;
  registerPrompt: string;
  registerLink: string;
  genericError: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private textService = inject(TextService);

  readonly t$: Observable<LoginTexts> = this.textService.section<LoginTexts>('login');

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  isLoading = false;
  errorMessage = '';

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Navigate after login if not handled by AuthService
      },
      error: (err) => {
        this.isLoading = false;
        this.t$.subscribe(t => {
          this.errorMessage =
            err.error?.error?.message || t.genericError;
        }).unsubscribe();
      },
    });
  }
}
