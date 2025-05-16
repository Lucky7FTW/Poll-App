import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

//import { PollService } from '../../services/poll.service';
//import { AuthService } from '../../services/auth.service';

import { Poll } from '../../models/poll.model';

@Component({
  selector: 'app-poll-vote',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './poll-vote.component.html',
  styleUrl: './poll-vote.component.css'
})
export class PollVoteComponent {
  poll: Poll | null = null;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  hasVoted = false;

  voteForm: FormGroup;
  selectedOptions: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    // private pollService: PollService,
    //public authService: AuthService
  ) {
    this.voteForm = this.fb.group({
      selectedOption: ['', Validators.required]
    });
  }

  ngOnInit() {
    const pollId = this.route.snapshot.paramMap.get('id');
    if (!pollId) {
      this.errorMessage = 'Poll ID is missing';
      this.isLoading = false;
      return;
    }

    // Simulate API call with timeout
    // Generate dummy poll data
    this.poll = {
      id: pollId,
      title: 'What is your favorite programming language?',
      description: 'Please select the language you enjoy coding with the most.',
      options: [
        { id: 'opt-1', text: 'JavaScript' },
        { id: 'opt-2', text: 'Python' },
        { id: 'opt-3', text: 'Java' },
        { id: 'opt-4', text: 'C#' },
        { id: 'opt-5', text: 'TypeScript' }
      ],
      createdBy: 'JohnDoe',
      createdAt: new Date().toISOString(),
      allowMultiple: false,
      isPrivate: false,
      totalVotes: 145
    };

    // this.hasVoted = this.pollService.hasUserVoted(pollId);

    this.isLoading = false;
  }

  onCheckboxChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const optionId = target.value;

    if (target.checked) {
      if (!this.selectedOptions.includes(optionId)) {
        this.selectedOptions.push(optionId);
      }
    } else {
      const index = this.selectedOptions.indexOf(optionId);
      if (index > -1) {
        this.selectedOptions.splice(index, 1);
      }
    }
  }

  onSubmit() {
    if (this.voteForm.invalid && !this.poll?.allowMultiple) return;
    if (this.poll?.allowMultiple && this.selectedOptions.length === 0) return;

    this.isSubmitting = true;

    const voteData = {
      pollId: this.poll?.id,
      options: this.poll?.allowMultiple
        ? this.selectedOptions
        : [this.voteForm.get('selectedOption')?.value]
    };


    // if (this.poll) {
    //   this.pollService.markPollAsVotedForDemo(this.poll.id);
    // }

    this.router.navigate(['/poll', this.poll?.id, 'results']);

  }
}
