import { JsonObject } from '../json-object';
import { Schema as ProductOptions } from './schema';


export class Product extends JsonObject<ProductOptions> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: '',
      image: ['https://example.com/photos/1x1/photo.jpg'],
      description: '',
      mpn: '',
    };

    constructor(options: ProductOptions) {
    super(options);
    }
  }

export { Schema as ProductOptions } from './schema';
