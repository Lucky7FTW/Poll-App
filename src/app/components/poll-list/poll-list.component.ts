import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Poll } from '../../models/poll.model';
import { PollService } from '../../services/poll.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-poll-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './poll-list.component.html',
  styleUrl: './poll-list.component.css',
})
export class PollListComponent implements OnInit {
  private pollService = inject(PollService);
  private platformId = inject(PLATFORM_ID);

  polls: Poll[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.pollService.getAllPolls().subscribe({
        next: (allPolls) => {
          this.polls = allPolls.filter((poll) => !poll.isPrivate);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load polls:', err);
          this.errorMessage = 'Failed to load polls.';
          this.isLoading = false;
        },
      });
    } else {
      // E doar pentru SSR
      this.isLoading = false;
    }
  }

  // Check if poll is currently active (can be voted on)
  isPollActive(poll: Poll): boolean {
    const now = new Date()

    // If poll has start date and it's in the future, not active yet
    if (poll.startDate && new Date(poll.startDate) > now) {
      return false
    }

    // If poll has end date and it's in the past, not active anymore
    if (poll.endDate && new Date(poll.endDate) < now) {
      return false
    }

    return true
  }

  // Get poll status text
  getPollStatus(poll: Poll): string {
    const now = new Date()

    if (poll.startDate && new Date(poll.startDate) > now) {
      return "Upcoming"
    }

    if (poll.endDate && new Date(poll.endDate) < now) {
      return "Ended"
    }

    if (poll.startDate && new Date(poll.startDate) <= now) {
      return "Active"
    }

    return "Active"
  }

  // Get CSS class for poll status
  getPollStatusClass(poll: Poll): string {
    const status = this.getPollStatus(poll)
    return `status-${status.toLowerCase()}`
  }
}
