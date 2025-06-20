// src/app/core/guards/results-permission.guard.ts
import { Injectable, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { PollService } from '../../../services/poll.service';
import { AuthService } from '../../../core/authentication/auth.service';
import { Poll } from '../../../models/poll.model';

/**
 * Guard that controls access to /poll/:id/results
 * - If `publicResults` is true → allow.
 * - If the user is the creator → allow.
 * - If the user has already voted → allow.
 * - Otherwise redirect back to /poll/:id with `?needVote=true`
 *   so the vote screen can show a “Please vote first” banner.
 */
@Injectable({ providedIn: 'root' })
export class ResultsPermissionGuard implements CanActivate {
  private pollService = inject(PollService);
  private auth        = inject(AuthService);
  private router      = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const id = route.paramMap.get('id')!;

    return this.pollService.getPollById(id).pipe(
      map((poll: Poll | null): boolean | UrlTree => {
        if (!poll) {
          // defer to 404 route
          return this.router.createUrlTree(['/404']);
        }

        const user          = this.auth.user;
        const isCreator     = !!user && user.email === poll.createdBy;
        const alreadyVoted  = !!poll.hasVoted;       // populated by backend
        const publicResults = !!poll.publicResults;  // default false

        // access rules
        if (publicResults || alreadyVoted || isCreator) return true;

        // bounce back to vote page with banner flag
        return this.router.createUrlTree(
          ['/poll', id],
          { queryParams: { needVote: 'true' } }
        );
      }),
      catchError(() =>
        of(this.router.createUrlTree(['/404']))
      )
    );
  }
}
