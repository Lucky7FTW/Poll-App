import { Component, OnInit, inject } from '@angular/core';
import { PollService } from '../../services/poll.service';
import { AuthService } from '../../core/authentication/auth.service';
import { Poll } from '../../models/poll.model';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-private-polls',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './private-polls.component.html',
  styleUrls: ['./private-polls.component.css'],
})
export class PrivatePollsComponent implements OnInit {
  private pollService = inject(PollService);
  private authService = inject(AuthService);

  loading = true;
  error: string | null = null;
  polls: Poll[] = [];

  ngOnInit(): void {
    this.loadPrivatePolls();
  }

  loadPrivatePolls(): void {
    const user = this.authService.user.getValue();

    if (!user) {
      this.error = 'You must be logged in to view private polls.';
      this.loading = false;
      return;
    }

    this.pollService.getSavedPrivatePollIds(user.id).subscribe({
      next: (pollIds) => {
        if (pollIds.length === 0) {
          this.polls = [];
          this.loading = false;
          return;
        }

        const pollObservables = pollIds.map((id) =>
          this.pollService.getPollById(id)
        );

        forkJoin(pollObservables).subscribe({
          next: (results) => {
            // filtrează null-uri (în caz că poll-ul a fost șters)
            this.polls = results.filter((p) => p !== null) as Poll[];
            this.loading = false;
          },
          error: (err) => {
            console.error(err);
            this.error = 'Failed to load private polls.';
            this.loading = false;
          },
        });
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to get saved poll list.';
        this.loading = false;
      },
    });
  }

  copyPollLink(pollId: string): void {
    const pollUrl = `${window.location.origin}/poll/${pollId}`;
    navigator.clipboard
      .writeText(pollUrl)
      .then(() => {
        console.log('Link copied:', pollUrl);
        alert('Link copied to clipboard!');
      })
      .catch((err) => {
        console.error('Copy failed:', err);
        this.error = 'Failed to copy link.';
      });
  }

  deletePoll(pollId: string): void {
    if (confirm('Are you sure you want to delete this poll?')) {
      this.pollService.deletePoll(pollId).subscribe({
        next: () => {
          this.polls = this.polls.filter((p) => p.id !== pollId);
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.error = 'Failed to delete poll.';
        },
      });
    }
  }

  linkControl = new FormControl('');
  addingError = '';

  addPrivatePollByLink(): void {
    this.addingError = '';
    const url = this.linkControl.value?.trim();

    if (!url) {
      this.addingError = 'Please enter a link.';
      return;
    }

    const parts = url.split('/');
    const pollId = parts[parts.length - 1];

    if (!pollId) {
      this.addingError = 'Invalid link format.';
      return;
    }

    // 1) Preluăm userul
    const user = this.authService.user.getValue();
    if (!user) {
      this.addingError = 'You must be logged in.';
      return;
    }

    // 2) Cerem datele poll-ului
    this.pollService.getPollById(pollId).subscribe({
      next: (poll) => {
        if (!poll) {
          this.addingError = 'Poll not found.';
          return;
        }
        if (!poll.isPrivate) {
          this.addingError = 'This is not a private poll.';
          return;
        }

        // 3) Salvăm asocierea user → poll în Firebase
        this.pollService.savePrivatePollForUser(user.id, poll.id!).subscribe({
          next: () => {
            // 4) Abia apoi îl adăugăm în lista locală
            this.polls.push(poll);
            this.linkControl.setValue('');
          },
          error: () => {
            this.addingError = 'Failed to save poll link.';
          },
        });
      },
      error: () => {
        this.addingError = 'Failed to fetch poll.';
      },
    });
  }
}
