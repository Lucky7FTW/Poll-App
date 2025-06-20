// src/app/pages/user-profile/user-polls.component.ts
import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { Poll } from '../../../models/poll.model';
import { PollService } from '../../../services/poll.service';
import { AuthService } from '../../../core/authentication/auth.service';

@Component({
  selector: 'app-user-polls',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './user-polls.component.html',
  styleUrls: ['./user-polls.component.css'],
})
export class UserPollsComponent {
  /* ──────────────────── DI ──────────────────── */
  private pollService = inject(PollService);
  private authService = inject(AuthService);
  private router      = inject(Router);

  /* ────────────────── UI state ───────────────── */
  loading     = true;
  deleteError: string | null = null;
  deletingId: string | null  = null;

  userPolls: Poll[] = [];

  /* filter / sort */
  selectedFilter: 'all' | 'active' | 'inactive' | 'closed' = 'all';
  searchTerm = '';
  selectedSort:
    | 'date-desc' | 'date-asc'
    | 'name-asc'  | 'name-desc'
    | 'votes-desc'| 'votes-asc' = 'date-desc';

  /* holds the id of the poll we want to edit */
  private readonly _editId = signal<string | null>(null);

  constructor() {
    /* fetch the current user’s polls */
    const user = this.authService.user;
    (user
      ? this.pollService.getPollsByUser(user.email)
      : of([]))
      .pipe(
        tap(polls => {
          this.userPolls = polls;
          this.loading   = false;
        })
      )
      .subscribe();

    /* navigate whenever _editId receives a value */
    effect(() => {
      const id = this._editId();
      if (id) {
        this.router.navigate(['/create'], { queryParams: { edit: id } });
        this._editId.set(null);  // reset so the effect can trigger again
      }
    });
  }

  /* ───────────── template-facing helpers ───────────── */
  get filteredPolls(): Poll[] {
    let list = this.pollService.filterByStatus(this.userPolls, this.selectedFilter);
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase().trim();
      list = list.filter(p => p.title.toLowerCase().includes(q));
    }
    return this.pollService.sortPolls(list, this.selectedSort);
  }

  isPollActive       = (p: Poll) => this.pollService.isPollActive(p);
  getPollStatus      = (p: Poll) => this.pollService.getPollStatus(p);
  getPollStatusClass = (p: Poll) => this.pollService.getPollStatusClass(p);

  /** edit button only for upcoming polls */
  canEditPoll(p: Poll): boolean {
    return this.getPollStatus(p) === 'Upcoming';  // adjust if your label differs
  }

  /** triggered by the Edit button */
  editPoll(id: string): void {
    this._editId.set(id);
  }

  /* ─────────────── delete helpers ─────────────── */
  canDeletePoll(p: Poll): boolean {
    return this.getPollStatus(p) !== 'Active';
  }

  deletePoll(p: Poll): void {
    if (!this.canDeletePoll(p)) return;
    if (!confirm(`Delete poll “${p.title}”? This cannot be undone.`)) return;

    this.deletingId  = p.id;
    this.deleteError = null;

    this.pollService.deletePoll(p.id).subscribe({
      next: () => {
        this.userPolls = this.userPolls.filter(x => x.id !== p.id);
        this.deletingId = null;
      },
      error: err => {
        this.deleteError = err.message ?? 'Failed to delete poll';
        this.deletingId = null;
      }
    });
  }
}
