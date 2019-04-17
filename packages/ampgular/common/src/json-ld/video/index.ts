import { JsonObject } from '../json-object';
import { Schema } from './schema';


export class Video extends JsonObject<Schema> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'Videos',
    };

    constructor(options: Schema ) {
    super(options);
    }
  }

export { Schema as VideoOptions } from './schema';
