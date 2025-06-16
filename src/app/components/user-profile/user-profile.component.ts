import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { Subscription, of } from "rxjs";
import { switchMap, tap } from "rxjs/operators";

import { AuthService } from "../../core/authentication/auth.service";
import { PollService } from "../../services/poll.service";
import { Poll } from "../../models/poll.model";

@Component({
  selector: "app-user-profile",
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: "./user-profile.component.html",
  styleUrl: "./user-profile.component.css",
})
export class UserProfileComponent implements OnInit, OnDestroy {
  /* -------------------------------------------------------------------------- */
  /*                               FORM CONTROLS                                */
  /* -------------------------------------------------------------------------- */
  profileForm: FormGroup;
  passwordForm: FormGroup;

  /* -------------------------------------------------------------------------- */
  /*                               UI STATE                                     */
  /* -------------------------------------------------------------------------- */
  loading = false;
  updateSuccess = false;
  updateError: string | null = null;
  passwordUpdateSuccess = false;
  passwordUpdateError: string | null = null;

  /* -------------------------------------------------------------------------- */
  /*                               POLL DATA                                    */
  /* -------------------------------------------------------------------------- */
  polls: Poll[] = []; // *public* polls (non‑private)
  userPolls: Poll[] = []; // polls created by the signed‑in user

  pollStats = {
    totalPolls: 0,
    totalVotes: 0,
    publicPolls: 0,
    privatePolls: 0,
  };

  /* -------------------------------------------------------------------------- */
  /*                               MISC                                         */
  /* -------------------------------------------------------------------------- */
  activeTab: "profile" | "polls" | "security" = "profile";
  private subs = new Subscription();

  /* -------------------------------------------------------------------------- */
  /*                               CONSTRUCTOR                                  */
  /* -------------------------------------------------------------------------- */
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private pollService: PollService,
  ) {
    /* -------------------------- Build Profile Form -------------------------- */
    this.profileForm = this.fb.group({
      displayName: ["", [Validators.required, Validators.minLength(3)]],
      email: [{ value: "", disabled: true }],
      bio: ["", [Validators.maxLength(200)]],
    });

    /* -------------------------- Build Password Form ------------------------- */
    this.passwordForm = this.fb.group(
      {
        currentPassword: ["", [Validators.required, Validators.minLength(6)]],
        newPassword: ["", [Validators.required, Validators.minLength(6)]],
        confirmPassword: ["", [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                               LIFECYCLE                                    */
  /* -------------------------------------------------------------------------- */
  ngOnInit(): void {
    this.loading = true;

    const initSub = this.authService.user$
      .pipe(
        /* ----------------- 1️⃣  Patch profile form with user ---------------- */
        tap((user) => {
          if (user) {
            this.profileForm.patchValue({
              displayName: user.displayName ?? "",
              email: user.email ?? "",
              bio: (user as any).bio ?? "",
            });
          }
        }),
        /* ---------- 2️⃣  Load user‑created polls then all public polls ------- */
        switchMap((user) => {
          if (!user) {
            return of(null);
          }

          return this.pollService.getPollsByUser(user.id).pipe(
            tap((polls) => {
              this.userPolls = polls;
              this.calculatePollStats(polls);
            }),
            switchMap(() => this.pollService.getAllPolls()),
          );
        }),
        /* ---------------- 3️⃣  Keep only public polls for display ------------ */
        tap((allPolls) => {
          if (allPolls) {
            this.polls = allPolls.filter((p) => !p.isPrivate);
          }
          this.loading = false;
        }),
      )
      .subscribe({
        error: (err) => {
          console.error("Profile init failed:", err);
          this.loading = false;
        },
      });

    this.subs.add(initSub);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /* -------------------------------------------------------------------------- */
  /*                               PROFILE TAB                                  */
  /* -------------------------------------------------------------------------- */
  updateProfile(): void {
    if (this.profileForm.invalid) return;

    this.loading = true;
    this.updateSuccess = false;
    this.updateError = null;

    const userData = {
      displayName: this.profileForm.get("displayName")?.value,
      bio: this.profileForm.get("bio")?.value,
    };

    this.authService
      .updateUserProfile(userData)
      .then(() => {
        this.updateSuccess = true;
        this.loading = false;
        setTimeout(() => (this.updateSuccess = false), 3000);
      })
      .catch((error) => {
        this.updateError = `Failed to update profile: ${error.message}`;
        this.loading = false;
      });
  }

  /* -------------------------------------------------------------------------- */
  /*                               SECURITY TAB                                 */
  /* -------------------------------------------------------------------------- */
  updatePassword(): void {
    if (this.passwordForm.invalid) return;

    const currentPassword = this.passwordForm.get("currentPassword")?.value;
    const newPassword = this.passwordForm.get("newPassword")?.value;

    this.loading = true;
    this.passwordUpdateSuccess = false;
    this.passwordUpdateError = null;

    this.authService
      .updatePassword(currentPassword, newPassword)
      .then(() => {
        this.passwordUpdateSuccess = true;
        this.loading = false;
        this.passwordForm.reset();
        setTimeout(() => (this.passwordUpdateSuccess = false), 3000);
      })
      .catch((error) => {
        this.passwordUpdateError = `Failed to update password: ${error.message}`;
        this.loading = false;
      });
  }

  passwordMatchValidator(form: FormGroup): { mismatch: boolean } | null {
    const newPassword = form.get("newPassword")?.value;
    const confirmPassword = form.get("confirmPassword")?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  /* -------------------------------------------------------------------------- */
  /*                               POLL HELPERS                                 */
  /* -------------------------------------------------------------------------- */
  private calculatePollStats(polls: Poll[]): void {
    this.pollStats.totalPolls = polls.length;
    this.pollStats.totalVotes = polls.reduce(
      (sum, poll) => sum + (poll.totalVotes ?? 0),
      0,
    );
  this.pollStats.publicPolls = polls.filter(p => !p.isPrivate).length;
  this.pollStats.privatePolls = polls.filter(p => p.isPrivate).length;
  }

  getRecentPolls(): Poll[] {
    return this.userPolls.slice(0, 5);
  }

  /* ------------------------------ Poll Status ------------------------------ */
  isPollActive(poll: Poll): boolean {
    const now = Date.now();
    if (poll.startDate && new Date(poll.startDate).getTime() > now) return false;
    if (poll.endDate && new Date(poll.endDate).getTime() < now) return false;
    return true;
  }

  getPollStatus(poll: Poll): "Upcoming" | "Active" | "Ended" {
    const now = Date.now();
    if (poll.startDate && new Date(poll.startDate).getTime() > now) return "Upcoming";
    if (poll.endDate && new Date(poll.endDate).getTime() < now) return "Ended";
    return "Active";
  }

  getPollStatusClass(poll: Poll): string {
    return `status-${this.getPollStatus(poll).toLowerCase()}`;
  }

  /* -------------------------------------------------------------------------- */
  /*                               UI HELPERS                                   */
  /* -------------------------------------------------------------------------- */
  setActiveTab(tab: "profile" | "polls" | "security"): void {
    this.activeTab = tab;
  }

  deleteAccount(): void {
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone and all your polls will be deleted.",
      )
    ) {
      this.authService.deleteAccount().catch((error) =>
        alert(`Failed to delete account: ${error.message}`),
      );
    }
  }
}
