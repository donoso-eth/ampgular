import { JsonObject } from '../json-object';
import { Schema } from './schema';


export class WebSite extends  JsonObject<Schema> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'WebSite',
    };

    constructor(options: Schema ) {
    super(options);
    }
  }

export { Schema as WebSiteOptions } from './schema';
