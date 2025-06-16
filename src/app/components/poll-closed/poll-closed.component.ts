import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-poll-closed',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './poll-closed.component.html',
  styleUrls: ['./poll-closed.component.css'],
})
export class PollClosedComponent {
  pollId!: string;
  pollName!: string;

  constructor(private route: ActivatedRoute) {
    this.pollId   = this.route.snapshot.queryParamMap.get('id')    ?? '';
    this.pollName = this.route.snapshot.queryParamMap.get('title') ?? 'This poll';
  }
}
