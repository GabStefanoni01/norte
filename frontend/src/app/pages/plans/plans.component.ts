import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'norte-plans',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './plans.component.html',
})
export class PlansComponent {}
