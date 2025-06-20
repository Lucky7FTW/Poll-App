// src/app/pages/user-profile/user-profile.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ProfileInfoFormComponent }  from './profile/profile-info-form.component';
import { UserPollsComponent }        from './my-polls/user-polls.component';
import { SecuritySettingsComponent } from './security/security-settings.component';

/** Parent shell that hosts the three tabs */
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ProfileInfoFormComponent,
    UserPollsComponent,
    SecuritySettingsComponent,
  ],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
})
export class UserProfileComponent {
  activeTab: 'profile' | 'polls' | 'security' = 'profile';
  setTab(tab: typeof this.activeTab) { this.activeTab = tab; }
}
