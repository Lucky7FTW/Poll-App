import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { PollListComponent } from './components/poll-list/poll-list.component';
import { CreatePollComponent } from './components/create-poll/create-poll.component';
import { PollVoteComponent } from './components/poll-vote/poll-vote.component';
import { PollResultsComponent } from './components/poll-results/poll-results.component';
import { LoginComponent } from './components/login/login.component';
import { PrivatePollsComponent } from './components/private-polls/private-polls.component';
import { SignupComponent } from './components/signup/signup.component';
import { ContactComponent } from './components/footer/contact/contact.component';
import { TermsComponent } from './components/footer/terms/terms.component';
import { PrivacyComponent } from './components/footer/privacy/privacy.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { AuthGuard } from './core/authentication/auth.guard';
import { PollExistsGuard } from './core/authentication/models/poll-exists.guard';
import { NotFoundComponent } from './components/notfoundcomponent/not-found.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'polls', component: PollListComponent },
  {
    path: 'create',
    component: CreatePollComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'private-polls',
    component: PrivatePollsComponent,
    //canActivate: [authGuard],
  },
  { path: 'poll/:id', component: PollVoteComponent, canActivate: [PollExistsGuard]},
  { path: 'poll/:id/results', component: PollResultsComponent, canActivate: [PollExistsGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'privacy', component: PrivacyComponent },
  {
    path: 'user-profile',
    component: UserProfileComponent,
    //canActivate: [authGuard],
  },
  { path: '404', component: NotFoundComponent  },
  { path: '**', redirectTo: '' },
];
