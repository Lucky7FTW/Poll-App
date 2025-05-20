import { Component, OnInit } from "@angular/core"
//import { PollService } from "../../services/poll.service"
//import { AuthService } from "../../services/auth.service"
import { Observable } from "rxjs"
import { map } from "rxjs/operators"
import { Poll } from "../../models/poll.model"
import { CommonModule } from "@angular/common"
import { RouterLink } from "@angular/router"

@Component({
  selector: "app-private-polls",
  imports: [CommonModule, RouterLink],
  templateUrl: "./private-polls.component.html",
  styleUrls: ["./private-polls.component.css"],
})
export class PrivatePollsComponent implements OnInit {
  //privatePolls$: Observable<Poll[]>
  loading = true
  error: string | null = null

  polls: Poll[] = [
    {
      id: 'poll-1',
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
    },
    {
      id: 'poll-2',
      title: 'Which frontend framework do you prefer?',
      description: 'Vote for your favorite frontend framework or library.',
      options: [
        { id: 'opt-1', text: 'React' },
        { id: 'opt-2', text: 'Angular' },
        { id: 'opt-3', text: 'Vue' },
        { id: 'opt-4', text: 'Svelte' }
      ],
      createdBy: 'JaneSmith',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      allowMultiple: false,
      isPrivate: false,
      totalVotes: 89
    },
    {
      id: 'poll-3',
      title: 'What database do you use most often?',
      description: '',
      options: [
        { id: 'opt-1', text: 'PostgreSQL' },
        { id: 'opt-2', text: 'MySQL' },
        { id: 'opt-3', text: 'MongoDB' },
        { id: 'opt-4', text: 'SQLite' },
        { id: 'opt-5', text: 'Firebase' }
      ],
      createdBy: 'TechGuru',
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      allowMultiple: true,
      isPrivate: false,
      totalVotes: 67
    },
    {
      id: 'poll-4',
      title: 'How many hours do you code per day?',
      description: 'On average, how many hours do you spend coding each day?',
      options: [
        { id: 'opt-1', text: 'Less than 2 hours' },
        { id: 'opt-2', text: '2-4 hours' },
        { id: 'opt-3', text: '4-6 hours' },
        { id: 'opt-4', text: '6-8 hours' },
        { id: 'opt-5', text: 'More than 8 hours' }
      ],
      createdBy: 'CodeMaster',
      createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      allowMultiple: false,
      isPrivate: true,
      totalVotes: 112
    }
  ];

  constructor(
    //private pollService: PollService,
    //private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.loadPrivatePolls()
  }

  loadPrivatePolls(): void {
    //const userId = this.authService.currentUser?.uid

    // if (!userId) {
    //   this.error = "You must be logged in to view private polls"
    //   this.loading = false
    //   return
    // }

    // this.privatePolls$ = this.pollService
    //   .getPollsByUser(userId)
    //   .pipe(map((polls) => polls.filter((poll) => !poll.isPublic)))

    // Subscribe temporarily to handle loading state
    // const subscription = this.privatePolls$.subscribe({
    //   next: () => {
    //     this.loading = false
    //   },
    //   error: (err) => {
    //     this.error = "Failed to load private polls: " + err.message
    //     this.loading = false
    //   },
    // })

  }

  copyPollLink(pollId: string): void {
    // const pollUrl = `${window.location.origin}/poll/${pollId}`
    // navigator.clipboard
    //   .writeText(pollUrl)
    //   .then(() => {
    //     // You could add a toast notification here
    //     console.log("Poll link copied to clipboard")
    //   })
    //   .catch((err) => {
    //     console.error("Could not copy text: ", err)
    //   })
  }

  deletePoll(pollId: string): void {
    // if (confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
    //   this.pollService
    //     .deletePoll(pollId)
    //     .then(() => {
    //       console.log("Poll deleted successfully")
    //       // The observable will automatically update
    //     })
    //     .catch((err) => {
    //       console.error("Error deleting poll: ", err)
    //       this.error = "Failed to delete poll: " + err.message
    //     })
    // }
  }
}
