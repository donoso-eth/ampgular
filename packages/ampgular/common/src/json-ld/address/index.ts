import { JsonObject } from '../json-object';
import { Schema } from './schema';


export class Address extends JsonObject<Schema> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'PostalAddress',

    };

    constructor(options: Schema) {
    super(options);
    }
  }

export { Schema as AddressOptions } from './schema';
