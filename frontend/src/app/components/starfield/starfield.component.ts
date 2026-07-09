import { Component } from '@angular/core';

interface Estrela {
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
}

@Component({
  selector: 'norte-starfield',
  standalone: true,
  templateUrl: './starfield.component.html',
})
export class StarfieldComponent {
  // Gerado uma vez por instância — decorativo, não precisa ser determinístico.
  estrelas: Estrela[] = Array.from({ length: 45 }, () => ({
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 4,
    duration: Math.random() * 2 + 2.5,
  }));
}
