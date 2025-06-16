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
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './poll-list.component.html',
  styleUrl:    './poll-list.component.css',
})
export class PollListComponent implements OnInit {

  /* ───────── dependencies ───────── */
  private pollService = inject(PollService);
  private platformId  = inject(PLATFORM_ID);

  /* ───────── state ───────── */
  polls: Poll[] = [];
  isLoading   = true;
  errorMessage = '';

  /** STATUS filter dropdown — keeps template syntax `[ngModel]="selectedFilter"` working */
  selectedFilter: 'all' | 'active' | 'inactive' | 'closed' = 'all';

  /** SEARCH box */
  searchTerm = '';

  /** SORT dropdown */
  selectedSort: 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' = 'date-desc';

  /* ───────── derived list ───────── */
  get filteredPolls(): Poll[] {

    /* 1️⃣ status filter */
    let list = this.filterByStatus(this.polls, this.selectedFilter);

    /* 2️⃣ name search */
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.trim().toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q));
    }

    /* 3️⃣ sorting */
    list = [...list].sort((a, b) => this.sortFn(a, b, this.selectedSort));

    return list;
  }

  /* ───────── lifecycle ───────── */
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.pollService.getAllPolls().subscribe({
        next: allPolls => {
          this.polls     = allPolls.filter(p => !p.isPrivate);
          this.isLoading = false;
        },
        error: err => {
          console.error('Failed to load polls:', err);
          this.errorMessage = 'Failed to load polls.';
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;   // SSR fallback
    }
  }

  /* ───────── helpers ───────── */

  private filterByStatus(polls: Poll[], status: string): Poll[] {
    switch (status) {
      case 'active':
        return polls.filter(p => this.isPollActive(p));
      case 'inactive': // upcoming
        return polls.filter(
          p => !this.isPollActive(p) && this.getPollStatus(p) === 'Upcoming'
        );
      case 'closed':
        return polls.filter(p => this.getPollStatus(p) === 'Ended');
      default:
        return polls;
    }
  }

  private sortFn(a: Poll, b: Poll, mode: string): number {
    switch (mode) {
      case 'name-asc':
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      case 'name-desc':
        return b.title.localeCompare(a.title, undefined, { sensitivity: 'base' });
      case 'date-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'date-desc':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  }

  /* ───────── poll-status utilities ───────── */

  isPollActive(poll: Poll): boolean {
    const now = new Date();
    if (poll.startDate && new Date(poll.startDate) > now) return false;
    if (poll.endDate   && new Date(poll.endDate)   < now) return false;
    return true;
  }

  getPollStatus(poll: Poll): 'Upcoming' | 'Active' | 'Ended' {
    const now = new Date();
    if (poll.startDate && new Date(poll.startDate) > now)  return 'Upcoming';
    if (poll.endDate   && new Date(poll.endDate)   < now)  return 'Ended';
    return 'Active';
  }

  getPollStatusClass(poll: Poll): string {
    return `status-${this.getPollStatus(poll).toLowerCase()}`;
  }

  getTimeUntilEnd(poll: Poll): string | null {
    if (!poll.endDate) return null;
    const end = new Date(poll.endDate), now = new Date();
    if (end <= now) return null;

    const diffSec = Math.floor((end.getTime() - now.getTime()) / 1000);
    const days = Math.floor(diffSec / 86_400);
    const hours = Math.floor((diffSec % 86_400) / 3_600);
    const mins = Math.floor((diffSec % 3_600) / 60);

    if (days  > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }
}
