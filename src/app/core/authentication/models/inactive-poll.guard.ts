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
 * Blocks navigation if the poll’s startDate is in the future (“Upcoming”).
 * Redirects to `/poll/not-open` and passes the poll title as a query-param,
 * so the landing page can show a friendly message.
 */
@Injectable({ providedIn: 'root' })
export class InactivePollGuard implements CanActivate {
  private pollService = inject(PollService);
  private router      = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    const pollId = route.paramMap.get('id')!;            // route: /poll/:id

    return this.pollService.getPollById(pollId).pipe(
      map(poll => {
        if (!poll) {
          return true;
        }
        const now = new Date();
        const startsInFuture =
          poll.startDate && new Date(poll.startDate) > now;

        if (!startsInFuture) {
          return true;
        }

        return this.router.createUrlTree(
          ['/poll/not-open'],
          { queryParams: { title: poll.title ?? 'This poll' } }
        );
      }),

      // In case the API fails, let navigation proceed so the detail page
      // can handle its own error state.
      catchError(_ => of(true))
    );
  }
}
