import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

export interface SeoParams {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  constructor(private title: Title, private meta: Meta) {}

  setMeta(params: SeoParams) {
    if (params.title) {
      this.title.setTitle(params.title);
      this.meta.updateTag({ property: 'og:title', content: params.title });
      this.meta.updateTag({ name: 'twitter:title', content: params.title });
    }

    if (params.description) {
      this.meta.updateTag({ name: 'description', content: params.description });
      this.meta.updateTag({ property: 'og:description', content: params.description });
      this.meta.updateTag({ name: 'twitter:description', content: params.description });
    }

    if (params.url) {
      this.meta.updateTag({ property: 'og:url', content: params.url });
    }

    if (params.image) {
      this.meta.updateTag({ property: 'og:image', content: params.image });
      this.meta.updateTag({ name: 'twitter:image', content: params.image });
    }

    // Defaults
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
  }
}
