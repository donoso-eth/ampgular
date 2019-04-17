import { JsonObject } from '../json-object';
import { Schema } from './schema';


export class Logo extends JsonObject<Schema> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'ImageObject',

    };

    constructor(options: Schema) {
    super(options);
    }
  }

export { Schema as LogoOptions } from './schema';
