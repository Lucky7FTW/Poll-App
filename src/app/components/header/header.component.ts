import {
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/authentication/auth.service';
import { User } from '../../core/authentication/models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private authService = inject(AuthService);

  isMenuOpen = false;
  isScrolled = false;

  userSignal = signal<User | null>(null); // nou

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    this.isScrolled = window.pageYOffset > 20;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (
      !target.closest('.header-nav') &&
      !target.closest('.mobile-menu-button')
    ) {
      this.isMenuOpen = false;
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  // Aflăm dacă userul este logat:
  isLoggedIn = computed(() => !!this.userSignal());

  currentUser = computed(() => this.userSignal());

  ngOnInit() {
    this.authService.user.subscribe((user) => {
      this.userSignal.set(user);
    });
  }

  logout() {
    this.authService.logout();
    this.closeMenu();
  }

  getUserInitials(): string {
    const email = this.currentUser()?.email || '';
    const namePart = email.split('@')[0];
    return namePart.length >= 2 ? namePart.slice(0, 2).toUpperCase() : 'U';
  }

  getUserFirstName(): string {
    const email = this.currentUser()?.email || '';
    return email.split('@')[0];
  }
}
