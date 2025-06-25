// src/app/pages/private-polls/private-polls.component.ts
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
  private auth = inject(AuthService);

  loading = true;
  error: string | null = null;
  polls: Poll[] = [];

  linkControl = new FormControl('', Validators.required);
  addingError = '';

  /* ── init ── */
  ngOnInit() {
    this.auth.user$
      .pipe(switchMap(() => this.fetchPrivatePolls()))
      .subscribe();
  }

  /* ── owner check ── */
  isOwner(poll: Poll): boolean {
    const u = this.auth.user;
    return !!u && poll.createdBy === u.email;
  }

  /* ── core fetch ── */
  private fetchPrivatePolls() {
    this.loading = true;
    this.error = null;

    const user = this.auth.user;
    if (!user) {
      this.loading = false;
      this.error = 'You must be logged in to view private polls.';
      return of(null);
    }

    return this.pollService.getSavedPrivatePollIds(user.id).pipe(
      switchMap((ids) => {
        if (!ids.length) return of([] as Poll[]);

        const requests = ids.map((id) =>
          this.pollService.getPollById(id).pipe(
            // Swallow individual request errors
            catchError(() => of(null))
          )
        );

        return forkJoin(requests);
      }),
      map((arr) => arr.filter((p): p is Poll => !!p && p.isPrivate)),
      tap({
        next: (p) => {
          this.polls = p;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.error = 'Failed to load private polls.';
        },
      }),
      take(1),
      catchError(() => of(null))
    );
  }

  /* ── clipboard & delete ── */
  copyPollLink(id: string) {
    navigator.clipboard
      .writeText(`${location.origin}/poll/${id}`)
      .then(() => alert('Link copied to clipboard!'))
      .catch(() => (this.error = 'Failed to copy link.'));
  }

  deletePoll(id: string) {
    if (!confirm('Are you sure you want to delete this poll?')) return;

    this.pollService
      .deletePoll(id)
      .pipe(take(1))
      .subscribe({
        next: () => (this.polls = this.polls.filter((p) => p.id !== id)),
        error: () => (this.error = 'Failed to delete poll.'),
      });
  }

  /* ── add by link ── */
  addPrivatePollByLink() {
    this.addingError = '';

    if (this.linkControl.invalid) {
      this.addingError = 'Please enter a link.';
      return;
    }

    const raw = this.linkControl.value!.trim();
    let pollId = '';

    try {
      const u = new URL(raw);
      pollId = u.pathname.split('/').filter(Boolean).pop() || '';
    } catch {
      const parts = raw.split('/');
      pollId = parts.pop() || parts.pop() || '';
    }

    if (!pollId) {
      this.addingError = 'Invalid link format.';
      return;
    }

    const user = this.auth.user;
    if (!user) {
      this.addingError = 'You must be logged in.';
      return;
    }

    if (this.polls.some((p) => p.id === pollId)) {
      this.addingError = 'Poll already in your list.';
      return;
    }

    this.pollService
      .getPollById(pollId)
      .pipe(take(1))
      .subscribe({
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
