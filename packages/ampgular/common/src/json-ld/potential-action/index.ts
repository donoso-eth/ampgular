import { JsonObject } from '../json-object';
import { Schema } from './schema';


export class PotentialAction extends JsonObject<Schema> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'SearchAction',

    };

    constructor(options: Schema) {
    super(options);
    }
  }

export { Schema as PotentialActionOptions } from './schema';
