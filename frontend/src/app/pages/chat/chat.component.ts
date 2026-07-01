import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'norte-chat',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './chat.component.html',
})
export class ChatComponent {}
