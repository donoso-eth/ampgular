import { JsonObject } from '../json-object';
import { Schema } from './schema';

// TO DO Inxlusde Potentoal Action


export class Location extends JsonObject<Schema> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'Place',

    };

    constructor(options: Schema) {
    super(options);
    }
  }

export { Schema as LocationOptions } from './schema';
