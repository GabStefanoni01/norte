import { Component, Input } from '@angular/core';

@Component({
  selector: 'norte-logo-mark',
  standalone: true,
  template: `
    <svg [attr.width]="tamanho" [attr.height]="tamanho" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="#0b1120" />
      <circle cx="32" cy="32" r="27" fill="none" stroke="#e0a944" stroke-width="1.2" opacity="0.35" />
      <path d="M32 10 L38 32 L32 54 L26 32 Z" fill="#e0a944" />
      <path d="M32 10 L38 32 L32 32 Z" fill="#f2c979" />
      <circle cx="32" cy="32" r="3" fill="#0b1120" />
    </svg>
  `,
})
export class LogoMarkComponent {
  @Input() tamanho = 32;
}
