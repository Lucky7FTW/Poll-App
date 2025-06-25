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
 * Guard that blocks navigation when a public poll’s startDate is in the future
 * (“Upcoming”).  
 * 
 * ▸ **Private polls are exempt** – users with the link can open them at any time.  
 * ▸ If a public poll is still upcoming, the guard redirects to `/poll/not-open`
 *   and passes the poll title as a `title` query-param so the landing page can
 *   show a friendly message.
 */
@Injectable({ providedIn: 'root' })
export class InactivePollGuard implements CanActivate {
  private pollService = inject(PollService);
  private router      = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    // Route pattern: /poll/:id
    const pollId = route.paramMap.get('id')!;

    return this.pollService.getPollById(pollId).pipe(
      map(poll => {
        /* ───── allow navigation if the poll doesn’t exist OR is private ───── */
        if (!poll || poll.isPrivate) {
          return true;
        }

        /* ───── for public polls: block if it hasn’t started yet ───── */
        const now = new Date();
        const startsInFuture =
          poll.startDate && new Date(poll.startDate) > now;

        if (!startsInFuture) {
          return true;                              // poll is active → allow
        }

        // poll is upcoming → redirect to friendly “not open yet” page
        return this.router.createUrlTree(
          ['/poll/not-open'],
          { queryParams: { title: poll.title ?? 'This poll' } }
        );
      }),

      /* If the API errors, allow navigation so the detail page can self-handle */
      catchError(() => of(true))
    );
  }
}
