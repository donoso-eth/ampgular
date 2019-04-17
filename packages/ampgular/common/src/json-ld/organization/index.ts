import { JsonObject } from '../json-object';
import { Schema } from './schema';


export class Organization extends JsonObject<Schema> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'Organization',

    };

    constructor(options: Schema) {
    super(options);
    }
  }

export { Schema as OrganizationOptions } from './schema';
