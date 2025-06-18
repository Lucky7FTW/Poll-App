// src/app/pages/user-profile/profile-info-form.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';

import { AuthService } from '../../../core/authentication/auth.service';

@Component({
  selector: 'app-profile-info-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './profile-info-form.component.html',
  styleUrls: ['./profile-info-form.component.css'],
})
export class ProfileInfoFormComponent {
  private fb          = inject(FormBuilder);
  private authService = inject(AuthService);

  loading       = true;
  updateSuccess = false;
  updateError: string | null = null;

  profileForm: FormGroup = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(3)]],
    email:       [{ value: '', disabled: true }],
    bio:         ['', [Validators.maxLength(200)]],
  });

  constructor() {
    const user = this.authService.user;
    if (user) {
      this.profileForm.patchValue({
        displayName: user.displayName ?? '',
        email:       user.email       ?? '',
      });
    }
    this.loading = false;
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;
    this.loading = true;

    const data = {
      displayName: this.profileForm.get('displayName')?.value,
      bio:         this.profileForm.get('bio')?.value,
    };

    this.authService.updateUserProfile(data)
      .then(() => {
        this.updateSuccess = true;
        this.loading = false;
        setTimeout(() => (this.updateSuccess = false), 3000);
      })
      .catch(err => {
        this.updateError = err.message ?? 'Update failed';
        this.loading = false;
      });
  }
}
