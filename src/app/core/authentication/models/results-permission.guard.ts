import { Injectable, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  UrlTree,
} from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { PollService } from '../../../services/poll.service';
import { AuthService } from '../../../core/authentication/auth.service';
import { Poll } from '../../../models/poll.model';

@Injectable({ providedIn: 'root' })
export class ResultsPermissionGuard implements CanActivate {
  private pollService = inject(PollService);
  private auth        = inject(AuthService);
  private router      = inject(Router);

  canActivate(route: ActivatedRouteSnapshot) {
    const id = route.paramMap.get('id')!;
    return this.pollService.getPollById(id).pipe(
      map((poll: Poll | null): boolean | UrlTree => {
        if (!poll) {
          // let some 404 guard handle it
          return this.router.createUrlTree(['/404']);
        }

        const user = this.auth.user;

        /* ---------- access rules ---------- */
        const isCreator     = user && user.email === poll.createdBy;
        const alreadyVoted  = poll.hasVoted; // ← your service sets this flag
        const publicResults = !!poll.publicResults; // default false

        return publicResults || alreadyVoted || isCreator
          ? true
          : this.router.createUrlTree(['/poll', id]); // back to vote page
      }),
      catchError(() => of(this.router.createUrlTree(['/404'])))
    );
  }
}
