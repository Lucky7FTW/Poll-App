// src/app/polls/guards/poll-exists.guard.ts
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
} from '@angular/router';
import { of, map, catchError, tap } from 'rxjs';

import { PollService } from '../../../services/poll.service';

@Injectable({ providedIn: 'root'    })
export class PollExistsGuard implements CanActivate {
  constructor(private pollService: PollService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot) {
    const pollId = route.paramMap.get('id')!;          // “!” because route is /poll/:id/…

    return this.pollService.getPollById(pollId).pipe(
      map(poll => !!poll),                             // true → poll exists
      tap(exists => {
        if (!exists) this.router.navigate(['/404']);   // redirect to 404 page
      }),
      catchError(() => {                                // network / Firestore error
        this.router.navigate(['/404']);
        return of(false);
      })
    );
  }
}
