import { JsonObject } from '../json-object';
import { Schema } from './schema';


export class Person extends JsonObject<Schema> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'Person',

    };

    constructor(options: Schema) {
    super(options);
    }
  }

export { Schema as PersonOptions } from './schema';
