import { Component, OnInit, inject } from '@angular/core';
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
  styleUrl: './create-poll.component.css',
})
export class CreatePollComponent implements OnInit {
  /* ─────────────────── DI ─────────────────── */
  private fb          = inject(FormBuilder);
  private pollService = inject(PollService);
  private auth        = inject(AuthService);
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);

  /* ────────────────── form ────────────────── */
  pollForm: FormGroup = this.fb.group({
    title:       ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(500)]],
    allowMultiple: [false],
    isPrivate:   [false],
    options:     this.fb.array([], Validators.minLength(2)),
    startDate:   [null],
    endDate:     [null],
  });

  /* ────────────────── ui state ────────────────── */
  isLoading   = false;
  errorMessage: string | null = null;
  editMode  = false;
  private pollId: string | null = null;

  /* ------------------------------- getters ------------------------------- */
  get options(): FormArray {
    return this.pollForm.get('options') as FormArray;
  }

  /* --------------------------- lifecycle --------------------------- */
  ngOnInit(): void {
    this.route.queryParamMap.pipe(take(1)).subscribe(params => {
      const edit = params.get('edit');
      if (edit) {
        this.editMode = true;
        this.pollId   = edit;
        this.loadPoll(edit);
      } else {
        // seed two blank options for new poll
        this.addOption();
        this.addOption();
      }
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                              LOAD EXISTING POLL                            */
  /* -------------------------------------------------------------------------- */
  private loadPoll(id: string): void {
    this.isLoading = true;

    this.pollService.getPollById(id).pipe(take(1)).subscribe(
      (poll: Poll | null) => {
        if (!poll) {
          this.finishWithError('Poll not found.');
          return;
        }

        const currentUser = this.auth.user;
        if (!currentUser || currentUser.email !== poll.createdBy) {
          this.finishWithError('You are not allowed to edit this poll.');
          this.router.navigate(['/poll', poll.id]);
          return;
        }

        this.pollForm.patchValue({
          title:       poll.title,
          description: poll.description ?? '',
          isPrivate:   poll.isPrivate ?? false,
          allowMultiple: poll.allowMultiple ?? false,
          startDate:   poll.startDate ?? null,
          endDate:     poll.endDate   ?? null,
        });

        this.options.clear();
        if (poll.options?.length) {
          poll.options.forEach((opt: { id?: string; text: string }) => {
            const grp = this.fb.group({ text: [opt.text, Validators.required] });
            this.options.push(grp);
          });
        } else {
          this.addOption();
          this.addOption();
        }

        this.isLoading = false;
      },
      (err: any) => this.finishWithError(err.message ?? 'Failed to load poll'),
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                               OPTION HELPERS                               */
  /* -------------------------------------------------------------------------- */
  private createOption() {
    return this.fb.group({ text: ['', Validators.required] });
  }

  addOption(): void {
    this.options.push(this.createOption());
  }

  removeOption(index: number): void {
    if (this.options.length > 2) this.options.removeAt(index);
  }

  /* -------------------------------------------------------------------------- */
  /*                             DATE HELPERS                                   */
  /* -------------------------------------------------------------------------- */
  getMinDateTime(): string {
    return new Date().toISOString().slice(0, 16);
  }

  getMinEndDateTime(): string {
    const startRaw = this.pollForm.get('startDate')!.value as string | null;
    if (!startRaw) return this.getMinDateTime();
    const min = new Date(startRaw);
    min.setMinutes(min.getMinutes() + 1);
    return min.toISOString().slice(0, 16);
  }

  /* -------------------------------------------------------------------------- */
  /*                             SUBMIT HANDLER                                 */
  /* -------------------------------------------------------------------------- */
  onSubmit(): void {
    if (this.pollForm.invalid || this.isLoading) return;

    const fv: any = this.pollForm.value;

    const pollPayload: Partial<Poll> = {
      title:       fv.title,
      description: fv.description,
      isPrivate:   fv.isPrivate,
      allowMultiple: fv.allowMultiple,
      startDate:   fv.startDate ? new Date(fv.startDate).toISOString() : undefined,
      endDate:     fv.endDate   ? new Date(fv.endDate).toISOString()   : undefined,
      options:     fv.options.map((o: { text: string }, idx: number) => ({ id: `opt${idx}`, text: o.text })),
    };

    this.isLoading = true;
    this.errorMessage = null;

    let request$: Observable<string | void>;
    if (this.editMode && this.pollId) {
      request$ = this.pollService.editPoll(this.pollId, pollPayload);
    } else {
      request$ = this.pollService.createPoll({
        ...pollPayload,
        createdBy: this.auth.user?.email ?? '',
        totalVotes: 0,
      } as Poll);
    }

    request$.pipe(take(1)).subscribe(
      (result: any) => {
        const navId = this.pollId ?? (typeof result === 'string' ? result : '');
        this.isLoading = false;
        this.router.navigate(['/poll', navId]);
      },
      (err: any) => this.finishWithError(err.message ?? 'Failed to save poll'),
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                               UTILITIES                                    */
  /* -------------------------------------------------------------------------- */
  private finishWithError(msg: string): void {
    this.errorMessage = msg;
    this.isLoading = false;
  }
}
