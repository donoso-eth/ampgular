import { JsonObject } from '../json-object';
import { Schema } from './schema';


export class Offer extends JsonObject<Schema> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'Offer',

    };

    constructor(options: Schema) {
    super(options);
    }
  }

export { Schema as OfferOptions } from './schema';
