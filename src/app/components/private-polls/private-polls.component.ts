import { Observable, forkJoin, firstValueFrom } from 'rxjs';
import { TextService } from '../../services/text.service'; // adjust import if needed
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Poll } from '../../models/poll.model';
import { PollService } from '../../services/poll.service';
import { AuthService } from '../../core/authentication/auth.service';

interface PrivatePollsTexts {
  title: string; create: string; emptyTitle: string; emptyDesc: string; emptyCta: string;
  addLabel: string; addPlaceholder: string; addButton: string; loading: string;
  mustLogin: string; loadError: string; savedListError: string;
  copySuccess: string; copyError: string; deleteConfirm: string; deleteError: string;
  addRequired: string; addInvalid: string; addNotFound: string; addNotPrivate: string;
  addFailed: string; fetchFailed: string;
  votes: string; private: string; vote: string; results: string;
  remove: string; copy: string; created: string;
}

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
  private textService = inject(TextService);

  readonly t$: Observable<PrivatePollsTexts> = this.textService.section<PrivatePollsTexts>('privatePolls');

  loading = true;
  error: string | null = null;
  polls: Poll[] = [];
  linkControl = new FormControl('');
  addingError = '';

  ngOnInit(): void {
    this.loadPrivatePolls();
  }

  async loadPrivatePolls() {
    const t = await firstValueFrom(this.t$);
    const user = this.authService.user.getValue();

    if (!user) {
      this.error = t.mustLogin;
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

        const pollObservables = pollIds.map((id) => this.pollService.getPollById(id));
        forkJoin(pollObservables).subscribe({
          next: (results) => {
            this.polls = results.filter((p) => p !== null) as Poll[];
            this.loading = false;
          },
          error: (err) => {
            console.error(err);
            this.error = t.loadError;
            this.loading = false;
          },
        });
      },
      error: (err) => {
        console.error(err);
        this.error = t.savedListError;
        this.loading = false;
      },
    });
  }

  async copyPollLink(pollId: string) {
    const t = await firstValueFrom(this.t$);
    const pollUrl = `${window.location.origin}/poll/${pollId}`;
    navigator.clipboard.writeText(pollUrl).then(
      () => alert(t.copySuccess),
      () => { this.error = t.copyError; }
    );
  }

  async deletePoll(pollId: string) {
    const t = await firstValueFrom(this.t$);
    if (confirm(t.deleteConfirm)) {
      this.pollService.deletePoll(pollId).subscribe({
        next: () => {
          this.polls = this.polls.filter((p) => p.id !== pollId);
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.error = t.deleteError;
        },
      });
    }
  }

  async addPrivatePollByLink() {
    this.addingError = '';
    const t = await firstValueFrom(this.t$);
    const url = this.linkControl.value?.trim();

    if (!url) { this.addingError = t.addRequired; return; }

    const parts = url.split('/');
    const pollId = parts[parts.length - 1];

    if (!pollId) { this.addingError = t.addInvalid; return; }

    const user = this.authService.user.getValue();
    if (!user) { this.addingError = t.mustLogin; return; }

    this.pollService.getPollById(pollId).subscribe({
      next: (poll) => {
        if (!poll)      { this.addingError = t.addNotFound; return; }
        if (!poll.isPrivate) { this.addingError = t.addNotPrivate; return; }

        this.pollService.savePrivatePollForUser(user.id, poll.id!).subscribe({
          next: () => {
            this.polls.push(poll);
            this.linkControl.setValue('');
          },
          error: () => { this.addingError = t.addFailed; }
        });
      },
      error: () => { this.addingError = t.fetchFailed; }
    });
  }
}
