import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'norte-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="variant === 'grid' ? 'grid gap-4 lg:grid-cols-2' : 'space-y-4'">
      <ng-container *ngFor="let _ of [].constructor(count)">
        <div *ngIf="variant === 'list'" class="rounded-2xl border border-norte-800 bg-norte-900/40 p-4 animate-pulse">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-norte-800"></div>
            <div class="flex-1">
              <div class="h-4 w-3/4 rounded bg-norte-800 mb-2"></div>
              <div class="h-3 w-1/2 rounded bg-norte-800"></div>
            </div>
          </div>
          <div class="mt-4">
            <div class="h-3 w-full rounded bg-norte-800 mb-2"></div>
            <div class="h-3 w-5/6 rounded bg-norte-800"></div>
          </div>
        </div>

        <div *ngIf="variant === 'grid'" class="rounded-2xl border border-norte-800 bg-norte-900/40 p-4 animate-pulse">
          <div class="h-4 w-1/2 rounded bg-norte-800 mb-3"></div>
          <div class="h-3 w-full rounded bg-norte-800 mb-2"></div>
          <div class="h-3 w-5/6 rounded bg-norte-800"></div>
        </div>
      </ng-container>
    </div>
  `,
})
export class SkeletonLoaderComponent {
  @Input() count = 3;
  @Input() variant: 'list' | 'grid' = 'list';
}
