import { Injectable, inject } from '@angular/core';
import {
  Database,
  ref,
  push,
  set,
  update,
  get,
  onValue,
} from '@angular/fire/database';
import { Observable, from, map, combineLatest, of, switchMap } from 'rxjs';

import { Poll } from '../models/poll.model';
import { AuthService } from '../core/authentication/auth.service';

@Injectable({ providedIn: 'root' })
export class PollService {
  private db   = inject(Database);
  private auth = inject(AuthService);

  private pollPath = 'polls';
  private votePath = 'votes';

  /* ──────────────────────────────────────────────────────────────── */
  /*                         READ OPERATIONS                         */
  /* ──────────────────────────────────────────────────────────────── */

  /** Single poll (adds `hasVoted` if a user is logged in) */
  getPollById(id: string): Observable<Poll | null> {
    const pollRef = ref(this.db, `${this.pollPath}/${id}`);

    return from(get(pollRef)).pipe(
      map(snap => (snap.exists() ? { id, ...(snap.val() as any) } : null)),
      switchMap(poll => {
        if (!poll) return of(null);
        const userId = this.auth.user?.id;
        if (!userId) return of(poll);
        return this.checkIfUserVoted(id, userId).pipe(
          map(voted => ({ ...poll, hasVoted: voted }))
        );
      })
    );
  }

  /** All polls created by the given e-mail (adds `hasVoted`) */
  getPollsByUser(createdBy: string): Observable<Poll[]> {
    return this.getAllPolls().pipe(
      map(list => list.filter(p => p.createdBy === createdBy))
    );
  }

  /** Live list of *all* polls (adds `hasVoted`) */
  getAllPolls(): Observable<Poll[]> {
    const pollsRef = ref(this.db, this.pollPath);

    return new Observable<Poll[]>(observer => {
      const unsubscribe = onValue(
        pollsRef,
        snap => {
          const raw: Poll[] = [];
          snap.forEach(child => {
            raw.push({ id: child.key!, ...child.val() });
            return false;
          });

          /* augment with hasVoted */
          this.attachHasVoted(raw).subscribe({
            next: pollsWithFlag => observer.next(pollsWithFlag),
            error: err => observer.error(err),
          });
        },
        err => observer.error(err)
      );

      return () => unsubscribe();
    });
  }

  /** Has the **current** user voted on this poll? */
  checkIfUserVoted(pollId: string, userId: string): Observable<boolean> {
    const voteRef = ref(this.db, `${this.votePath}/${pollId}/${userId}`);
    return from(get(voteRef)).pipe(map(snap => snap.exists()));
  }

  /* ──────────────────────────────────────────────────────────────── */
  /*                    CREATE / UPDATE / VOTING                     */
  /* ──────────────────────────────────────────────────────────────── */

  createPoll(
    poll: Omit<Poll, 'id'> & Partial<Pick<Poll, 'id'>>,
    customId?: string,
  ): Observable<string> {
    const pollId  = customId ?? push(ref(this.db, this.pollPath)).key!;
    const pollRef = ref(this.db, `${this.pollPath}/${pollId}`);
    return from(set(pollRef, { ...poll, id: pollId })).pipe(map(() => pollId));
  }

  updatePoll(id: string, data: Partial<Poll>): Observable<void> {
    return from(update(ref(this.db, `${this.pollPath}/${id}`), data));
  }
  editPoll = this.updatePoll;   // alias

  submitVote(
    pollId: string,
    userId: string,
    optionIds: string[],
  ): Observable<void> {
    const voteRef = ref(this.db, `${this.votePath}/${pollId}/${userId}`);
    const pollRef = ref(this.db, `${this.pollPath}/${pollId}`);
    const voteData = { optionIds, createdAt: new Date().toISOString() };

    return new Observable<void>(observer => {
      set(voteRef, voteData)
        .then(() => get(pollRef))
        .then(snap => {
          const poll     = snap.val();
          const newTotal = (poll?.totalVotes || 0) + 1;
          return update(pollRef, { totalVotes: newTotal });
        })
        .then(() => { observer.next(); observer.complete(); })
        .catch(err => observer.error(err));
    });
  }

  deletePoll(pollId: string): Observable<void> {
    return from(set(ref(this.db, `${this.pollPath}/${pollId}`), null));
  }

  /* ----------------------- Private / Saved Polls ----------------------- */

  getPrivatePollsByUser(userEmail: string): Observable<Poll[]> {
    return this.getAllPolls().pipe(
      map(polls => polls.filter(p => p.isPrivate && p.createdBy === userEmail)),
    );
  }

  savePrivatePollForUser(userId: string, pollId: string): Observable<void> {
    return from(set(ref(this.db, `savedPrivatePolls/${userId}/${pollId}`), true));
  }

  getSavedPrivatePollIds(userId: string): Observable<string[]> {
    const userRef = ref(this.db, `savedPrivatePolls/${userId}`);
    return new Observable<string[]>(observer => {
      const unsub = onValue(
        userRef,
        snap => observer.next(snap.val() ? Object.keys(snap.val()) : []),
        err  => observer.error(err),
      );
      return () => unsub();
    });
  }

  /* ──────────────────────────────────────────────────────────────── */
  /*      Filtering / Sorting / Status (unchanged from your file)     */
  /* ──────────────────────────────────────────────────────────────── */

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
    const hours = Math.floor((diffSec % 86_400) / 3_600);
    const mins  = Math.floor((diffSec % 3_600)  / 60);

    if (days  > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  filterByStatus(
    polls: Poll[],
    status: 'all' | 'active' | 'inactive' | 'closed',
  ): Poll[] {
    switch (status) {
      case 'active':
        return polls.filter(p => this.isPollActive(p));
      case 'inactive':
        return polls.filter(p =>
          !this.isPollActive(p) && this.getPollStatus(p) === 'Upcoming');
      case 'closed':
        return polls.filter(p => this.getPollStatus(p) === 'Ended');
      default:
        return polls;
    }
  }

  sortPolls(
    polls: Poll[],
    mode:
      | 'date-desc' | 'date-asc'
      | 'name-asc'  | 'name-desc'
      | 'votes-desc'| 'votes-asc',
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

  /* ──────────────────────────────────────────────────────────────── */
  /*                       PRIVATE HELPER                             */
  /* ──────────────────────────────────────────────────────────────── */

  /**
   * Adds `hasVoted` to each poll for the **current** user.
   * If no user is logged in, returns the list unchanged.
   */
  private attachHasVoted(polls: Poll[]): Observable<Poll[]> {
    const userId = this.auth.user?.id;
    if (!userId || !polls.length) return of(polls);

    const checks = polls.map(p =>
      this.checkIfUserVoted(p.id, userId).pipe(
        map(voted => ({ ...p, hasVoted: voted }))
      )
    );

    return combineLatest(checks);
  }
}
