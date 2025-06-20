import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { PollService } from '../../../services/poll.service';

/**
 * Guard that blocks the vote page when a **public** poll has already ended.
 *
 * ▸ **Private polls are exempt** – users with the link can still open them
 *   after the end date.  
 * ▸ When a public poll is closed, redirects to
 *   `/poll/closed?id=<id>&title=<title>` so users can choose to view results
 *   or return to the list.
 */
@Injectable({ providedIn: 'root' })
export class ClosedPollGuard implements CanActivate {
  private pollService = inject(PollService);
  private router      = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    const pollId = route.paramMap.get('id')!;   // route: /poll/:id

    return this.pollService.getPollById(pollId).pipe(
      map(poll => {
        /* ── allow navigation if poll doesn’t exist OR is private ── */
        if (!poll || poll.isPrivate) {
          return true;
        }

        /* ── public poll: block if it has ended ── */
        const now      = new Date();
        const hasEnded = poll.endDate && new Date(poll.endDate) < now;

        if (!hasEnded) {
          return true;                           // poll still open → allow
        }

        // poll closed → redirect to friendly “closed” page
        return this.router.createUrlTree(
          ['/poll/closed'],
          {
            queryParams: {
              id:    pollId,
              title: poll.title ?? 'This poll'
            }
          }
        );
      }),

      /* If the API fails, proceed; earlier guards handle missing polls. */
      catchError(() => of(true))
    );
  }
}
