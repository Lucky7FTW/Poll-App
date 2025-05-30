import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
  ReactiveFormsModule
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
  styleUrls: ['./create-poll.component.css']   // ← plural
})
export class CreatePollComponent {
  /* ──────────────────────────── DI ──────────────────────────── */
  private fb          = inject(FormBuilder);
  private router      = inject(Router);
  private pollService = inject(PollService);
  private authService = inject(AuthService);
  private textService = inject(TextService);

  /** i18n bundle used in the template */
  readonly texts$: Observable<PollTexts> =
    this.textService.section<PollTexts>('poll');

  /* ───────────────────── Date-range validator ────────────────── */
  private readonly dateRangeValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const startRaw = control.get('startDate')?.value as string | null;
    const endRaw   = control.get('endDate')  ?.value as string | null;

    // nothing entered → valid
    if (!startRaw && !endRaw) return null;

    const now   = new Date();
    const start = startRaw ? new Date(startRaw) : null;
    const end   = endRaw   ? new Date(endRaw)   : null;

    if (start && start < now)               return { startDateInPast: true };
    if (start && end && end <= start)       return { endDateBeforeStart: true };
    return null;
  };

  /* ─────────────────────────── FORM ──────────────────────────── */
  pollForm: FormGroup = this.fb.group(
    {
      title:       ['', [Validators.required, Validators.minLength(5)]],
      description: [''],

      /** at least two options */
      options: this.fb.array(
        [this.createOption(), this.createOption()],
        Validators.minLength(2)
      ),

      /* schedule */
      startDate: [null],
      endDate:   [null],

      /* settings */
      allowMultiple: [false],
      isPrivate:     [false]
    },
    { validators: this.dateRangeValidator }
  );

  /* ───────────────────────── State ───────────────────────────── */
  isLoading   = false;
  errorMessage = '';

  /* typed helper */
  get options(): FormArray<FormGroup> {
    return this.pollForm.get('options') as FormArray<FormGroup>;
  }

  /* ─────────────────────── Helpers ───────────────────────────── */
  /** yyyy-mm-dd today – used as min value for start date */
  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /** yyyy-mm-dd start+1 or today – min value for end date */
  getMinEndDate(): string {
    const raw = this.pollForm.get('startDate')!.value;
    if (!raw) return this.getMinDate();
    const d = new Date(raw);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  /* option factory */
  private createOption(): FormGroup {
    return this.fb.group({ text: ['', Validators.required] });
  }

  addOption(): void   { this.options.push(this.createOption()); }
  removeOption(i: number): void { this.options.removeAt(i); }

  /* ───────────────────────── SUBMIT ──────────────────────────── */
  onSubmit(): void {
    if (this.pollForm.invalid) return;

    this.isLoading   = true;
    this.errorMessage = '';

    const currentUser = this.authService.user.getValue();
    if (!currentUser) {
      this.isLoading   = false;
      this.errorMessage = 'You must be logged in to create a poll.'; // already translated
      return;
    }

    /* pull values out of the form */
    const {
      title,
      description,
      options,
      allowMultiple,
      isPrivate,
      startDate,
      endDate
    } = this.pollForm.value;

    /* custom ID for private polls */
    const customId = isPrivate ? `private-${uuidv4().slice(0, 10)}` : null;

    /* build the Poll object */
    const newPoll: Poll = {
      id: customId ?? '',
      title,
      description,
      options: options.map((o: { text: string }, i: number) => ({
        id: `opt-${i}`,
        text: o.text
      })),
      allowMultiple,
      isPrivate,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate:   endDate   ? new Date(endDate).toISOString()   : undefined,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.email,
      totalVotes: 0
    };

    /* save poll */
    this.pollService.createPoll(newPoll, customId ?? undefined).subscribe({
      next: pollId => {
        if (isPrivate) {
          /* link private poll to user */
          this.pollService
            .savePrivatePollForUser(currentUser.id, pollId)
            .subscribe({
              next: () => {
                this.isLoading = false;
                this.router.navigate(['/poll', pollId]);
              },
              error: err => {
                console.error('Poll created but link failed:', err);
                this.errorMessage =
                  'Poll was created but not linked to your account.';
                this.isLoading = false;
                this.router.navigate(['/poll', pollId]);
              }
            });
        } else {
          this.isLoading = false;
          this.router.navigate(['/poll', pollId]);
        }
      },
      error: err => {
        console.error('Poll creation error:', err);
        this.errorMessage =
          'Something went wrong while creating the poll.';
        this.isLoading = false;
      }
    });
  }
}
