import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface AppTexts { [k: string]: any; }

@Injectable({ providedIn: 'root' })
export class TextService {
  /** cached dictionary – created *after* HttpClient is injected */
  private readonly texts$: Observable<AppTexts>;

  constructor(private http: HttpClient) {
    this.texts$ = this.http
      .get<AppTexts>('/assets/i18n/en.json')
      .pipe(shareReplay(1));
  }

  /** e.g. section('poll') ⇒ Observable with just the "poll" branch */
  section<T = unknown>(key: keyof AppTexts): Observable<T> {
    return this.texts$.pipe(map(all => all[key] as T));
  }
}
