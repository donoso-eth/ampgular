import { JsonObject } from '../json-object';
import { Schema } from './schema';


export class Course extends JsonObject<Schema> {
    public jsonld = {
      '@context': 'https://schema.org/',
      '@type': 'Course',

    };

    constructor(options: Schema) {
    super(options);
    }
  }

export { Schema as CourseOptions } from './schema';
