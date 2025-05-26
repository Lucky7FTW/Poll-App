import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Poll } from '../models/poll.model';
import { RealtimeDatabaseService } from '../core/firebase/realtime-database.service';

@Injectable({
  providedIn: 'root',
})
export class PollService {
  private readonly collectionName = 'polls';

  constructor(private dbService: RealtimeDatabaseService<Poll>) {}

  getAllPolls(): Observable<Poll[]> {
    return this.dbService.getAll(this.collectionName);
  }

  getPollById(id: string): Observable<Poll | undefined> {
    return this.dbService.getById(this.collectionName, id);
  }

  createPoll(poll: Omit<Poll, 'id'>): Promise<string> {
    // `id` va fi generat automat de serviciul generic
    return this.dbService.add(this.collectionName, poll as Poll);
  }

  updatePoll(id: string, poll: Partial<Poll>): Promise<void> {
    return this.dbService.update(this.collectionName, id, poll);
  }

  deletePoll(id: string): Promise<void> {
    return this.dbService.delete(this.collectionName, id);
  }
}
