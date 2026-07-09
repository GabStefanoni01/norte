import { Directive, ElementRef, Input, OnDestroy, OnInit, inject } from '@angular/core';

/**
 * Revela o elemento com uma animação de fade + slide assim que ele entra na
 * viewport, usando IntersectionObserver. Uso: <div norteReveal [revealDelay]="0.1">
 */
@Directive({
  selector: '[norteReveal]',
  standalone: true,
})
export class RevealOnScrollDirective implements OnInit, OnDestroy {
  @Input() revealDelay = 0;

  private el = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  ngOnInit() {
    const elemento = this.el.nativeElement;
    elemento.classList.add('reveal');
    elemento.style.transitionDelay = `${this.revealDelay}s`;

    // Sem suporte a IntersectionObserver (raro), mostra direto.
    if (typeof IntersectionObserver === 'undefined') {
      elemento.classList.add('is-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          elemento.classList.add('is-visible');
          this.observer?.unobserve(elemento);
        }
      },
      { threshold: 0.15 }
    );

    this.observer.observe(elemento);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
