import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoMarkComponent } from '../logo-mark/logo-mark.component';

// TODO: trocar pelo @ real da empresa no Instagram.
const INSTAGRAM_URL = 'https://instagram.com/norte';

@Component({
  selector: 'norte-footer',
  standalone: true,
  imports: [RouterLink, LogoMarkComponent],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  anoAtual = new Date().getFullYear();
  instagramUrl = INSTAGRAM_URL;
}
