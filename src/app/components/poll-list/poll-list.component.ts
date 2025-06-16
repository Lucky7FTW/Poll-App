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
  styleUrls: ['./poll-list.component.css'],   // ← plural
})
export class PollListComponent implements OnInit {

  /* ───────── dependencies ───────── */
  private pollService = inject(PollService);
  private platformId  = inject(PLATFORM_ID);

  /* ───────── state ───────── */
  polls: Poll[] = [];
  isLoading   = true;
  errorMessage = '';

  /** STATUS dropdown */
  selectedFilter: 'all' | 'active' | 'inactive' | 'closed' = 'all';

  /** SEARCH box */
  searchTerm = '';

  /** SORT dropdown */
  selectedSort:
    | 'date-desc' | 'date-asc'
    | 'name-asc' | 'name-desc'
    | 'votes-desc' | 'votes-asc' = 'date-desc';

  /* ───────── derived list ───────── */
  get filteredPolls(): Poll[] {
    /* 1️⃣ status filter */
    let list = this.pollService.filterByStatus(this.polls, this.selectedFilter);

    /* 2️⃣ name search */
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.trim().toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q));
    }

    /* 3️⃣ sorting */
    return this.pollService.sortPolls(list, this.selectedSort);
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

  /* ───────── delegates for the template ───────── */

  isPollActive(poll: Poll): boolean {
    return this.pollService.isPollActive(poll);
  }

  getPollStatus(poll: Poll): 'Upcoming' | 'Active' | 'Ended' {
    return this.pollService.getPollStatus(poll);
  }

  getPollStatusClass(poll: Poll): string {
    return this.pollService.getPollStatusClass(poll);
  }

  getTimeUntilEnd(poll: Poll): string | null {
    return this.pollService.getTimeUntilEnd(poll);
  }
}
