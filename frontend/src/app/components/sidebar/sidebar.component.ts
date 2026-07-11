import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LogoMarkComponent } from '../logo-mark/logo-mark.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'norte-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LogoMarkComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  constructor(public auth: AuthService) {}
}
