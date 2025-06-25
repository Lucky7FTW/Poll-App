import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, from, of } from "rxjs";
import { tap } from "rxjs/operators";

import {
  Auth,
  authState,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as fbUpdateProfile,
  updatePassword as fbUpdatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser,
} from "@angular/fire/auth";

/* ──────────────────────────────
 * App-level user model
 * ──────────────────────────────*/
export interface AppUser {
  id: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  /** Emits `null` when logged‑out, otherwise the current user */
  readonly user$ = new BehaviorSubject<AppUser | null>(null);

  /** Synchronous snapshot getter (useful in guards) */
  get user(): AppUser | null {
    return this.user$.getValue();
  }

  constructor(private auth: Auth, private router: Router) {
    this.initAuthListener();
  }

  /* ──────────────────────────────
   * Auth API wrappers
   * ──────────────────────────────*/

  login(email: string, password: string, remember = true) {
    const persistence = remember
      ? browserLocalPersistence // survives refresh / quit
      : browserSessionPersistence; // cleared on tab close

    return from(
      setPersistence(this.auth, persistence).then(() =>
        signInWithEmailAndPassword(this.auth, email, password),
      ),
    );
  }

  /** Creates an account and sends a verification e‑mail. */
  register(email: string, password: string) {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      tap(({ user }) => sendEmailVerification(user)),
    );
  }

  /** Sends a password‑reset link. */
  resetPassword(email: string) {
    return from(sendPasswordResetEmail(this.auth, email));
  }

  /** Logs out and navigates to `/login`. */
  logout() {
    return from(signOut(this.auth)).pipe(
      tap(() => {
        this.user$.next(null);
        localStorage.removeItem("app_user");
        this.router.navigate(["/login"]);
      }),
    );
  }

  /* ──────────────────────────────
   * Profile / Security helpers
   * ──────────────────────────────*/

  /** Updates displayName / photoURL (and later: bio). */
  updateUserProfile({
    displayName,
    photoURL,
    // bio,
  }: {
    displayName?: string | null;
    photoURL?: string | null;
    bio?: string | null;
  }): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return Promise.reject(new Error("Not signed in"));

    return fbUpdateProfile(user, {
      displayName: displayName ?? undefined,
      photoURL: photoURL ?? undefined,
    }).then(() => {
      // TODO: if you store `bio` in Firestore, update it here.
      const updated = this.toAppUser(user);
      this.user$.next(updated);
      localStorage.setItem("app_user", JSON.stringify(updated));
    });
  }

  /** Re‑auth (with current pwd) then change to `newPassword`. */
  updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user || !user.email)
      return Promise.reject(new Error("Not signed in"));

    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    return reauthenticateWithCredential(user, credential).then(() =>
      fbUpdatePassword(user, newPassword),
    );
  }

  /** Permanently deletes the current account. */
  deleteAccount(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return Promise.reject(new Error("Not signed in"));

    return deleteUser(user).then(() => {
      this.user$.next(null);
      localStorage.removeItem("app_user");
      this.router.navigate(["/"]);
    });
  }

  /* ──────────────────────────────
   * Internals
   * ──────────────────────────────*/

  private initAuthListener() {
    const cached = localStorage.getItem("app_user");
    if (cached) this.user$.next(JSON.parse(cached) as AppUser);

    authState(this.auth).subscribe((fbUser) => {
      if (fbUser) {
        const appUser = this.toAppUser(fbUser);
        this.user$.next(appUser);
        localStorage.setItem("app_user", JSON.stringify(appUser));
      } else {
        this.user$.next(null);
        localStorage.removeItem("app_user");
      }
    });
  }

  private toAppUser(fb: FirebaseUser): AppUser {
    return {
      id: fb.uid,
      email: fb.email ?? "",
      displayName: fb.displayName,
      photoURL: fb.photoURL,
    };
  }
}
