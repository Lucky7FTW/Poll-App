import { Routes } from '@angular/router';

/* public pages */
import { HomeComponent }         from './components/home/home.component';
import { PollListComponent }     from './components/poll-list/poll-list.component';
import { PollNotOpenComponent }  from './components/not-open/not-open.component';
import { PollClosedComponent }   from './components/poll-closed/poll-closed.component';
import { LoginComponent }        from './components/login/login.component';
import { SignupComponent }       from './components/signup/signup.component';
import { ContactComponent }      from './components/footer/contact/contact.component';
import { TermsComponent }        from './components/footer/terms/terms.component';
import { PrivacyComponent }      from './components/footer/privacy/privacy.component';
import { NotFoundComponent }     from './components/not-found-component/not-found.component';

/* poll workflow */
import { CreatePollComponent }   from './components/create-poll/create-poll.component';
import { PollVoteComponent }     from './components/poll-vote/poll-vote.component';
import { PollResultsComponent }  from './components/poll-results/poll-results.component';
import { PrivatePollsComponent } from './components/private-polls/private-polls.component';

/* profile (now under pages/) */
import { UserProfileComponent }  from './components/user-profile/user-profile.component';

/* guards */
import { AuthGuard }        from './core/authentication/auth.guard';
import { PollExistsGuard }  from './core/authentication/models/poll-exists.guard';
import { InactivePollGuard }from './core/authentication/models/inactive-poll.guard';
import { ClosedPollGuard }  from './core/authentication/models/closed-poll.guard';

export const routes: Routes = [
  /* home & general */
  { path: '',          component: HomeComponent },
  { path: 'polls',     component: PollListComponent },

  /* poll create / edit */
  { path: 'create',    component: CreatePollComponent, canActivate: [AuthGuard] },

  /* poll live & results */
  {
    path: 'poll/:id',
    component: PollVoteComponent,
    canActivate: [ InactivePollGuard, PollExistsGuard, ClosedPollGuard ],
  },
  { path: 'poll/:id/results', component: PollResultsComponent, canActivate: [PollExistsGuard] },

  /* redirect targets used by guards */
  { path: 'poll/not-open', component: PollNotOpenComponent },
  { path: 'poll/closed',   component: PollClosedComponent },

  /* private-link polls */
  { path: 'private-polls', component: PrivatePollsComponent /* , canActivate: [AuthGuard] */ },

  /* auth & legal */
  { path: 'login',    component: LoginComponent },
  { path: 'signup',   component: SignupComponent },
  { path: 'contact',  component: ContactComponent },
  { path: 'terms',    component: TermsComponent },
  { path: 'privacy',  component: PrivacyComponent },

  /* user profile area (split into 3 sub-components inside) */
  { path: 'profile',  component: UserProfileComponent, canActivate: [AuthGuard] },

  /* fallback / 404 */
  { path: '404', component: NotFoundComponent },
  { path: '**',  redirectTo: '404' },
];
