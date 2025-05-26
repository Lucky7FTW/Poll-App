import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/authentication/auth.service'; // Ajustează calea dacă e diferită

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  constructor(private authService: AuthService, private router: Router) {}

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

  onSubmit() {
    console.log('Submit triggered'); // Verificare 1
    console.log('Form data:', this.signupData); // Verificare 2

    this.errorMessage = '';

    if (this.signupData.password !== this.signupData.confirmPassword) {
      this.errorMessage = "Passwords don't match.";
      console.warn(this.errorMessage); // Verificare 3
      return;
    }

    this.isLoading = true;

    this.authService
      .signup(this.signupData.email, this.signupData.password)
      .subscribe({
        next: (res) => {
          console.log('Signup successful:', res); // Verificare 4
          this.isLoading = false;
          this.router.navigate(['/login']); // sau altă pagină
        },
        error: (err) => {
          console.error('Signup error:', err); // Verificare 5
          this.isLoading = false;
          this.errorMessage =
            err.error?.error?.message || 'Signup failed. Try again.';
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
