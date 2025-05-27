import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Poll } from '../../models/poll.model';
import { PollService } from '../../services/poll.service';
import { AuthService } from '../../core/authentication/auth.service';

@Component({
  selector: 'app-poll-vote',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './poll-vote.component.html',
  styleUrl: './poll-vote.component.css',
})
export class PollVoteComponent implements OnInit {
  private pollService = inject(PollService);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  poll: Poll | null = null;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  hasVoted = false;

  voteForm: FormGroup;
  selectedOptions: string[] = [];

  constructor() {
    this.voteForm = this.fb.group({
      selectedOption: ['', Validators.required],
    });
  }

  ngOnInit() {
    const pollId = this.route.snapshot.paramMap.get('id');
    if (!pollId) {
      this.errorMessage = 'Poll ID is missing';
      this.isLoading = false;
      return;
    }

    const user = this.authService.user.getValue();
    if (!user) {
      this.errorMessage = 'You must be logged in to vote.';
      this.isLoading = false;
      return;
    }

    this.pollService.getPollById(pollId).subscribe({
      next: (poll) => {
        if (!poll) {
          this.errorMessage = 'Poll not found';
          this.isLoading = false;
          return;
        }

        this.poll = poll;

        // Verificăm dacă userul a mai votat
        this.pollService.checkIfUserVoted(pollId, user.id).subscribe({
          next: (hasVoted) => {
            this.hasVoted = hasVoted;
            this.isLoading = false;
          },
          error: (err) => {
            console.error(err);
            this.errorMessage = 'Failed to verify vote status.';
            this.isLoading = false;
          },
        });
      },
      error: (err) => {
        this.errorMessage = 'Failed to load poll.';
        this.isLoading = false;
      },
    });
  }

  onCheckboxChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const optionId = target.value;

    if (target.checked) {
      this.selectedOptions.push(optionId);
    } else {
      this.selectedOptions = this.selectedOptions.filter(
        (id) => id !== optionId
      );
    }
  }

  onSubmit() {
    if (!this.poll) return;

    const user = this.authService.user.getValue();
    if (!user) {
      this.errorMessage = 'You must be logged in to vote.';
      return;
    }

    const optionIds = this.poll.allowMultiple
      ? this.selectedOptions
      : [this.voteForm.get('selectedOption')?.value];

    if (optionIds.length === 0) return;

    this.isSubmitting = true;

    this.pollService.submitVote(this.poll.id, user.id, optionIds).subscribe({
      next: () => {
        this.router.navigate(['/poll', this.poll!.id, 'results']);
      },
      error: (err) => {
        console.error('Vote failed:', err);
        this.errorMessage = 'Failed to submit vote.';
        this.isSubmitting = false;
      },
    });
  }
}
