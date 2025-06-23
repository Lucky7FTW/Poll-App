// src/app/pages/create-poll/create-poll.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, Validators,
  FormArray, ReactiveFormsModule, FormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { take, map, switchMap } from 'rxjs/operators';

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
  /* ── DI ── */
  private fb   = inject(FormBuilder);
  private ps   = inject(PollService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /* ── UI labels / state ── */
  private readonly _edit = signal(false);
  readonly editMode   = this._edit.asReadonly();
  readonly titleText  = computed(() => this.editMode() ? 'Edit Poll' : 'Create a New Poll');
  readonly submitText = computed(() => this.editMode() ? 'Save Changes' : 'Create Poll');
  readonly loadingTxt = computed(() => this.editMode() ? 'Saving…' : 'Creating Poll…');

  /* ── Form ── */
  pollForm: FormGroup = this.fb.group({
    title:         ['', [Validators.required, Validators.maxLength(120)]],
    description:   ['', [Validators.maxLength(500)]],
    allowMultiple: [false],
    isPrivate:     [false],
    publicResults: [false],
    options:       this.fb.array([], Validators.minLength(2)),
    startDate:     [{ value: null, disabled: false }],
    endDate:       [{ value: null, disabled: false }],
  });

  /* ── view-state ── */
  isLoading = false;
  errorMessage: string | null = null;
  private pollId!: string;      // populated only in edit mode

  /* ── getters ── */
  get options(): FormArray { return this.pollForm.get('options') as FormArray; }

  /* ── component init ── */
  ngOnInit() {
    this.route.queryParamMap.pipe(take(1)).subscribe(q => {
      const id = q.get('edit');
      if (id) {
        this._edit.set(true);
        this.pollId = id;
        this.loadPoll(id);
      } else {
        this.addOption();
        this.addOption();
      }
    });
  }

  /* ── load existing poll ── */
  private loadPoll(id: string) {
    this.isLoading = true;
    this.ps.getPollById(id).pipe(take(1)).subscribe(
      poll => {
        if (!poll) { this.finishWithError('Poll not found.'); return; }
        if (this.auth.user?.email !== poll.createdBy) {
          this.finishWithError('Not allowed to edit this poll.');
          this.router.navigate(['/poll', id]);
          return;
        }

        this.pollForm.patchValue({
          title:         poll.title,
          description:   poll.description ?? '',
          isPrivate:     poll.isPrivate ?? false,
          allowMultiple: poll.allowMultiple ?? false,
          publicResults: poll.publicResults ?? false,
          startDate:     poll.startDate ?? null,
          endDate:       poll.endDate ?? null,
        });

        /* rebuild options */
        this.options.clear();
        (poll.options?.length ? poll.options : [{ text: '' }, { text: '' }])
          .forEach(o =>
            this.options.push(this.fb.group({ text: [o.text, Validators.required] }))
          );

        this.isLoading = false;
      },
      err => this.finishWithError(err.message ?? 'Failed to load poll'),
    );
  }

  /* ── option helpers ── */
  private createOption() { return this.fb.group({ text: ['', Validators.required] }); }
  addOption()  { this.options.push(this.createOption()); }
  removeOption(i: number) { if (this.options.length > 2) this.options.removeAt(i); }

  /* ── date-picker helpers ── */
  getMinDateTime(): string {
    return new Date().toISOString().slice(0, 16);   // “YYYY-MM-DDThh:mm”
  }

  getMinEndDateTime(): string {
    const start = this.pollForm.get('startDate')!.value as string | null;
    if (!start) return this.getMinDateTime();
    const min = new Date(start);
    min.setMinutes(min.getMinutes() + 1);           // end must be after start
    return min.toISOString().slice(0, 16);
  }

  /* ── submit ── */
  onSubmit() {
    if (this.pollForm.invalid || this.isLoading) return;
    const raw = this.pollForm.getRawValue();

    /* prefix with “private-” when checkbox ticked */
    let customId: string | undefined;
    if (!this.editMode() && raw.isPrivate) {
      customId = `private-${this.ps.generateNewPollKey()}`;
    }

    const payload: Partial<Poll> = {
      title:         raw.title,
      description:   raw.description,
      isPrivate:     raw.isPrivate,
      publicResults: raw.publicResults,
      allowMultiple: raw.allowMultiple,
      startDate:     raw.startDate ? new Date(raw.startDate).toISOString() : undefined,
      endDate:       raw.endDate   ? new Date(raw.endDate).toISOString()   : undefined,
      options:       raw.options.map((o: { text: string }, i: number) => ({ id: `opt${i}`, text: o.text })),
    };

    this.isLoading = true;
    this.errorMessage = null;

    let req$: Observable<string>;
    if (this.editMode()) {
      req$ = this.ps.editPoll(this.pollId, payload).pipe(map(() => this.pollId));
    } else {
      req$ = this.ps.createPoll(
        { ...payload, createdBy: this.auth.user?.email ?? '', totalVotes: 0 } as Poll,
        customId
      );
    }

    req$
      .pipe(
        switchMap(id => {
          const userId = this.auth.user?.id;
          if (raw.isPrivate && userId) {
            return this.ps.savePrivatePollForUser(userId, id).pipe(map(() => id));
          }
          return of(id);
        }),
        take(1)
      )
      .subscribe({
        next: id => {
          this.isLoading = false;
          if (this.editMode()) {
            this.router.navigate(['/profile'], { queryParams: { tab: 'polls' } });
          } else {
            this.router.navigate(['/poll', id]);
          }
        },
        error: err => this.finishWithError(err.message ?? 'Failed to save poll'),
      });
  }

  /* ── util ── */
  private finishWithError(msg: string) {
    this.errorMessage = msg;
    this.isLoading = false;
  }
}
