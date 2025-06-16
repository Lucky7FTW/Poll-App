import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PLATFORM_ID } from '@angular/core';

import { Poll } from '../../models/poll.model';
import { PollService } from '../../services/poll.service';

@Component({
  selector: 'app-poll-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule          // ⬅️ enables two-way binding for the <select>
  ],
  templateUrl: './poll-list.component.html',
  styleUrl:    './poll-list.component.css',
})
export class PollListComponent implements OnInit {
  /* ───────────────────────── Dependencies ───────────────────────── */
  private pollService = inject(PollService);
  private platformId  = inject(PLATFORM_ID);

  /* ───────────────────────── State ───────────────────────── */
  polls: Poll[] = [];
  isLoading = true;
  errorMessage = '';

  /** Bound to the dropdown; default shows every poll */
  selectedFilter: 'all' | 'active' | 'inactive' | 'closed' = 'all';

  /* ───────────────────────── Filtering helper ───────────────────────── */
  /** Returns the list that should be rendered, based on `selectedFilter`. */
  get filteredPolls(): Poll[] {
    switch (this.selectedFilter) {
      case 'active':
        return this.polls.filter(p => this.isPollActive(p));

      case 'inactive':        // “Upcoming” only
        return this.polls.filter(
          p => !this.isPollActive(p) && this.getPollStatus(p) === 'Upcoming'
        );

      case 'closed':          // already ended
        return this.polls.filter(p => this.getPollStatus(p) === 'Ended');

      default:                // 'all'
        return this.polls;
    }
  }

  /* ───────────────────────── Lifecycle ───────────────────────── */
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.pollService.getAllPolls().subscribe({
        next: (allPolls) => {
          // hide private polls
          this.polls     = allPolls.filter(p => !p.isPrivate);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load polls:', err);
          this.errorMessage = 'Failed to load polls.';
          this.isLoading = false;
        },
      });
    } else {
      // When rendering on the server (SSR) we skip the HTTP request
      this.isLoading = false;
    }
  }

  /* ───────────────────────── Utility methods ───────────────────────── */

  /** Returns true if the poll is currently open for voting. */
  isPollActive(poll: Poll): boolean {
    const now = new Date();

    // Not started yet?
    if (poll.startDate && new Date(poll.startDate) > now) return false;

    // Already ended?
    if (poll.endDate && new Date(poll.endDate) < now) return false;

    return true;
  }

  /** Returns a human-readable status string. */
  getPollStatus(poll: Poll): 'Upcoming' | 'Active' | 'Ended' {
    const now = new Date();

    if (poll.startDate && new Date(poll.startDate) > now) return 'Upcoming';
    if (poll.endDate   && new Date(poll.endDate)   < now) return 'Ended';
    return 'Active';
  }

  /** Returns a CSS class like `status-active`, `status-upcoming`, etc. */
  getPollStatusClass(poll: Poll): string {
    return `status-${this.getPollStatus(poll).toLowerCase()}`;
  }

  /**
   * For ACTIVE polls that have an endDate in the future, returns a compact
   * countdown string such as "3d 4h", "5h 30m", or "22m".
   * Returns `null` for polls without an end date or that have already ended.
   */
  getTimeUntilEnd(poll: Poll): string | null {
    if (!poll.endDate) return null;

    const end = new Date(poll.endDate);
    const now = new Date();
    if (end <= now) return null;

    const diffMs  = end.getTime() - now.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    const days    = Math.floor(diffSec / 86_400);          // 24*60*60
    const hours   = Math.floor((diffSec % 86_400) / 3_600);
    const minutes = Math.floor((diffSec % 3_600)  / 60);

    if (days   > 0) return `${days}d ${hours}h`;
    if (hours  > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }
}
