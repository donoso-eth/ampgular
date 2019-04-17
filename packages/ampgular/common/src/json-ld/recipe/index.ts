import { JsonObject } from '../json-object';
import { Schema } from './schema';


export class Recipe extends JsonObject<Schema> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'Recipe',
    };

    constructor(options: Schema ) {
    super(options);
    }
  }

export { Schema as RecipeOptions } from './schema';
