import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/authentication/auth.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  isLoading = false;
  errorMessage = '';
  returnUrl = '/';

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    console.log(this.returnUrl)

    this.authService.user
      .pipe(take(1))
      .subscribe((user) => {
        if (user) {
          this.router.navigateByUrl(this.returnUrl);
        }
      });

  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (res) => {
        console.log('Login success:', res);
        this.isLoading = false;
        // Navigarea e deja făcută în serviciu (`this.router.navigate(['track'])`)
        console.log(this.returnUrl)
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.isLoading = false;
        this.errorMessage =
          err.error?.error?.message || 'Login failed. Try again.';
      },
    });
  }
}
