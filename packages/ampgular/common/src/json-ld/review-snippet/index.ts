import { JsonObject } from '../json-object';
import { Schema } from './schema';


export class ReviewSnippet extends JsonObject<Schema> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'Review',
    };

    constructor(options: Schema ) {
    super(options);
    }
  }

export { Schema as RatingtSnippetOptions } from './schema';
