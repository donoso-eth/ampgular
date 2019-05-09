
import { ngExpressEngine } from '@nguniversal/express-engine';
import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';
import * as express from 'express';
import { join } from 'path';
import 'zone.js/dist/zone-node';

// const render = require('./render_webpack.js').renderserver;

// import * as render from './render_webpack.js';


export class ExpressNodeServer {
  // Faster server renders w/ Prod mode (dev mode never needed)
  app: express.Application;
  server: any;
  PORT: number;
  constructor() {

    this.app = express();
    this.PORT = 8020;
  }

  async bootstrapServer(workingFolder: string, bundlePath: string) {
    const WORKING_FOLDER = join(process.cwd(), workingFolder);

   // const REQUIRE_PATH = '../../dist/' + configuration + '/main';

    const {
      AppServerModuleNgFactory,
      LAZY_MODULE_MAP,
    } = require(`../../dist/${bundlePath}/main`);

    return new Promise((resolve, reject) => {

      try {
        this.app.engine(
          'html',
          ngExpressEngine({
            bootstrap: AppServerModuleNgFactory,
            providers: [provideModuleMap(LAZY_MODULE_MAP)],
          }),
        );
        this.app.set('view engine', 'html');
        this.app.set('views', WORKING_FOLDER);

        this.app.get(
          '*.*',
          express.static(WORKING_FOLDER, {
            maxAge: '1y',
          }),
        );
        this.app.get('*', (req, res) => {
          res.render('index', { req });
        });
        // Start up the Node server
        this.server = this.app.listen(this.PORT, () => {
          resolve(`Node Express server listening on http://localhost:${this.PORT}`);
        });
      } catch (error) {
        reject('ERROR');
      }
    });
  }
  async shutdown() {

    return new Promise((resolve, reject) => {

    this.server.close();
    resolve(`Node Express Closing http://localhost:${this.PORT}`);
    });
  }
}
