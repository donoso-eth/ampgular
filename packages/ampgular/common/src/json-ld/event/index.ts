import { JsonObject } from '../json-object';
import { Schema } from './schema';


export class Event extends JsonObject<Schema> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'Event',

    };

    constructor(options: Schema) {
    super(options);
    }
  }

export { Schema as EventOptions } from './schema';
