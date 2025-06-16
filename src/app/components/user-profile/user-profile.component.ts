import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { Subscription, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

import { AuthService } from '../../core/authentication/auth.service';
import { PollService } from '../../services/poll.service';
import { Poll } from '../../models/poll.model';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
})
export class UserProfileComponent implements OnInit, OnDestroy {
  /* ───────── form controls ───────── */
  profileForm: FormGroup;
  passwordForm: FormGroup;

  /* ───────── ui state ───────── */
  loading = false;
  updateSuccess = false;
  updateError: string | null = null;
  passwordUpdateSuccess = false;
  passwordUpdateError: string | null = null;

  /* ───────── poll data ───────── */
  userPolls: Poll[] = [];                 // only the signed-in user’s polls

  pollStats = {
    totalPolls:   0,
    totalVotes:   0,
    publicPolls:  0,
    privatePolls: 0,
  };

  /* ───────── filter / search / sort ui state ───────── */
  selectedFilter: 'all' | 'active' | 'inactive' | 'closed' = 'all';
  searchTerm = '';
  selectedSort:
    | 'date-desc' | 'date-asc'
    | 'name-asc'  | 'name-desc'
    | 'votes-desc'| 'votes-asc' = 'date-desc';

  /* ───────── misc ───────── */
  activeTab: 'profile' | 'polls' | 'security' = 'profile';

  isActive(tab: 'profile' | 'polls' | 'security'): boolean {
    return this.activeTab === tab;
  }

  private subs = new Subscription();

  /* ───────── ctor ───────── */
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private pollService: PollService,
  ) {
    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(3)]],
      email:       [{ value: '', disabled: true }],
      bio:         ['', [Validators.maxLength(200)]],
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required, Validators.minLength(6)]],
        newPassword:     ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  /* ───────── lifecycle ───────── */
  ngOnInit(): void {
    this.loading = true;

    const init$ = this.authService.user$.pipe(
      tap(user => {
        if (user) {
          this.profileForm.patchValue({
            displayName: user.displayName ?? '',
            email:       user.email       ?? '',
          });
        }
      }),
      switchMap(user => {
        if (!user) return of([]);
        return this.pollService.getPollsByUser(user.email).pipe(
          tap(polls => {
            this.userPolls = polls;
            this.calculatePollStats(polls);
          }),
        );
      }),
      tap(() => (this.loading = false)),
    );

    this.subs.add(init$.subscribe());
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /* ───────── filtered list ───────── */
  get filteredPolls(): Poll[] {
    let list = this.pollService.filterByStatus(this.userPolls, this.selectedFilter);

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.trim().toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q));
    }

    return this.pollService.sortPolls(list, this.selectedSort);
  }

  /* ───────── delegates for template ───────── */
  isPollActive     = (p: Poll) => this.pollService.isPollActive(p);
  getPollStatus    = (p: Poll) => this.pollService.getPollStatus(p);
  getPollStatusClass = (p: Poll) => this.pollService.getPollStatusClass(p);
  getTimeUntilEnd  = (p: Poll) => this.pollService.getTimeUntilEnd(p);

  /* ───────── profile actions ───────── */
  passwordMatchValidator(form: FormGroup): { mismatch: boolean } | null {
    return form.get('newPassword')?.value === form.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  private calculatePollStats(polls: Poll[]): void {
    this.pollStats.totalPolls   = polls.length;
    this.pollStats.totalVotes   = polls.reduce((s, p) => s + (p.totalVotes ?? 0), 0);
    this.pollStats.publicPolls  = polls.filter(p => !p.isPrivate).length;
    this.pollStats.privatePolls = polls.filter(p =>  p.isPrivate).length;
  }

  setActiveTab(tab: 'profile' | 'polls' | 'security'): void {
    this.activeTab = tab;
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;
    this.loading = true;

    const userData = {
      displayName: this.profileForm.get('displayName')?.value,
      bio:         this.profileForm.get('bio')?.value,
    };

    this.authService.updateUserProfile(userData)
      .then(() => {
        this.updateSuccess = true;
        this.loading = false;
        setTimeout(() => (this.updateSuccess = false), 3000);
      })
      .catch(err => {
        this.updateError = `Failed to update profile: ${err.message}`;
        this.loading = false;
      });
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) return;

    const currentPassword = this.passwordForm.get('currentPassword')?.value;
    const newPassword     = this.passwordForm.get('newPassword')?.value;

    this.loading = true;
    this.authService.updatePassword(currentPassword, newPassword)
      .then(() => {
        this.passwordUpdateSuccess = true;
        this.loading = false;
        this.passwordForm.reset();
        setTimeout(() => (this.passwordUpdateSuccess = false), 3000);
      })
      .catch(err => {
        this.passwordUpdateError = `Failed to update password: ${err.message}`;
        this.loading = false;
      });
  }

  deleteAccount(): void {
    if (confirm('Delete your account and all your polls? This cannot be undone.')) {
      this.authService.deleteAccount()
        .catch(err => alert(`Failed to delete account: ${err.message}`));
    }
  }
}
