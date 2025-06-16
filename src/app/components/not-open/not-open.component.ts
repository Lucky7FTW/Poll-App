import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-poll-not-open',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './not-open.component.html',
  styleUrls: ['./not-open.component.css'],
})
export class PollNotOpenComponent {
  title!: string;

  constructor(private route: ActivatedRoute) {
    this.title =
      this.route.snapshot.queryParamMap.get('title') ?? 'This poll';
  }
}
