

export  default async function (args:AmpDescription): Promise<AmpDescription> {

  const $ = args.cheerio;
  $('head').children('[rel="manifest"]')
    .after(`<meta name="amp-google-client-id-api" content="googleanalytics">`);

  const anaScript = JSON.stringify({
    'vars': {
      'gtag_id': 'XXXYOUR-ANALYTICSXXXX',
      'config': {
        'XXXYOUR-ANALYTICS': { 'groups': 'default' },
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
  $('head').children('[src="https://cdn.ampproject.org/v0.js"]')
  .after(`<script async custom-element="amp-analytics"
src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>`);


  return args;
}
