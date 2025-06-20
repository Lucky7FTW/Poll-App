// src/app/pages/create-poll/create-poll.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

import { PollService } from '../../services/poll.service';
import { Poll } from '../../models/poll.model';
import { AuthService } from '../../core/authentication/auth.service';

@Component({
  selector: 'app-create-poll',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './create-poll.component.html',
  styleUrls: ['./create-poll.component.css'],
})
export class CreatePollComponent implements OnInit {
  /* ────────────── DI ────────────── */
  private fb          = inject(FormBuilder);
  private pollService = inject(PollService);
  private auth        = inject(AuthService);
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);

  /* ─────────── UI labels & state flags ─────────── */
  private readonly _editMode = signal(false);
  readonly editMode   = this._editMode.asReadonly();
  readonly titleText  = computed(() =>
    this.editMode() ? 'Edit Poll' : 'Create a New Poll');
  readonly submitText = computed(() =>
    this.editMode() ? 'Save Changes' : 'Create Poll');
  readonly loadingTxt = computed(() =>
    this.editMode() ? 'Saving…' : 'Creating Poll…');

  /* ────────────── Form definition ────────────── */
  pollForm: FormGroup = this.fb.group({
    title:         ['', [Validators.required, Validators.maxLength(120)]],
    description:   ['', [Validators.maxLength(500)]],
    allowMultiple: [false],
    isPrivate:     [false],
    publicResults: [false],                                  // ← NEW control
    options:       this.fb.array([], Validators.minLength(2)),
    startDate:     [{ value: null, disabled: false }],
    endDate:       [{ value: null, disabled: false }],
  });

  /* ───────────── UI state ───────────── */
  isLoading     = false;
  errorMessage: string | null = null;
  private pollId: string | null = null;
  startLocked   = false;
  endLocked     = false;

  /* ───────────── getters ───────────── */
  get options(): FormArray { return this.pollForm.get('options') as FormArray; }

  /* ───────────── lifecycle ───────────── */
  ngOnInit(): void {
    this.route.queryParamMap.pipe(take(1)).subscribe(params => {
      const edit = params.get('edit');
      if (edit) {
        this._editMode.set(true);
        this.pollId = edit;
        this.loadPoll(edit);
      } else {
        this.addOption();
        this.addOption();
      }
    });
  }

  /* ───────────── load existing poll ───────────── */
  private loadPoll(id: string): void {
    this.isLoading = true;

    this.pollService.getPollById(id).pipe(take(1)).subscribe(
      (poll: Poll | null) => {
        if (!poll) {
          this.finishWithError('Poll not found.');
          return;
        }

        const user = this.auth.user;
        if (!user || user.email !== poll.createdBy) {
          this.finishWithError('You are not allowed to edit this poll.');
          this.router.navigate(['/poll', poll.id]);
          return;
        }

        const now = Date.now();
        this.startLocked = !!poll.startDate && new Date(poll.startDate).getTime() <= now;
        this.endLocked   = !!poll.endDate   && new Date(poll.endDate).getTime()   <= now;

        this.pollForm.patchValue({
          title:         poll.title,
          description:   poll.description   ?? '',
          isPrivate:     poll.isPrivate     ?? false,
          allowMultiple: poll.allowMultiple ?? false,
          publicResults: poll.publicResults ?? false,         // ← NEW
          startDate:     poll.startDate     ?? null,
          endDate:       poll.endDate       ?? null,
        });

        if (this.startLocked) this.pollForm.get('startDate')!.disable({ emitEvent: false });
        if (this.endLocked)   this.pollForm.get('endDate')!.disable({ emitEvent: false });

        /* rebuild options */
        this.options.clear();
        (poll.options?.length ? poll.options : [{ text: '' }, { text: '' }])
          .forEach(opt =>
            this.options.push(this.fb.group({ text: [opt.text, Validators.required] })));

        this.isLoading = false;
      },
      err => this.finishWithError(err.message ?? 'Failed to load poll'),
    );
  }

  /* ────────── option helpers ────────── */
  private createOption() { return this.fb.group({ text: ['', Validators.required] }); }
  addOption(): void { this.options.push(this.createOption()); }
  removeOption(i: number): void { if (this.options.length > 2) this.options.removeAt(i); }

  /* ────────── date helpers ────────── */
  getMinDateTime(): string { return new Date().toISOString().slice(0, 16); }
  getMinEndDateTime(): string {
    const start = this.pollForm.get('startDate')!.value as string | null;
    if (!start) return this.getMinDateTime();
    const min = new Date(start); min.setMinutes(min.getMinutes() + 1);
    return min.toISOString().slice(0, 16);
  }

  /* ────────── submit handler ────────── */
  onSubmit(): void {
    if (this.pollForm.invalid || this.isLoading) return;

    const raw = this.pollForm.getRawValue();

    const pollPayload: Partial<Poll> = {
      title:         raw.title,
      description:   raw.description,
      isPrivate:     raw.isPrivate,
      publicResults: raw.publicResults,                         // ← NEW
      allowMultiple: raw.allowMultiple,
      startDate:     raw.startDate ? new Date(raw.startDate).toISOString() : undefined,
      endDate:       raw.endDate   ? new Date(raw.endDate).toISOString()   : undefined,
      options:       raw.options.map((o: { text: string }, i: number) =>
                       ({ id: `opt${i}`, text: o.text })),
    };

    this.isLoading = true;
    this.errorMessage = null;

    let request$: Observable<string | void>;
    if (this.editMode() && this.pollId) {
      request$ = this.pollService.editPoll(this.pollId, pollPayload);
    } else {
      request$ = this.pollService.createPoll({
        ...pollPayload,
        createdBy:  this.auth.user?.email ?? '',
        totalVotes: 0,
      } as Poll);
    }

    request$.pipe(take(1)).subscribe(
      result => {
        this.isLoading = false;
        if (this.editMode()) {
          this.router.navigate(['/profile'], { queryParams: { tab: 'polls' } });
        } else {
          const id = typeof result === 'string' ? result : '';
          this.router.navigate(['/poll', id]);
        }
      },
      err => this.finishWithError(err.message ?? 'Failed to save poll'),
    );
  }

  /* ────────── utilities ────────── */
  private finishWithError(msg: string): void {
    this.errorMessage = msg;
    this.isLoading = false;
  }
}
