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
import { v4 as uuidv4 } from 'uuid';

import { PollService } from '../../services/poll.service';
import { Poll } from '../../models/poll.model';
import { AuthService } from '../../core/authentication/auth.service';

@Component({
  selector: 'app-create-poll',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-poll.component.html',
  styleUrl: './create-poll.component.css',
})
export class CreatePollComponent {
  /* ─────────────────── DI ─────────────────── */
  private fb          = inject(FormBuilder);
  private router      = inject(Router);
  private pollService = inject(PollService);
  private authService = inject(AuthService);

  /* ────────────────── form ────────────────── */
  pollForm: FormGroup = this.fb.group(
    {
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: [''],
      options: this.fb.array(
        [this.createOption(), this.createOption()],
        Validators.minLength(2)
      ),
      allowMultiple: [false],
      isPrivate: [false],
      startDate: [null],         // ISO string via datetime-local
      endDate: [null],
    },
    { validators: this.dateRangeValidator.bind(this) }
  );

  /* ────────────────── ui state ────────────────── */
  isLoading   = false;
  errorMessage = '';

  /* ───────── getters ───────── */
  get options() {
    return this.pollForm.get('options') as FormArray;
  }

  /* ───────── helpers ───────── */
  private createOption() {
    return this.fb.group({ text: ['', Validators.required] });
  }

  addOption() {
    this.options.push(this.createOption());
  }
  removeOption(i: number) {
    this.options.removeAt(i);
  }

  /* ===== date logic ===== */
  private dateRangeValidator(form: FormGroup) {
    const startRaw = form.get('startDate')!.value as string | null;
    const endRaw   = form.get('endDate')!.value   as string | null;

    const now = new Date();

    /* only start typed */
    if (startRaw && !endRaw) {
      const start = new Date(startRaw);
      return start < now ? { startDateInPast: true } : null;
    }

    /* only end typed */
    if (!startRaw && endRaw) {
      const end = new Date(endRaw);
      return end < now ? { endDateInPast: true } : null;
    }

    /* both typed */
    if (startRaw && endRaw) {
      const start = new Date(startRaw);
      const end   = new Date(endRaw);

      if (start < now)       return { startDateInPast: true };
      if (end   < start)     return { endDateBeforeStart: true };
      return null;
    }

    return null; // neither field set
  }

  getMinDateTime(): string {
    return new Date().toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
  }
  getMinEndDateTime(): string {
    const startRaw = this.pollForm.get('startDate')!.value as string | null;
    if (!startRaw) return this.getMinDateTime();

    const min = new Date(startRaw);
    min.setMinutes(min.getMinutes() + 1); // at least 1 min later
    return min.toISOString().slice(0, 16);
  }

  /* ───────── submit ───────── */
  onSubmit() {
    if (this.pollForm.invalid) return;

    this.isLoading   = true;
    this.errorMessage = '';

    const currentUser = this.authService.user;
    if (!currentUser) {
      this.finishWithError('You must be logged in to create a poll.');
      return;
    }

    const fv = this.pollForm.value;
    const isPrivate     = fv.isPrivate;
    const customPollId  = isPrivate ? `private-${uuidv4().slice(0, 10)}` : undefined;

    const newPoll: Poll = {
      id: customPollId ?? '',               // Firestore will generate if ''
      title: fv.title,
      description: fv.description,
      options: fv.options.map(
        (o: { text: string }, i: number) => ({ id: `opt-${i}`, text: o.text })
      ),
      allowMultiple: fv.allowMultiple,
      isPrivate,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.email,
      totalVotes: 0,
      startDate: fv.startDate ?? null,
      endDate:   fv.endDate   ?? null,
    };

    this.pollService.createPoll(newPoll, customPollId).subscribe({
      next: (pollId) => {
        if (isPrivate) {
          this.pollService
            .savePrivatePollForUser(currentUser.id, pollId)
            .subscribe({
              next: () => this.navigateDone(pollId),
              error: () => this.navigateDone(pollId, true),
            });
        } else {
          this.navigateDone(pollId);
        }
      },
      error: () => this.finishWithError('Something went wrong while creating the poll.'),
    });
  }

  /* ───────── util ───────── */
  private navigateDone(id: string, warn = false) {
    if (warn)
      this.errorMessage = 'Poll created but not linked to your account.';
    this.isLoading = false;
    this.router.navigate(['/poll', id]);
  }

  private finishWithError(msg: string) {
    this.errorMessage = msg;
    this.isLoading = false;
  }
}
