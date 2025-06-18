// src/app/pages/user-profile/user-polls.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { Poll } from '../../../models/poll.model';
import { PollService } from '../../../services/poll.service';
import { AuthService } from '../../../core/authentication/auth.service';

@Component({
  selector: 'app-user-polls',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './user-polls.component.html',
  styleUrls: ['./user-polls.component.css'],
})
export class UserPollsComponent {
  private pollService = inject(PollService);
  private authService = inject(AuthService);

  loading     = true;
  deleteError: string | null = null;
  deletingId: string | null  = null;

  userPolls: Poll[] = [];

  /* filter / sort ui state */
  selectedFilter: 'all' | 'active' | 'inactive' | 'closed' = 'all';
  searchTerm = '';
  selectedSort:
    | 'date-desc' | 'date-asc'
    | 'name-asc'  | 'name-desc'
    | 'votes-desc'| 'votes-asc' = 'date-desc';

  constructor() {
    const user = this.authService.user;
    (user
      ? this.pollService.getPollsByUser(user.email)
      : of([]))
    .pipe(tap(polls => {
      this.userPolls = polls;
      this.loading = false;
    }))
    .subscribe();
  }

  /* derived list for the template */
  get filteredPolls(): Poll[] {
    let list = this.pollService.filterByStatus(this.userPolls, this.selectedFilter);
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase().trim();
      list = list.filter(p => p.title.toLowerCase().includes(q));
    }
    return this.pollService.sortPolls(list, this.selectedSort);
  }

  /* helpers for template */
  isPollActive       = (p: Poll) => this.pollService.isPollActive(p);
  getPollStatus      = (p: Poll) => this.pollService.getPollStatus(p);
  getPollStatusClass = (p: Poll) => this.pollService.getPollStatusClass(p);

  canDeletePoll(p: Poll): boolean {
    return this.getPollStatus(p) !== 'Active';
  }

  deletePoll(p: Poll): void {
    if (!this.canDeletePoll(p)) return;
    if (!confirm(`Delete poll “${p.title}”? This cannot be undone.`)) return;

    this.deletingId  = p.id;
    this.deleteError = null;

    this.pollService.deletePoll(p.id).subscribe({
      next: () => {
        this.userPolls = this.userPolls.filter(x => x.id !== p.id);
        this.deletingId = null;
      },
      error: err => {
        this.deleteError = err.message ?? 'Failed to delete poll';
        this.deletingId = null;
      }
    });
  }
}
