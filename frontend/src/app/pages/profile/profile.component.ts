import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'norte-profile',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {}
