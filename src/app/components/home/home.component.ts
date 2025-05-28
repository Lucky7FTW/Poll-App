import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TextService } from '../../services/text.service'; // Adjust path if needed
import { Observable } from 'rxjs';

interface HomeTexts {
  heroTitle: string;
  heroSubtitle: string;
  createPoll: string;
  browsePolls: string;
  features: { title: string; description: string }[];
  howItWorks: {
    title: string;
    subtitle: string;
    steps: { number: string; title: string; description: string }[];
  };
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  private textService = inject(TextService);
  readonly t$: Observable<HomeTexts> = this.textService.section<HomeTexts>('home');
}
