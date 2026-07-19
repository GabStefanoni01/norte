import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoMarkComponent } from '../../components/logo-mark/logo-mark.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'norte-terms',
  standalone: true,
  imports: [RouterLink, LogoMarkComponent, FooterComponent],
  templateUrl: './terms.component.html',
})
export class TermsComponent {}
