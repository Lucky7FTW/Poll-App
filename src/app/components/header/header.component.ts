import {
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';   // ⬅️ Angular 16+
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../core/authentication/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  /* ─────────── DI ─────────── */
  private auth = inject(AuthService);

  /* ─────────── state ─────────── */
  isMenuOpen = false;
  isScrolled = false;

  /** bind Firebase user stream → signal */
  readonly userSignal = toSignal(this.auth.user$, { initialValue: null });

  /* logged-in helpers */
  readonly isLoggedIn  = computed(() => !!this.userSignal());
  readonly currentUser = this.userSignal;           // alias for template

  /* ─────────── scroll / click ─────────── */
  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: Event) {
    const el = event.target as HTMLElement;
    if (
      !el.closest('.header-nav') &&
      !el.closest('.mobile-menu-button')
    ) {
      this.isMenuOpen = false;
    }
  }

  toggleMenu()  { this.isMenuOpen = !this.isMenuOpen; }
  closeMenu()   { this.isMenuOpen = false; }

  logout() {
    this.auth.logout();
    this.closeMenu();
  }

  /* ─────────── UI helpers ─────────── */
  getUserInitials(): string {
    const email = this.currentUser()?.email || '';
    const name  = email.split('@')[0] || '';
    return name.slice(0, 2).toUpperCase() || 'U';
  }

  getUserFirstName(): string {
    return (this.currentUser()?.email || '').split('@')[0];
  }
}
