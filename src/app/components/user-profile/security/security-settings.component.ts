// src/app/pages/user-profile/security-settings.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';

import { AuthService } from '../../../core/authentication/auth.service';

@Component({
  selector: 'app-security-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './security-settings.component.html',
  styleUrls: ['./security-settings.component.css'],
})
export class SecuritySettingsComponent {
  private fb          = inject(FormBuilder);
  private authService = inject(AuthService);

  loading = false;
  success = false;
  error: string | null = null;

  form: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required, Validators.minLength(6)]],
    newPassword:     ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: this.matchPasswords });

  /* custom validator: new == confirm */
  private matchPasswords(group: FormGroup) {
    const { newPassword, confirmPassword } = group.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  updatePassword(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const { currentPassword, newPassword } = this.form.value;

    this.authService.updatePassword(currentPassword, newPassword)
      .then(() => {
        this.success = true; this.loading = false; this.form.reset();
        setTimeout(() => (this.success = false), 3000);
      })
      .catch(err => {
        this.error = err.message ?? 'Failed to update password';
        this.loading = false;
      });
  }

  deleteAccount(): void {
    if (!confirm('Delete your account? This action is irreversible.')) return;
    this.authService.deleteAccount()
      .catch(err => alert(`Failed: ${err.message}`));
  }
}
