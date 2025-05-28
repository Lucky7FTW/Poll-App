import { Component, inject } from '@angular/core';
import { TextService } from '../../services/text.service'; // adjust path if needed
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

interface FooterTexts {
  brand: string;
  subtitle: string;
  links: {
    terms: string;
    privacy: string;
    contact: string;
  };
  copyright: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  private textService = inject(TextService);
  readonly t$: Observable<FooterTexts> = this.textService.section<FooterTexts>('footer');
  currentYear = new Date().getFullYear();
}
