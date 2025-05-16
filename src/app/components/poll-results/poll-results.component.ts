import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

//import { NgChartsModule } from 'ng2-charts';

//import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

//import { PollService } from '../../services/poll.service';

import { Poll, PollResult } from '../../models/poll.model';

@Component({
  selector: 'app-poll-results',
  imports: [CommonModule, RouterLink],
  templateUrl: './poll-results.component.html',
  styleUrl: './poll-results.component.css'
})
export class PollResultsComponent {
  poll: Poll | null = null;
  results: PollResult[] = [];
  totalVotes = 0;
  isLoading = true;
  errorMessage = '';

  // Chart configuration
  // pieChartOptions: ChartConfiguration['options'] = {
  //   responsive: true,
  //   plugins: {
  //     legend: {
  //       display: true,
  //       position: 'top',
  //     }
  //   }
  // };

  // pieChartType: ChartType = 'pie';
  // pieChartData: ChartData<'pie'> = {
  //   labels: [],
  //   datasets: [{
  //     data: [],
  //     backgroundColor: [
  //       '#8b5cf6', // purple-500
  //       '#6366f1', // indigo-500
  //       '#3b82f6', // blue-500
  //       '#10b981', // emerald-500
  //       '#f59e0b', // amber-500
  //       '#ef4444', // red-500
  //       '#ec4899', // pink-500
  //     ]
  //   }]
  // };

  constructor(
    private route: ActivatedRoute,
    //private pollService: PollService
  ) { }

  ngOnInit() {
    const pollId = this.route.snapshot.paramMap.get('id');
    if (!pollId) {
      this.errorMessage = 'Poll ID is missing';
      this.isLoading = false;
      return;
    }


    this.poll = {
      id: pollId,
      title: 'What is your favorite programming language?',
      description: 'Please select the language you enjoy coding with the most.',
      options: [
        { id: 'opt-1', text: 'JavaScript' },
        { id: 'opt-2', text: 'Python' },
        { id: 'opt-3', text: 'Java' },
        { id: 'opt-4', text: 'C#' },
        { id: 'opt-5', text: 'TypeScript' }
      ],
      createdBy: 'JohnDoe',
      createdAt: new Date().toISOString(),
      allowMultiple: false,
      isPrivate: false,
      totalVotes: 145
    };

    this.results = [
      { optionId: 'opt-1', optionText: 'JavaScript', votes: 42, percentage: 29 },
      { optionId: 'opt-2', optionText: 'Python', votes: 38, percentage: 26 },
      { optionId: 'opt-3', optionText: 'Java', votes: 25, percentage: 17 },
      { optionId: 'opt-4', optionText: 'C#', votes: 18, percentage: 12 },
      { optionId: 'opt-5', optionText: 'TypeScript', votes: 22, percentage: 16 }
    ];

    this.totalVotes = this.results.reduce((sum, result) => sum + result.votes, 0);

    // Update chart data
    // this.pieChartData.labels = this.results.map(result => result.optionText);
    // this.pieChartData.datasets[0].data = this.results.map(result => result.votes);

    this.isLoading = false;

  }
}
