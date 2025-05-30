// src/app/poll-results/poll-results.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ChartData, ChartOptions, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { Poll, PollResult } from '../../models/poll.model';
import { PollService } from '../../services/poll.service';

@Component({
  selector: 'app-poll-results',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    BaseChartDirective,          // 👈 directive that powers <canvas baseChart>
  ],
  templateUrl: './poll-results.component.html',
  styleUrl: './poll-results.component.css',
})
export class PollResultsComponent implements OnInit {
  private pollService = inject(PollService);
  private route       = inject(ActivatedRoute);

  /* ---------- data ---------- */
  poll: Poll | null = null;
  results: PollResult[] = [];
  totalVotes = 0;

  /* ---------- Chart.js bindings ---------- */
  pieChartType: ChartType = 'pie';
  pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [{ data: [] }],
  };
  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  /* ---------- ui state ---------- */
  isLoading = true;
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

        /* ----- fabricate votes per option if not stored (demo) ----- */
        const votesPerOpt = Math.floor(poll.totalVotes / poll.options.length);
        const fabricated  = poll.options.map((opt, idx) => {
          const votes = idx === 0
            ? poll.totalVotes - votesPerOpt * (poll.options.length - 1)
            : votesPerOpt;

          return <PollResult>{
            optionId: opt.id,
            optionText: opt.text,
            votes,
            percentage: poll.totalVotes === 0
              ? 0
              : Math.round((votes / poll.totalVotes) * 100),
          };
        });

        this.results = fabricated;

        /* feed the chart */
        this.pieChartData = {
          labels: this.results.map(r => r.optionText),
          datasets: [{ data: this.results.map(r => r.votes) }],
        };

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
