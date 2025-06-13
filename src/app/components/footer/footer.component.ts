import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  private textService = inject(TextService);
  readonly t$: Observable<FooterTexts> = this.textService.section<FooterTexts>('footer');
  currentYear = new Date().getFullYear();
}
