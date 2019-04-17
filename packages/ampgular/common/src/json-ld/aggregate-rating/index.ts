import { JsonObject } from '../json-object';
import { Schema } from './schema';


export class AggregateRating extends JsonObject<Schema> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'AggregateRating',
    };

    constructor(options: Schema ) {
    super(options);
    }
  }

export { Schema as AggregateRatingtOptions } from './schema';
