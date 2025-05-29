import { Component, OnInit } from "@angular/core"
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms"
import { AuthService } from "../../core/authentication/auth.service"
import { PollService } from "../../services/poll.service"
import { Observable } from "rxjs"
import { switchMap, tap } from "rxjs/operators"
import { Poll } from "../../models/poll.model"
import { CommonModule } from "@angular/common"
import { RouterLink } from "@angular/router"

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent {
  profileForm: FormGroup
  passwordForm: FormGroup

  loading = false // asta ar trebui sa fie pe true, also nu uita sa dai uncomment unde este //this.isLoading = false;
  updateSuccess = false
  updateError: string | null = null
  passwordUpdateSuccess = false
  passwordUpdateError: string | null = null

  // userPolls$: Observable<Poll[]>
  // pollStats = {
  //   totalPolls: 0,
  //   totalVotes: 0,
  //   publicPolls: 0,
  //   privatePolls: 0,
  // }


  // !!! ----- also verifica templateul, am comentat ce ar trebui sa fie de regula, sub sunt puse datele tot pentru mock
  // <!-- <div *ngIf="(userPolls$ | async)?.length === 0" class="empty-state"> --> DATELE care trebuie sa fie  
  //              <div *ngIf="polls.length === 0" class="empty-state"> DATE MOCK

  
  polls: Poll[] = []; //asta e pus pentru mock data(ca sa se poata vedea designul) ca sa pot apela din firebase getul pentru polls

  activeTab = "profile" // 'profile', 'polls', 'security'

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private pollService: PollService,
  ) {
    this.profileForm = this.fb.group({
      displayName: ["", [Validators.required, Validators.minLength(3)]],
      email: [{ value: "", disabled: true }],
      bio: ["", [Validators.maxLength(200)]],
    })

    this.passwordForm = this.fb.group(
      {
        currentPassword: ["", [Validators.required, Validators.minLength(6)]],
        newPassword: ["", [Validators.required, Validators.minLength(6)]],
        confirmPassword: ["", [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    )
  }

  ngOnInit(): void {
    this.loadUserData()
    this.loadUserPolls()
    this.loadAllPolls()
  }

  loadAllPolls(): void {
    this.pollService.getAllPolls().subscribe({
      next: (allPolls) => {
        this.polls = allPolls.filter((poll) => !poll.isPrivate);
        //this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load polls:', err);
        //this.errorMessage = 'Failed to load polls.';
        //this.isLoading = false;
      },
    });
  }

  loadUserData(): void {
    // this.authService.user$.subscribe((user) => {
    //   if (user) {
    //     this.profileForm.patchValue({
    //       displayName: user.displayName || "",
    //       email: user.email || "",
    //       bio: user.bio || "",
    //     })
    //     this.loading = false
    //   }
    // })
  }

  loadUserPolls(): void {
    // this.userPolls$ = this.authService.user$.pipe(
    //   switchMap((user) => {
    //     if (!user) return []
    //     return this.pollService.getPollsByUser(user.uid)
    //   }),
    //   tap((polls) => {
    //     this.calculatePollStats(polls)
    //   }),
    // )
  }

  calculatePollStats(polls: Poll[]): void {
    //this.pollStats.totalPolls = polls.length
    //this.pollStats.totalVotes = polls.reduce((sum, poll) => sum + (poll.totalVotes || 0), 0)
    //this.pollStats.publicPolls = polls.filter((poll) => poll.isPublic).length
    //this.pollStats.privatePolls = polls.filter((poll) => !poll.isPublic).length
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return

    const userData = {
      displayName: this.profileForm.get("displayName")?.value,
      bio: this.profileForm.get("bio")?.value,
    }

    //this.loading = true
    this.updateSuccess = false
    this.updateError = null

    // this.authService
    //   .updateUserProfile(userData)
    //   .then(() => {
    //     this.updateSuccess = true
    //     this.loading = false
    //     setTimeout(() => (this.updateSuccess = false), 3000)
    //   })
    //   .catch((error) => {
    //     this.updateError = `Failed to update profile: ${error.message}`
    //     this.loading = false
    //   })
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) return

    const currentPassword = this.passwordForm.get("currentPassword")?.value
    const newPassword = this.passwordForm.get("newPassword")?.value

    //this.loading = true
    this.passwordUpdateSuccess = false
    this.passwordUpdateError = null

    // this.authService
    //   .updatePassword(currentPassword, newPassword)
    //   .then(() => {
    //     this.passwordUpdateSuccess = true
    //     this.loading = false
    //     this.passwordForm.reset()
    //     setTimeout(() => (this.passwordUpdateSuccess = false), 3000)
    //   })
    //   .catch((error) => {
    //     this.passwordUpdateError = `Failed to update password: ${error.message}`
    //     this.loading = false
    //   })
  }

  passwordMatchValidator(form: FormGroup): { mismatch: boolean } | null {
    const newPassword = form.get("newPassword")?.value
    const confirmPassword = form.get("confirmPassword")?.value

    return newPassword === confirmPassword ? null : { mismatch: true }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab
  }

  deleteAccount(): void {
    // if (
    //   confirm(
    //     "Are you sure you want to delete your account? This action cannot be undone and all your polls will be deleted.",
    //   )
    // ) {
    //   this.authService
    //     .deleteAccount()
    //     .then(() => {
    //       // Redirect will happen automatically due to auth guard
    //     })
    //     .catch((error) => {
    //       alert(`Failed to delete account: ${error.message}`)
    //     })
    // }
  }

  getRecentPolls(polls: Poll[]): Poll[] {
    return polls.slice(0, 5)
  }
}
