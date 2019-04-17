
import { matFormFieldPlugin } from './matFormFieldPlugin';

export const plugins = {
  matFormField: {
    routes: {
      match: [
        '/es/about-us-nuilea-day-spa/contacto',
        '/en/about-us-nuilea-day-spa/contact',
        '/de/ueber-uns-spa-madrid/kontakt',
        '/fr/about-us-nuilea-day-spa/contact',
      ],
    },
    whiteListed: ['mat-form-field-should-float'],
    plugin: matFormFieldPlugin,
  },
};
