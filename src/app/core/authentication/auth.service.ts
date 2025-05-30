import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, map, switchMap, tap } from 'rxjs';
import { User } from './models/user.model';
import { AuthResponseData } from './models/auth.model';
import { firebaseConfig } from '../../../environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiKey = firebaseConfig.apiKey;
  user = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.autoLogin();
  }

  getId() {
    return this.user.getValue()?.id;
  }

  signup(email: string, password: string) {
    return this.http
      .post<AuthResponseData>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${this.apiKey}`,
        {
          email: email,
          password: password,
          returnSecureToken: true,
        }
      )
      .pipe(
        tap((response) => {
          this.sendVerificationEmail(response.idToken).subscribe();
        })
      );
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponseData>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.apiKey}`,
        {
          email,
          password,
          returnSecureToken: true,
        }
      )
      .pipe(
        switchMap((response) => {
          // Chaining: lookup email verification status
          return this.http
            .post<any>(
              `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${this.apiKey}`,
              {
                idToken: response.idToken,
              }
            )
            .pipe(
              map((lookupResponse) => {
                const userInfo = lookupResponse.users?.[0];
                if (userInfo?.emailVerified) {
                  this.handleAuthentication(
                    response.email,
                    response.localId,
                    response.idToken,
                    +response.expiresIn
                  );
                  return response;
                } else {
                  alert('Please verify your email before logging in.');
                  this.logout();
                  throw new Error('Email not verified');
                }
              })
            );
        })
      );
  }

  resetPassword(email: string) {
    return this.http.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${this.apiKey}`,
      {
        requestType: 'PASSWORD_RESET',
        email: email,
      }
    );
  }

  logout() {
    this.user.next(null);
    this.router.navigate(['/']);
  }

  sendVerificationEmail(idToken: string) {
    return this.http.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${this.apiKey}`,
      {
        requestType: 'VERIFY_EMAIL',
        idToken,
      }
    );
  }

  private handleAuthentication(
    email: string,
    userId: string,
    token: string,
    expiresIn: number
  ) {
    const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
    const user = new User(email, userId, token, expirationDate);
    this.user.next(user);
    // localStorage.setItem('userData', JSON.stringify(user)); // Store user in local storage
  }

  autoLogin() {
    // const userData: {
    //   email: string;
    //   id: string;
    //   _token: string;
    //   _tokenExpirationDate: string;
    // } = JSON.parse(localStorage.getItem('userData')!);
    // if (!userData) {
    //   return;
    // }
    // const loadedUser = new User(
    //   userData.email,
    //   userData.id,
    //   userData._token,
    //   new Date(userData._tokenExpirationDate)
    // );
    // if (loadedUser.token) {
    //   this.user.next(loadedUser);
    // }
  }
}
