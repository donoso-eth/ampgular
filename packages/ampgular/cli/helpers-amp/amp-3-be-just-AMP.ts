import { AmpDescription } from '../models/interface';
import { installServiceWorker } from './install-service-worker';


const embedScripts = async (args: AmpDescription): Promise<AmpDescription> => {


  const $ = args['cheerio'];


  const JSONLD = $('[type=\'application/ld+json\']');


  $('link').remove('[rel=\'stylesheet\']');
  $('script').remove();

  $('head').children('[charset="utf-8"]')
  .after('<script async src="https://cdn.ampproject.org/v0.js"></script>');

  $('head').children('[src="https://cdn.ampproject.org/v0.js"]')
  .after(`<script async custom-template="amp-mustache"
  src="https://cdn.ampproject.org/v0/amp-mustache-0.2.js"></script>`);


  $('head').children('[src="https://cdn.ampproject.org/v0.js"]')
 .after(`<script async custom-element="amp-list"
 src="https://cdn.ampproject.org/v0/amp-list-0.1.js"></script>`);

  $('head').children('[src="https://cdn.ampproject.org/v0.js"]')
  .after(`<script async custom-element="amp-analytics"
  src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>`);

  $('head').children('[src="https://cdn.ampproject.org/v0.js"]')
  .after(`<script async custom-element="amp-form"
  src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>`);

  $('head').children('[src="https://cdn.ampproject.org/v0.js"]')
  .after(`<script async custom-element="amp-bind"
  src="https://cdn.ampproject.org/v0/amp-bind-0.1.js"></script>`);

  args['customScript'].forEach(script => {
     $('head').children('[src="https://cdn.ampproject.org/v0.js"]')
     .after(`<script async custom-element="' + script + '"
     src="https://cdn.ampproject.org/v0/' + script + '-0.1.js"></script>`);

 });

  $('head').children().remove('style');

  $('head').append('<style amp-custom>' + args['singleUniStyle'] + '</style>');

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

  $('head').children('[rel="manifest"]')
  .after(`<meta name="amp-google-client-id-api" content="googleanalytics">`);

  const anaScript =  JSON.stringify({ 'vars' : {
   'gtag_id': 'UA-115673518-1',
   'config' : {
     'UA-115673518-1': { 'groups': 'default' },
   },
 },
                                      'triggers': {
   'trackPageView': {
     'on': 'visible',
     'request': 'pageview',
   },
 },
                                      'linkers': {
   'enabled': true,
 },
 });
  const analitics = `<amp-analytics type="gtag" data-credentials="include">
 <script type="application/json">
  ${anaScript}
 </script>
 </amp-analytics>`;

  $('body').prepend(analitics);

  if (args.options.serviceWorker) {
   $('head').children('[src="https://cdn.ampproject.org/v0.js"]')
   .after(`<script async custom-element="amp-install-serviceworker"
   src="https://cdn.ampproject.org/v0/amp-install-serviceworker-0.1.js"></script>`);

   //args = await installServiceWorker(args);
 }

  $('head').append(JSONLD);

  const alterGroup = $("[rel=\'alternate\']");

  alterGroup.each((index, ele: CheerioElement) => {
   ele.attribs['href'] = ele.attribs['href'] + '/amp';
 });




  return args;

 };

export const BeJustAmp = async (
  args: AmpDescription,
): Promise<AmpDescription> => {
  args = await embedScripts(args);

  return args;
};
