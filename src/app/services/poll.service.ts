// src/app/services/poll.service.ts
import { Injectable, inject } from '@angular/core';
import {
  Database,
  ref, push, set, update, get, onValue
} from '@angular/fire/database';
import {
  Observable, from, of, map, switchMap, combineLatest
} from 'rxjs';

import { Poll } from '../models/poll.model';
import { AuthService } from '../core/authentication/auth.service';

@Injectable({ providedIn: 'root' })
export class PollService {
  private db   = inject(Database);
  private auth = inject(AuthService);

  private pollPath = 'polls';
  private votePath = 'votes';

  /* ── helper: create push-key ── */
  generateNewPollKey(): string {
    return push(ref(this.db, this.pollPath)).key!;
  }

  /* ── helper: encode a string for use as a Firebase key ── */
  private encodeKey(raw: string): string {
    return raw.replace(/[.#$/\[\]]/g, '_');
  }

  /* ── READ: single poll ── */
  getPollById(id: string): Observable<Poll | null> {
    const pollRef = ref(this.db, `${this.pollPath}/${id}`);
    return from(get(pollRef)).pipe(
      map(snap => (snap.exists() ? { id, ...(snap.val() as any) } : null)),
      switchMap(poll => {
        if (!poll) return of(null);
        const email = this.auth.user?.email;
        if (!email) return of(poll);
        return this.checkIfUserVoted(id, email).pipe(
          map(voted => ({ ...poll, hasVoted: voted }))
        );
      })
    );
  }

  /* ── READ: by creator e-mail ── */
  getPollsByUser(createdBy: string): Observable<Poll[]> {
    return this.getAllPolls().pipe(
      map(list => list.filter(p => p.createdBy === createdBy))
    );
  }

  /* ── READ: live list ── */
  getAllPolls(): Observable<Poll[]> {
    const pollsRef = ref(this.db, this.pollPath);
    return new Observable<Poll[]>(observer => {
      const unsub = onValue(
        pollsRef,
        snap => {
          const arr: Poll[] = [];
          snap.forEach(c => { arr.push({ id: c.key!, ...c.val() }); return false; });
          this.attachHasVoted(arr).subscribe({
            next: p => observer.next(p),
            error: e => observer.error(e)
          });
        },
        err => observer.error(err)
      );
      return () => unsub();
    });
  }

  /* ── CREATE / EDIT / DELETE ── */
  createPoll(
    poll: Omit<Poll, 'id'> & Partial<Pick<Poll, 'id'>>,
    customId?: string
  ): Observable<string> {
    const pollId  = customId ?? push(ref(this.db, this.pollPath)).key!;
    const pollRef = ref(this.db, `${this.pollPath}/${pollId}`);
    return from(set(pollRef, { ...poll, id: pollId })).pipe(map(() => pollId));
  }

  updatePoll(id: string, data: Partial<Poll>): Observable<void> {
    return from(update(ref(this.db, `${this.pollPath}/${id}`), data));
  }
  editPoll = this.updatePoll;

  deletePoll(id: string): Observable<void> {
    return from(set(ref(this.db, `${this.pollPath}/${id}`), null));
  }

  /* ── VOTING ── */
  checkIfUserVoted(pollId: string, email: string): Observable<boolean> {
    const safeEmail = this.encodeKey(email);
    return from(get(ref(this.db, `${this.votePath}/${pollId}/${safeEmail}`)))
      .pipe(map(snap => snap.exists()));
  }

  submitVote(pollId: string, email: string, optionIds: string[]): Observable<void> {
    const safeEmail = this.encodeKey(email);
    const voteRef   = ref(this.db, `${this.votePath}/${pollId}/${safeEmail}`);
    const pollRef   = ref(this.db, `${this.pollPath}/${pollId}`);
    const voteData  = { optionIds, createdAt: new Date().toISOString() };

    return new Observable<void>(o => {
      set(voteRef, voteData)
        .then(() => get(pollRef))
        .then(snap => {
          const poll = snap.val();
          const newTotal = (poll?.totalVotes || 0) + 1;
          return update(pollRef, { totalVotes: newTotal });
        })
        .then(() => { o.next(); o.complete(); })
        .catch(err => o.error(err));
    });
  }

  /* ── SAVED-PRIVATE helpers ── */
  savePrivatePollForUser(userId: string, pollId: string): Observable<void> {
    return from(set(ref(this.db, `savedPrivatePolls/${userId}/${pollId}`), true));
  }

  getSavedPrivatePollIds(userId: string): Observable<string[]> {
    const path = ref(this.db, `savedPrivatePolls/${userId}`);
    return new Observable<string[]>(o => {
      const unsub = onValue(
        path,
        snap => o.next(snap.val() ? Object.keys(snap.val()) : []),
        err  => o.error(err)
      ); return () => unsub();
    });
  }

  /* ── UI status helpers ── */
  isPollActive(poll: Poll): boolean {
    const now = new Date();
    if (poll.startDate && new Date(poll.startDate) > now) return false;
    if (poll.endDate   && new Date(poll.endDate)   < now) return false;
    return true;
  }

  getPollStatus(poll: Poll): 'Upcoming' | 'Active' | 'Ended' {
    const now = new Date();
    if (poll.startDate && new Date(poll.startDate) > now) return 'Upcoming';
    if (poll.endDate   && new Date(poll.endDate)   < now) return 'Ended';
    return 'Active';
  }

  getPollStatusClass(poll: Poll): string {
    return `status-${this.getPollStatus(poll).toLowerCase()}`;
  }

  getTimeUntilEnd(poll: Poll): string | null {
    if (!poll.endDate) return null;
    const end = new Date(poll.endDate), now = new Date();
    if (end <= now) return null;

    const diffSec = Math.floor((end.getTime() - now.getTime()) / 1000);
    const days  = Math.floor(diffSec / 86_400);
    const hrs   = Math.floor((diffSec % 86_400) / 3_600);
    const mins  = Math.floor((diffSec % 3_600)  / 60);

    if (days > 0) return `${days}d ${hrs}h`;
    if (hrs  > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  }

  filterByStatus(
    polls: Poll[],
    status: 'all' | 'active' | 'inactive' | 'closed'
  ): Poll[] {
    switch (status) {
      case 'active':   return polls.filter(p => this.isPollActive(p));
      case 'inactive': return polls.filter(p =>
                          !this.isPollActive(p) && this.getPollStatus(p) === 'Upcoming');
      case 'closed':   return polls.filter(p => this.getPollStatus(p) === 'Ended');
      default:         return polls;
    }
  }

  sortPolls(
    polls: Poll[],
    mode: 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'
         | 'votes-desc' | 'votes-asc'
  ): Poll[] {
    return [...polls].sort((a, b) => {
      switch (mode) {
        case 'name-asc':  return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        case 'name-desc': return b.title.localeCompare(a.title, undefined, { sensitivity: 'base' });
        case 'date-asc':  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'date-desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'votes-asc': return (a.totalVotes ?? 0) - (b.totalVotes ?? 0);
        case 'votes-desc':
        default:          return (b.totalVotes ?? 0) - (a.totalVotes ?? 0);
      }
    });
  }

  /* ── internal: add hasVoted flag ── */
  private attachHasVoted(polls: Poll[]): Observable<Poll[]> {
    const email = this.auth.user?.email;
    if (!email || !polls.length) return of(polls);

    const safe = this.encodeKey(email);
    const checks = polls.map(p =>
      from(get(ref(this.db, `${this.votePath}/${p.id}/${safe}`))).pipe(
        map(snap => ({ ...p, hasVoted: snap.exists() }))
      )
    );
    return combineLatest(checks);
  }
}
