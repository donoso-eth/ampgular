import { JsonObject } from '../json-object';
import { Schema } from './schema';


export class Article extends JsonObject<Schema> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'Article',

    };

    constructor(options: Schema) {
    super(options);
    }
  }

export { Schema as ArticleOptions } from './schema';
