import { Injectable, inject } from '@angular/core';
import {
  Database,
  ref,
  push,
  set,
  update,
  get,
  child,
  onValue,
} from '@angular/fire/database';
import { Poll } from '../models/poll.model';
import { Observable, from, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PollService {
  private db = inject(Database);
  private pollPath = 'polls';
  private votePath = 'votes';

  getPollById(id: string): Observable<Poll | null> {
    const pollRef = ref(this.db, `${this.pollPath}/${id}`);
    return from(get(pollRef)).pipe(
      map((snapshot) => (snapshot.exists() ? { id, ...snapshot.val() } : null))
    );
  }

  checkIfUserVoted(pollId: string, userId: string): Observable<boolean> {
    const voteRef = ref(this.db, `votes/${pollId}/${userId}`);
    return from(get(voteRef)).pipe(map((snapshot) => snapshot.exists()));
  }

  getAllPolls(): Observable<Poll[]> {
    const allPollsRef = ref(this.db, this.pollPath);
    return new Observable<Poll[]>((observer) => {
      onValue(
        allPollsRef,
        (snapshot) => {
          const polls: Poll[] = [];
          snapshot.forEach((child) => {
            const data = child.val();
            polls.push({ id: child.key!, ...data });
          });
          observer.next(polls);
        },
        (error) => {
          observer.error(error);
        }
      );
    });
  }

  createPoll(
    poll: Omit<Poll, 'id'> & Partial<Pick<Poll, 'id'>>,
    customId?: string
  ): Observable<string> {
    const pollId = customId ?? push(ref(this.db, this.pollPath)).key!;
    const pollRef = ref(this.db, `${this.pollPath}/${pollId}`);

    return from(set(pollRef, { ...poll, id: pollId })).pipe(map(() => pollId));
  }

  updatePoll(id: string, data: Partial<Poll>): Observable<void> {
    const pollRef = ref(this.db, `${this.pollPath}/${id}`);
    return from(update(pollRef, data));
  }

  submitVote(
    pollId: string,
    userId: string,
    optionIds: string[]
  ): Observable<void> {
    const voteRef = ref(this.db, `votes/${pollId}/${userId}`);
    const voteData = {
      optionIds,
      createdAt: new Date().toISOString(),
    };

    const pollRef = ref(this.db, `polls/${pollId}`);

    return new Observable<void>((observer) => {
      set(voteRef, voteData)
        .then(() => get(pollRef))
        .then((snapshot) => {
          const poll = snapshot.val();
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

  deletePoll(pollId: string): Observable<void> {
    const pollRef = ref(this.db, `${this.pollPath}/${pollId}`);
    return from(set(pollRef, null));
  }

  getPrivatePollsByUser(userEmail: string): Observable<Poll[]> {
    return this.getAllPolls().pipe(
      map((polls) =>
        polls.filter((p) => p.isPrivate && p.createdBy === userEmail)
      )
    );
  }

  savePrivatePollForUser(userId: string, pollId: string): Observable<void> {
    const refPath = `savedPrivatePolls/${userId}/${pollId}`;
    return from(set(ref(this.db, refPath), true));
  }

  getSavedPrivatePollIds(userId: string): Observable<string[]> {
    const userRef = ref(this.db, `savedPrivatePolls/${userId}`);
    return new Observable<string[]>((observer) => {
      onValue(
        userRef,
        (snapshot) => {
          const data = snapshot.val();
          if (!data) {
            observer.next([]);
            observer.complete();
            return;
          }
          observer.next(Object.keys(data));
          observer.complete();
        },
        (err) => observer.error(err)
      );
    });
  }
}
