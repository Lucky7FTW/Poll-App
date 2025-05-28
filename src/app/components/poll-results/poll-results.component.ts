import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Poll, PollResult } from '../../models/poll.model';
import { PollService } from '../../services/poll.service';

@Component({
  selector: 'app-poll-results',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './poll-results.component.html',
  styleUrl: './poll-results.component.css',
})
export class PollResultsComponent implements OnInit {
  private pollService = inject(PollService);
  private route = inject(ActivatedRoute);

  poll: Poll | null = null;
  results: PollResult[] = [];
  totalVotes = 0;
  isLoading = true;
  errorMessage = '';

  ngOnInit() {
    const pollId = this.route.snapshot.paramMap.get('id');
    if (!pollId) {
      this.errorMessage = 'Poll ID is missing';
      this.isLoading = false;
      return;
    }

    this.pollService.getPollById(pollId).subscribe({
      next: (poll) => {
        if (!poll) {
          this.errorMessage = 'Poll not found';
          this.isLoading = false;
          return;
        }

        this.poll = poll;
        this.totalVotes = poll.totalVotes;

        // Simulăm rezultatele în lipsa voturilor per opțiune (doar pentru demo)
        const votesPerOption = Math.floor(
          poll.totalVotes / poll.options.length
        );
        const results = poll.options.map((opt, i) => {
          const votes =
            i === 0
              ? poll.totalVotes - votesPerOption * (poll.options.length - 1) // prima opțiune primește restul
              : votesPerOption;

          return {
            optionId: opt.id,
            optionText: opt.text,
            votes,
            percentage:
              poll.totalVotes === 0
                ? 0
                : Math.round((votes / poll.totalVotes) * 100),
          };
        });

        this.results = results;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading poll:', err);
        this.errorMessage = 'Failed to load poll results.';
        this.isLoading = false;
      },
    });
  }
}
