import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  isMenuOpen = false;
  isScrolled = false;

  // Demo variable pentru a simula starea de autentificare
  isLoggedIn = false; // Schimbă la true pentru a vedea starea de logat

  // Demo user data
  currentUser = {
    username: 'Alexandra Popescu',
    email: 'alexandra@example.com',
    initials: 'AP',
    avatar: null,
  };

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

  // Demo functions pentru testare
  mockLogin() {
    this.isLoggedIn = true;
    this.closeMenu();
  }

  mockLogout() {
    this.isLoggedIn = false;
    this.closeMenu();
  }

  getUserInitials(): string {
    return this.currentUser.initials;
  }

  getUserFirstName(): string {
    return this.currentUser.username.split(' ')[0];
  }
}
