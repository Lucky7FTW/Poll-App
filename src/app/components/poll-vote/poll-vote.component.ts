import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { first, switchMap } from 'rxjs/operators';

import { Poll } from '../../models/poll.model';
import { PollService } from '../../services/poll.service';
import { AuthService } from '../../core/authentication/auth.service';

@Component({
  selector: 'app-poll-vote',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './poll-vote.component.html',
  styleUrls: ['./poll-vote.component.css'],   // ✅ plural – Angular looks for an array
})
export class PollVoteComponent implements OnInit {
  /* ── DI ── */
  private pollService = inject(PollService);
  private authService = inject(AuthService);
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private fb          = inject(FormBuilder);

  /* ── state ── */
  poll: Poll | null = null;

  hasStarted = true;
  hasEnded   = false;

  isLoading      = true;
  isSubmitting   = false;
  hasVoted       = false;
  mustVoteNotice = false;
  errorMessage   = '';

  voteForm: FormGroup = this.fb.group({
    selectedOption: ['', Validators.required],   // radio
  });
  selectedOptions: string[] = [];                // checkboxes

  /* ── init ── */
  ngOnInit(): void {
    /* banner if guard bounced us */
    this.mustVoteNotice =
      this.route.snapshot.queryParamMap.get('needVote') === 'true';

    const pollId = this.route.snapshot.paramMap.get('id');
    if (!pollId) return this.finishWithError('Poll ID is missing');

    const user = this.authService.user;
    if (!user) return this.finishWithError('You must be logged in to vote.');

    /* fetch poll then vote-status */
    this.pollService
      .getPollById(pollId)
      .pipe(
        switchMap(poll => {
          if (!poll) throw new Error('not-found');
          this.poll = poll;
          this.evaluateTimeWindow(poll);
          return this.pollService.checkIfUserVoted(pollId, user.id);
        }),
        first()
      )
      .subscribe({
        next: voted => {
          this.hasVoted       = voted;
          this.mustVoteNotice = this.mustVoteNotice && !voted;
          this.isLoading      = false;
        },
        error: err => this.finishWithError(
          err.message === 'not-found'
            ? 'Poll not found'
            : 'Failed to load poll.'
        ),
      });
  }

  /* ── helpers ── */
  private evaluateTimeWindow(poll: Poll) {
    const now = new Date();
    this.hasStarted = !poll.startDate || new Date(poll.startDate) <= now;
    this.hasEnded   = !!poll.endDate && new Date(poll.endDate) < now;
  }

  get votingOpen(): boolean {
    return this.hasStarted && !this.hasEnded && !this.hasVoted;
  }

  onCheckboxChange(e: Event) {
    const { checked, value } = e.target as HTMLInputElement;
    this.selectedOptions = checked
      ? [...this.selectedOptions, value]
      : this.selectedOptions.filter(v => v !== value);
  }

  onSubmit() {
    if (!this.poll || !this.votingOpen || this.isSubmitting) return;

    const user = this.authService.user;
    if (!user) {
      this.errorMessage = 'You must be logged in to vote.';
      return;
    }

    const optionIds = this.poll.allowMultiple
      ? this.selectedOptions
      : [this.voteForm.value.selectedOption];

    if (optionIds.length === 0) return;

    this.isSubmitting = true;

    this.pollService
      .submitVote(this.poll.id, user.id, optionIds)
      .pipe(first())
      .subscribe({
        next: () =>
          this.router.navigate(['/poll', this.poll!.id, 'results']),
        error: err => {
          console.error('Vote failed:', err);
          this.errorMessage = 'Failed to submit vote.';
          this.isSubmitting = false;
        },
      });
  }

  private finishWithError(msg: string) {
    this.errorMessage = msg;
    this.isLoading    = false;
  }
}
