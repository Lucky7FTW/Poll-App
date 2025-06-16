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
import { Observable, from, map } from 'rxjs';
import { Poll } from '../models/poll.model';

@Injectable({ providedIn: 'root' })
export class PollService {
  private db = inject(Database);
  private pollPath = 'polls';
  private votePath = 'votes';

  /* ──────────────────────────────────────────────────────────────────────── */
  /*                              READ OPERATIONS                             */
  /* ──────────────────────────────────────────────────────────────────────── */

  getPollById(id: string): Observable<Poll | null> {
    const pollRef = ref(this.db, `${this.pollPath}/${id}`);
    return from(get(pollRef)).pipe(
      map((snap) => (snap.exists() ? { id, ...(snap.val() as any) } : null)),
    );
  }

  /** Returns every poll whose `createdBy` matches the supplied e-mail. */
  getPollsByUser(createdBy: string): Observable<Poll[]> {
    return this.getAllPolls().pipe(
      map((polls) => polls.filter((p) => p.createdBy === createdBy)),
    );
  }

  /** Live list of *all* polls. */
  getAllPolls(): Observable<Poll[]> {
    const pollsRef = ref(this.db, this.pollPath);
    return new Observable<Poll[]>((observer) => {
      const unsubscribe = onValue(
        pollsRef,
        (snap) => {
          const polls: Poll[] = [];
          snap.forEach((child) => {
            polls.push({ id: child.key!, ...child.val() });
            return false;
          });
          observer.next(polls);
        },
        (err) => observer.error(err),
      );
      return () => unsubscribe();
    });
  }

  /** Check if a given user has already voted in `pollId`. */
  checkIfUserVoted(pollId: string, userId: string): Observable<boolean> {
    const voteRef = ref(this.db, `${this.votePath}/${pollId}/${userId}`);
    return from(get(voteRef)).pipe(map((snap) => snap.exists()));
  }

  /* ──────────────────────────────────────────────────────────────────────── */
  /*                            CREATE / UPDATE                              */
  /* ──────────────────────────────────────────────────────────────────────── */

  createPoll(
    poll: Omit<Poll, 'id'> & Partial<Pick<Poll, 'id'>>,
    customId?: string,
  ): Observable<string> {
    const pollId = customId ?? push(ref(this.db, this.pollPath)).key!;
    const pollRef = ref(this.db, `${this.pollPath}/${pollId}`);
    return from(set(pollRef, { ...poll, id: pollId })).pipe(map(() => pollId));
  }

  /** Partially update an existing poll. */
  updatePoll(id: string, data: Partial<Poll>): Observable<void> {
    return from(update(ref(this.db, `${this.pollPath}/${id}`), data));
  }

  /** Alias – clearer when called from components that *edit* a poll. */
  editPoll(id: string, changes: Partial<Poll>): Observable<void> {
    return this.updatePoll(id, changes);
  }

  /* ──────────────────────────── ──────────────────────────────────────────── */
  /*                                 VOTING                                   */
  /* ──────────────────────────────────────────────────────────────────────── */

  submitVote(
    pollId: string,
    userId: string,
    optionIds: string[],
  ): Observable<void> {
    const voteRef = ref(this.db, `${this.votePath}/${pollId}/${userId}`);
    const pollRef = ref(this.db, `${this.pollPath}/${pollId}`);
    const voteData = { optionIds, createdAt: new Date().toISOString() };

    return new Observable<void>((observer) => {
      set(voteRef, voteData)
        .then(() => get(pollRef))
        .then((snap) => {
          const poll = snap.val();
          const newTotal = (poll?.totalVotes || 0) + 1;
          return update(pollRef, { totalVotes: newTotal });
        })
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch((err) => observer.error(err));
    });
  }

  /* ──────────────────────────────────────────────────────────────────────── */
  /*                                CLEAN-UP                                  */
  /* ──────────────────────────────────────────────────────────────────────── */

  deletePoll(pollId: string): Observable<void> {
    return from(set(ref(this.db, `${this.pollPath}/${pollId}`), null));
  }

  /* ----------------------- Private / Saved Polls ------------------------- */

  getPrivatePollsByUser(userEmail: string): Observable<Poll[]> {
    return this.getAllPolls().pipe(
      map((polls) => polls.filter((p) => p.isPrivate && p.createdBy === userEmail)),
    );
  }

  savePrivatePollForUser(userId: string, pollId: string): Observable<void> {
    return from(set(ref(this.db, `savedPrivatePolls/${userId}/${pollId}`), true));
  }

  getSavedPrivatePollIds(userId: string): Observable<string[]> {
    const userRef = ref(this.db, `savedPrivatePolls/${userId}`);
    return new Observable<string[]>((observer) => {
      const unsubscribe = onValue(
        userRef,
        (snap) => observer.next(snap.val() ? Object.keys(snap.val()) : []),
        (err) => observer.error(err),
      );
      return () => unsubscribe();
    });
  }

  /* ──────────────────────────────────────────────────────────────────────── */
  /*               🔍  Filtering / Sorting / Status Utilities                 */
  /* ──────────────────────────────────────────────────────────────────────── */

  /** True when `now` falls between `startDate`-`endDate` (or those are unset). */
  isPollActive(poll: Poll): boolean {
    const now = new Date();
    if (poll.startDate && new Date(poll.startDate) > now) return false;
    if (poll.endDate && new Date(poll.endDate) < now) return false;
    return true;
  }

  getPollStatus(poll: Poll): 'Upcoming' | 'Active' | 'Ended' {
    const now = new Date();
    if (poll.startDate && new Date(poll.startDate) > now) return 'Upcoming';
    if (poll.endDate && new Date(poll.endDate) < now)   return 'Ended';
    return 'Active';
  }

  getPollStatusClass(poll: Poll): string {
    return `status-${this.getPollStatus(poll).toLowerCase()}`;
  }

  /** Convenience for displaying a “time left” badge. */
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

  /** Filter list by current status. */
  filterByStatus(
    polls: Poll[],
    status: 'all' | 'active' | 'inactive' | 'closed',
  ): Poll[] {
    switch (status) {
      case 'active':
        return polls.filter((p) => this.isPollActive(p));
      case 'inactive':
        return polls.filter(
          (p) => !this.isPollActive(p) && this.getPollStatus(p) === 'Upcoming',
        );
      case 'closed':
        return polls.filter((p) => this.getPollStatus(p) === 'Ended');
      default:
        return polls;
    }
  }

  /** Sort helper – same modes the component had. */
  sortPolls(
    polls: Poll[],
    mode:
      | 'date-desc' | 'date-asc'
      | 'name-asc'  | 'name-desc'
      | 'votes-desc'| 'votes-asc',
  ): Poll[] {
    return [...polls].sort((a, b) => {
      switch (mode) {
        /* alphabetical */
        case 'name-asc':
          return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        case 'name-desc':
          return b.title.localeCompare(a.title, undefined, { sensitivity: 'base' });

        /* creation date */
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

        /* popularity */
        case 'votes-asc':
          return (a.totalVotes ?? 0) - (b.totalVotes ?? 0);
        case 'votes-desc':
        default:
          return (b.totalVotes ?? 0) - (a.totalVotes ?? 0);
      }
    });
  }
}
