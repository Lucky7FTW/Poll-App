import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styleUrl: './not-found.component.css',
  templateUrl: './not-found.component.html',
})
export class NotFoundComponent {}
