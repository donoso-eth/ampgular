import { JsonObject } from '../json-object';
import { Schema } from './schema';


export class ReviewRating extends JsonObject<Schema> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'Rating',
    };

    constructor(options: Schema ) {
    super(options);
    }
  }

export { Schema as RatingtOptions } from './schema';
