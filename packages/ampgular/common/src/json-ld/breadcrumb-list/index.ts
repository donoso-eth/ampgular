import { JsonObject } from '../json-object';
import { Schema } from './schema';


export class BreadCrumbList extends JsonObject<Schema> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'BreadCrumbList',

    };

    constructor(options: Schema) {
    super(options);
    }
  }

export { Schema as BreadCrumbListOptions } from './schema';
