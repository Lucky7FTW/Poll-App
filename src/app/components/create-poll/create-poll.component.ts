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
import { Poll } from '../../models/poll.model';
import { AuthService } from '../../core/authentication/auth.service';
import { v4 as uuidv4 } from 'uuid';
import { Observable } from 'rxjs';
import { TextService } from '../../services/text.service';
import { PollTexts } from '../../models/poll-texts.interface'; // adjust path if needed

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
  private textService = inject(TextService);

  readonly texts$: Observable<PollTexts> = this.textService.section<PollTexts>('poll');

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

  get options(): FormArray<FormGroup> {
    return this.pollForm.get('options') as FormArray<FormGroup>;
  }

  createOption(): FormGroup {
    return this.fb.group({
      text: ['', Validators.required],
    });
  }

  addOption(): void {
    this.options.push(this.createOption());
  }

  removeOption(index: number): void {
    this.options.removeAt(index);
  }

  onSubmit(): void {
    if (this.pollForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const currentUser = this.authService.user.getValue();

    if (!currentUser) {
      this.isLoading = false;
      // If you want a translated error here, use the texts$ observable in the template
      this.errorMessage = 'You must be logged in to create a poll.';
      return;
    }

    const formValue = this.pollForm.value;

    const isPrivate = formValue.isPrivate;
    const customPollId = isPrivate ? `private-${uuidv4().slice(0, 10)}` : null;

    const newPoll: Poll = {
      id: customPollId ?? '',
      title: formValue.title,
      description: formValue.description,
      options: formValue.options.map((opt: { text: string }, i: number) => ({
        id: 'opt-' + i,
        text: opt.text,
      })),
      allowMultiple: formValue.allowMultiple,
      isPrivate,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.email,
      totalVotes: 0,
    };

    this.pollService.createPoll(newPoll, customPollId!).subscribe({
      next: (pollId) => {
        if (isPrivate) {
          this.pollService.savePrivatePollForUser(currentUser.id, pollId).subscribe({
            next: () => {
              this.isLoading = false;
              this.router.navigate(['/poll', pollId]);
            },
            error: (err) => {
              console.error('Poll created, but failed to save private link:', err);
              this.errorMessage = 'Poll was created but not linked to your account.';
              this.isLoading = false;
              this.router.navigate(['/poll', pollId]);
            },
          });
        } else {
          this.isLoading = false;
          this.router.navigate(['/poll', pollId]);
        }
      },
      error: (err) => {
        console.error('Poll creation error:', err);
        this.isLoading = false;
        this.errorMessage = 'Something went wrong while creating the poll.';
      },
    });
  }
}
