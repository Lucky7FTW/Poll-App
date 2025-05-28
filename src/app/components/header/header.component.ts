import {
  Component,
  HostListener,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/authentication/auth.service';
import { User } from '../../core/authentication/models/user.model';
import { TextService } from '../../services/text.service'; // Adjust path as needed
import { Observable } from 'rxjs';

interface HeaderTexts {
  brand: string;
  home: string;
  publicPolls: string;
  myPolls: string;
  createPoll: string;
  login: string;
  signup: string;
  hello: string;
  logout: string;
  notifications: string;
  profile: string;
  contact: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private textService = inject(TextService);

  isMenuOpen = false;
  isScrolled = false;

  userSignal = signal<User | null>(null);
  readonly t$: Observable<HeaderTexts> = this.textService.section<HeaderTexts>('header');

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
