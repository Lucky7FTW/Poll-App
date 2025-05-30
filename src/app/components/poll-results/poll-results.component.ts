import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ChartData, ChartOptions } from 'chart.js';
import { Poll, PollResult } from '../../models/poll.model';
import { PollService } from '../../services/poll.service';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-poll-results',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgChartsModule
  ],
  templateUrl: './poll-results.component.html',
  styleUrl:   './poll-results.component.css'
})
export class PollResultsComponent implements OnInit {
  private pollService = inject(PollService);
  private route       = inject(ActivatedRoute);

  /* ---------- poll data ---------- */
  poll: Poll | null = null;
  results: PollResult[] = [];
  totalVotes = 0;

  /* ---------- which graph ---------- */
  graph: 'pie' | 'bar' = 'pie';

  /* ---------- chart datasets ---------- */
  pieData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [{ data: [] }]
  };

  barData: ChartData<'bar', number[], string | string[]> = {
    labels: [],
    datasets: [{ data: [] }]
  };

  /* ---------- chart options ---------- */
  pieOpts: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  barOpts: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { display: false } }
  };

  /* ---------- ui state ---------- */
  isLoading   = true;
  errorMessage = '';

  ngOnInit(): void {
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

        this.poll       = poll;
        this.totalVotes = poll.totalVotes;

        /* ---- fabricate per-option votes if only total stored (demo) ---- */
        const votesPerOpt = Math.floor(poll.totalVotes / poll.options.length);
        this.results = poll.options.map((opt, idx) => {
          const votes = idx === 0
            ? poll.totalVotes - votesPerOpt * (poll.options.length - 1)
            : votesPerOpt;

          return <PollResult>{
            optionId: opt.id,
            optionText: opt.text,
            votes,
            percentage: poll.totalVotes === 0
              ? 0
              : Math.round((votes / poll.totalVotes) * 100)
          };
        });
        /* ---------------------------------------------------------------- */

        /* ---- fill both datasets ---- */
        const labels = this.results.map(r => r.optionText);
        const data   = this.results.map(r => r.votes);

        this.pieData = { labels, datasets: [{ data }] };
        this.barData = { labels, datasets: [{ data }] };

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading poll:', err);
        this.errorMessage = 'Failed to load poll results.';
        this.isLoading = false;
      }
    });
  }
}
