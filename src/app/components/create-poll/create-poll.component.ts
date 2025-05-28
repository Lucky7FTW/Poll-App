import { Component, inject } from '@angular/core';
import {
  FormArray, FormBuilder, FormGroup,
  Validators, ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { PollService } from '../../services/poll.service';
import { Poll } from '../../models/poll.model';
import { AuthService } from '../../core/authentication/auth.service';
import { TextService } from '../../services/text.service';   // adjust path if needed

interface PollTexts {
  title: string; questionLabel: string; questionPh: string; questionError: string;
  descriptionLabel: string; descriptionPh: string;
  optionsLabel: string; addOption: string; optionPh: string; atLeastTwo: string;
  settingsLabel: string; allowMultiple: string; isPrivate: string;
  submitIdle: string; submitBusy: string;
  mustLogin: string; genericError: string;
}


@Component({
  selector: 'app-create-poll',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-poll.component.html',
  styleUrls: ['./create-poll.component.css']          // plural!
})
export class CreatePollComponent {
  /* ── dependencies ── */
  private fb          = inject(FormBuilder);
  private router      = inject(Router);
  private pollService = inject(PollService);
  private authService = inject(AuthService);
  private textService = inject(TextService);

  /* ── i18n stream ── */
  readonly texts$: Observable<PollTexts> =
    this.textService.section<PollTexts>('poll');

  /* ── reactive form ── */
  pollForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: [''],
    options: this.fb.array(
      [this.createOption(), this.createOption()],
      Validators.minLength(2)
    ),
    allowMultiple: [false],
    isPrivate:     [false]
  });

  isLoading    = false;
  errorMessage = '';

  /* helpers */
  get options(): FormArray { return this.pollForm.get('options') as FormArray; }
  private createOption() { return this.fb.group({ text: ['', Validators.required] }); }
  addOption() { this.options.push(this.createOption()); }
  removeOption(i: number) { this.options.removeAt(i); }

  /* submit */
  onSubmit() {
    if (this.pollForm.invalid) return;
    this.isLoading = true; this.errorMessage = '';

    const user = this.authService.user.getValue();
    if (!user) { return this.fail('mustLogin'); }

    const isPrivate = formValue.isPrivate;
    const customPollId = isPrivate ? `private-${uuidv4().slice(0, 10)}` : null;

    const newPoll: Poll = {
      id: customPollId ?? '', // dacă nu e privat, id-ul va fi generat în service
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
        // 🔹 Dacă e privat, îl salvăm și în savedPrivatePolls/{userId}/{pollId}
        if (isPrivate) {
          this.pollService
            .savePrivatePollForUser(currentUser.id, pollId)
            .subscribe({
              next: () => {
                this.isLoading = false;
                this.router.navigate(['/poll', pollId]);
              },
              error: (err) => {
                console.error(
                  'Poll created, but failed to save private link:',
                  err
                );
                this.errorMessage =
                  'Poll was created but not linked to your account.';
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
