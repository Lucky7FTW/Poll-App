import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

//import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  // authService = inject(AuthService);

  loginForm: FormGroup = this.fb.group({
    email: ['demo@example.com', [Validators.required, Validators.email]],
    password: ['password123', [Validators.required]],
  });

  isLoading = false;
  errorMessage = '';

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    const dummyUser = {
      id: '1',
      username: 'DemoUser',
      email: email,
    };

    // Manually set the user in the service
    //this.authService.setCurrentUserForDemo(dummyUser);
    //this.router.navigate(['/']);

    this.isLoading = false;
  }
}
