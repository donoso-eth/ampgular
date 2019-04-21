import { AmpDescription } from '../models/interface';
import { installServiceWorker } from './install-service-worker';
import { Mode } from '../schemas/amp';
import { AmpComponents } from './whitelistedtags';


const embedScripts = async (args: AmpDescription): Promise<AmpDescription> => {


  const $ = args['cheerio'];

  /*
   * INSTALL SERVICE WORKER ONLY IN DEPLOY MODE
   */
    if (args.options.serviceWorker && args.options.mode == Mode.Deploy) {
    args.customScript.push('amp-install-serviceworker');
    args = await installServiceWorker(args);
  }

  /*
   * EXTRACT JSON-LD PRIOR TO REMOVE SCRIPTS
   */
  const JSONLD = $('[type=\'application/ld+json\']');


   /*
   * REMOVE SCRIPTS aand STYLES
   */
  $('link').remove('[rel=\'stylesheet\']');
  $('script').remove();
  $('head').children().remove('style');


   /*
   * EMDEB MANDATORY AMP SCRIPTS AND BOILER PLATE
   */
  $('head').children('[charset="utf-8"]')
    .after('<script async src="https://cdn.ampproject.org/v0.js"></script>');
    $('head').append(`<style amp-boilerplate>body{-webkit-animation:
      -amp-start 8s steps(1,end) 0s 1 normal both;
      -moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:
      -amp-start 8s steps(1,end
        ) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes
        -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes
         -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes
         -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes
          -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes
           -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
    <noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;
      -ms-animation:none;animation:none}</style></noscript>`);

  /*
   * EMDEB OPTIMIZED AND SLIM FIT CSS
   */
  $('head').append('<style amp-custom>' + args['singleUniStyle'] + '</style>');



  /*
   * EMDEB CUSTOM COMPONENTS SCRIPTS
   */
  args['customScript'].forEach(script => {
    $('head').children('[src="https://cdn.ampproject.org/v0.js"]')
      .after(`<script async custom-element="${script}"
     src="https://cdn.ampproject.org/v0/${script}-${AmpComponents[script]}.js"></script>`);

  });

  /*
   * EMDEB CUSTOM JSON-LD
   */
  $('head').append(JSONLD);










  return args;

};

export const BeJustAmp = async (
  args: AmpDescription,
): Promise<AmpDescription> => {
  args = await embedScripts(args);

  return args;
};
