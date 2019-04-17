import { JsonObject } from '../json-object';
import { Schema } from './schema';


export class Book extends JsonObject<Schema> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'Book',

    };

    constructor(options: Schema) {
    super(options);
    }
  }

export { Schema as BookOptions } from './schema';
