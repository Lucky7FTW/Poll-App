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
 * ▸ Blocks the vote page when a poll has already ended.  
 * ▸ Redirects to `/poll/closed?id=<id>&title=<title>` so users can
 *   choose to view results or go back to the list.
 */
@Injectable({ providedIn: 'root' })
export class ClosedPollGuard implements CanActivate {
  private pollService = inject(PollService);
  private router      = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    const pollId = route.paramMap.get('id')!;   // route is /poll/:id

    return this.pollService.getPollById(pollId).pipe(
      map(poll => {
        if (!poll) return true;
        const now       = new Date();
        const hasEnded  = poll.endDate && new Date(poll.endDate) < now;

        // ✅ still open → allow navigation to vote component
        if (!hasEnded) return true;

        // 🚧 closed → redirect to the “poll closed” page
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

      /* If API fails, allow route; PollExistsGuard (earlier in the
         canActivate chain) will already handle missing polls.          */
      catchError(() => of(true))
    );
  }
}
