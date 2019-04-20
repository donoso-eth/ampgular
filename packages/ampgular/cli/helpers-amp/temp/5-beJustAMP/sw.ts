import { ampConfig } from "../../server-amp/settings/amp-routes";
import { AmpArgs } from '../../server-amp/helper/model';
import { join } from 'path';
import { writeFileSync } from 'fs';
const PUBLIC_FOLDER = join(process.cwd(), 'dist', 'public');

const html = `<!DOCTYPE html> <html><head>
            <title>installing service worker</title>
            <script type="text/javascript">
                var swsource = "${ampConfig['host']}/ngsw-worker.js";
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
            </body></html>`


const createSWInstallPage = async () => {
  writeFileSync(join(PUBLIC_FOLDER,'/sw.html'), html, 'utf-8');
}

export const installServiceWorker  = async  (args:AmpArgs):Promise<AmpArgs> => {
  const $ = args['cheerio']
  $('body').prepend(  `<amp-install-serviceworker
  src="${ampConfig['host']}/ngsw-worker.js"
  data-iframe-src="${ampConfig['host']}/sw.html"
  layout="nodisplay">
</amp-install-serviceworker>`)

await createSWInstallPage();  

return args

}
