import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Poll } from '../../models/poll.model';
import { PollService } from '../../services/poll.service'; // ajustează dacă e în altă locație

@Component({
  selector: 'app-poll-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './poll-list.component.html',
  styleUrl: './poll-list.component.css',
})
export class PollListComponent implements OnInit {
  private pollService = inject(PollService);

  polls: Poll[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit() {
    this.pollService.getAllPolls().subscribe({
      next: (allPolls) => {
        // Filtrăm doar poll-urile publice
        this.polls = allPolls.filter((poll) => !poll.isPrivate);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load polls:', err);
        this.errorMessage = 'Failed to load polls. Please try again later.';
        this.isLoading = false;
      },
    });
  }
}
