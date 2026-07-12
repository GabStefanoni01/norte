import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StarfieldComponent } from '../../components/starfield/starfield.component';
import { LogoMarkComponent } from '../../components/logo-mark/logo-mark.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';

@Component({
  selector: 'norte-about',
  standalone: true,
  imports: [RouterLink, StarfieldComponent, LogoMarkComponent, FooterComponent, RevealOnScrollDirective],
  templateUrl: './about.component.html',
})
export class AboutComponent {}
