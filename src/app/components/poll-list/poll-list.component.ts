import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Poll } from '../../models/poll.model';
import { PollService } from '../../services/poll.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TextService } from '../../services/text.service'; // adjust path
import { Observable } from 'rxjs';

interface PollListTexts {
  title: string;
  create: string;
  empty: string;
  emptyCta: string;
  createdBy: string;
  votes: string;
  vote: string;
  results: string;
  loadError: string;
}

@Component({
  selector: 'app-poll-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './poll-list.component.html',
  styleUrls: ['./poll-list.component.css'],
})
export class PollListComponent implements OnInit {
  private pollService = inject(PollService);
  private platformId = inject(PLATFORM_ID);
  private textService = inject(TextService);

  readonly t$: Observable<PollListTexts> = this.textService.section<PollListTexts>('pollList');

  polls: Poll[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.pollService.getAllPolls().subscribe({
        next: (allPolls) => {
          this.polls = allPolls.filter((poll) => !poll.isPrivate);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load polls:', err);
          this.t$.subscribe(t => {
            this.errorMessage = t.loadError;
          }).unsubscribe();
          this.isLoading = false;
        },
      });
    } else {
      // SSR only
      this.isLoading = false;
    }
  }
}
