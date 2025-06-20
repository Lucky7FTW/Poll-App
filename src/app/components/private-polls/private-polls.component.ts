import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import {
  forkJoin,
  of,
  switchMap,
  map,
  catchError,
  take,
  tap,
} from 'rxjs';

import { PollService } from '../../services/poll.service';
import { AuthService } from '../../core/authentication/auth.service';
import { Poll } from '../../models/poll.model';

@Component({
  selector: 'app-private-polls',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './private-polls.component.html',
  styleUrls: ['./private-polls.component.css'],
})
export class PrivatePollsComponent {
  private pollService = inject(PollService);
  private auth        = inject(AuthService);

  loading = true;
  error: string | null = null;
  polls: Poll[] = [];

  /* link input */
  linkControl = new FormControl('', Validators.required);
  addingError  = '';

  /* ─────────── life-cycle ─────────── */
  ngOnInit() {
    /** Whenever user changes (incl. auto-login), refresh list */
    this.auth.user$
      .pipe(switchMap(() => this.fetchPrivatePolls()))
      .subscribe();
  }

  /* ─────────── ownership helper ─────────── */
  /** Returns true if the logged-in user created the poll */
  isOwner(poll: Poll): boolean {
    const user = this.auth.user;
    return !!user && poll.createdBy === user.id; // adjust property name if needed
  }

  /* ─────────── core fetch logic ─────────── */
  private fetchPrivatePolls() {
    this.loading = true;
    this.error   = null;

    const user = this.auth.user;
    if (!user) {
      this.loading = false;
      this.error   = 'You must be logged in to view private polls.';
      return of(null);
    }

    return this.pollService.getSavedPrivatePollIds(user.id).pipe(
      switchMap((ids) => {
        if (!ids.length) return of([] as Poll[]);
        const requests = ids.map((id) => this.pollService.getPollById(id));
        return forkJoin(requests);
      }),
      map((arr) => arr.filter(Boolean) as Poll[]),
      tap({
        next: (p) => {
          this.polls   = p;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.error   = 'Failed to load private polls.';
        },
      }),
      take(1),
      catchError(() => of(null))
    );
  }

  /* ─────────── clipboard & delete ─────────── */
  copyPollLink(id: string) {
    const url = `${location.origin}/poll/${id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => alert('Link copied to clipboard!'))
      .catch(() => (this.error = 'Failed to copy link.'));
  }

  deletePoll(id: string) {
    if (!confirm('Are you sure you want to delete this poll?')) return;

    this.pollService.deletePoll(id).pipe(take(1)).subscribe({
      next: () => (this.polls = this.polls.filter((p) => p.id !== id)),
      error: () => (this.error = 'Failed to delete poll.'),
    });
  }

  /* ─────────── add by link ─────────── */
  addPrivatePollByLink() {
    this.addingError = '';

    if (this.linkControl.invalid) {
      this.addingError = 'Please enter a link.';
      return;
    }

    const url     = this.linkControl.value!.trim();
    const parts   = url.split('/');
    const pollId  = parts.pop() || parts.pop(); // handles trailing slash

    if (!pollId) {
      this.addingError = 'Invalid link format.';
      return;
    }

    const user = this.auth.user;
    if (!user) {
      this.addingError = 'You must be logged in.';
      return;
    }

    this.pollService.getPollById(pollId).pipe(take(1)).subscribe({
      next: (poll) => {
        if (!poll) {
          this.addingError = 'Poll not found.';
          return;
        }
        if (!poll.isPrivate) {
          this.addingError = 'This is not a private poll.';
          return;
        }

        this.pollService
          .savePrivatePollForUser(user.id, poll.id!)
          .pipe(take(1))
          .subscribe({
            next: () => {
              this.polls.push(poll);
              this.linkControl.reset();
            },
            error: () => (this.addingError = 'Failed to save poll link.'),
          });
      },
      error: () => (this.addingError = 'Failed to fetch poll.'),
    });
  }
}
