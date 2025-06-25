import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanLoad,
  Route,
  Router,
  RouterStateSnapshot,
  UrlSegment,
} from '@angular/router';
import { Observable, map, take } from 'rxjs';

import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanLoad {
  constructor(private auth: AuthService, private router: Router) {}

  /* ───────── canActivate (regular routes) ───────── */
  canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.check(state.url);
  }

  /* ───────── canLoad (lazy modules) ───────── */
  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> {
    const url = '/' + segments.map((s) => s.path).join('/');
    return this.check(url);
  }

  /* ───────── shared logic ───────── */
  private check(returnUrl: string): Observable<boolean> {
    return this.auth.user$.pipe(
      take(1),
      map((u) => {
        if (u) return true;

        /** not logged in → redirect */
        this.router.navigate(['/login'], { queryParams: { returnUrl } });
        return false;
      })
    );
  }
}
