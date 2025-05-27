import { Component, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PollService } from '../../services/poll.service';
import { Poll, PollOption } from '../../models/poll.model';
import { AuthService } from '../../core/authentication/auth.service';
import { User } from '../../core/authentication/models/user.model';

@Component({
  selector: 'app-create-poll',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-poll.component.html',
  styleUrl: './create-poll.component.css',
})
export class CreatePollComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private pollService = inject(PollService);
  private authService = inject(AuthService);

  pollForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: [''],
    options: this.fb.array(
      [this.createOption(), this.createOption()],
      Validators.minLength(2)
    ),
    allowMultiple: [false],
    isPrivate: [false],
  });

  isLoading = false;
  errorMessage = '';

  get options() {
    return this.pollForm.get('options') as FormArray;
  }

  createOption(): FormGroup {
    return this.fb.group({
      text: ['', Validators.required],
    });
  }

  addOption() {
    this.options.push(this.createOption());
  }

  removeOption(index: number) {
    this.options.removeAt(index);
  }

  onSubmit() {
    if (this.pollForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const currentUser = this.authService.user.getValue();

    if (!currentUser) {
      this.isLoading = false;
      this.errorMessage = 'You must be logged in to create a poll.';
      return;
    }

    const formValue = this.pollForm.value;

    const newPoll: Omit<Poll, 'id' | 'totalVotes'> = {
      title: formValue.title,
      description: formValue.description,
      options: formValue.options.map((opt: { text: string }, i: number) => ({
        id: 'opt-' + i,
        text: opt.text,
      })),
      allowMultiple: formValue.allowMultiple,
      isPrivate: formValue.isPrivate,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.email,
    };

    this.pollService.createPoll({ ...newPoll, totalVotes: 0 }).subscribe({
      next: (pollId: string) => {
        this.isLoading = false;
        this.router.navigate(['/poll', pollId]);
      },
      error: (err) => {
        console.error('Poll creation error:', err);
        this.isLoading = false;
        this.errorMessage = 'Something went wrong while creating the poll.';
      },
    });
  }
}
