import { JsonObject } from '../json-object';
import { Schema } from './schema';


export class ContactPoint extends JsonObject<Schema> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'ContactPoint',

    };

    constructor(options: Schema) {
    super(options);
    }
  }

export { Schema as ContactPointOptions } from './schema';
