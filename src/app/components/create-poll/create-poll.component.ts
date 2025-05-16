import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

//import { PollService } from '../../services/poll.service';

@Component({
  selector: 'app-create-poll',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-poll.component.html',
  styleUrl: './create-poll.component.css'
})
export class CreatePollComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  //private pollService = inject(PollService);

  pollForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: [''],
    options: this.fb.array([
      this.createOption(),
      this.createOption()
    ], Validators.minLength(2)),
    allowMultiple: [false],
    isPrivate: [false]
  });

  isLoading = false;
  errorMessage = '';

  get options() {
    return this.pollForm.get('options') as FormArray;
  }

  createOption(): FormGroup {
    return this.fb.group({
      text: ['', Validators.required]
    });
  }

  addOption() {
    this.options.push(this.createOption());
  }

  removeOption(index: number) {
    this.options.removeAt(index);
  }

  onSubmit() {
    if (this.pollForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const pollId = 'poll-' + Math.random().toString(36).substring(2, 10);

    //this.router.navigate(['/poll', pollId]);
    this.isLoading = false;
  }
}
