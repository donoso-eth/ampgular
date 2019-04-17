import { writeFileSync } from 'fs';
import { join } from 'path';
import { AmpDescription } from '../models/interface';
const PUBLIC_FOLDER = join(process.cwd(), 'dist', 'public');




const createSWInstallPage = async (args: AmpDescription) => {

  const html = `<!DOCTYPE html> <html><head>
            <title>installing service worker</title>
            <script type="text/javascript">
                var swsource = "${args.options.host}/ngsw-worker.js";
                if("serviceWorker" in navigator) {
                    navigator.serviceWorker.register(swsource).then(function(reg){
                        console.log('ServiceWorker scope: ', reg.scope);
                    }).catch(function(err) {
                        console.log('ServiceWorker registration failed: ', err);
                    });
                };
            </script>
            </head>
            <body>
            </body></html>`;


  writeFileSync(join(PUBLIC_FOLDER, '/sw.html'), html, 'utf-8');
};

export const installServiceWorker  = async  (args: AmpDescription): Promise<AmpDescription> => {
  const $ = args['cheerio'];
  $('body').prepend(  `<amp-install-serviceworker
  src="${args.options.host}/ngsw-worker.js"
  data-iframe-src="${args.options.host}/sw.html"
  layout="nodisplay">
</amp-install-serviceworker>`);

  await createSWInstallPage(args);

  return args;

};
