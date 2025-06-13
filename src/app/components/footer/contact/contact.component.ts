import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-contact',
  imports: [CommonModule,RouterLink],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  teamMembers = [
    {
      name: "Robert Gengiu",
      email: "robert.gengiu@email.com",
      role: "Frontend Architect & UI/UX Designer",
    },
    {
      name: "Francesco Maxim",
      email: "francesco.maxim@email.com",
      role: "Firebase Integration & Data Visualization",
    },
    {
      name: "Mihai Tibrea",
      email: "mihai.tibrea@email.com",
      role: "Authentication & Security Specialist",
    },
    {
      name: "Rares Suciu",
      email: "rares.suciu@emeal.nttdata.com",
      role: "Project Coordinator",
    },
  ]

  sendEmail(email: string): void {
    window.location.href = `mailto:${email}?subject=PollVote Contact&body=Hello, I would like to get in touch regarding PollVote.`
  }
}
