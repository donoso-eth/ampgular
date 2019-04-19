import { enableProdMode } from '@angular/core';
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
    enableProdMode();
    this.app = express();
    this.PORT = 8000;
  }

  async bootstrapServer(path: string, configuration: string) {
    const WORKING_FOLDER = join(process.cwd(), path);

   // const REQUIRE_PATH = '../../dist/' + configuration + '/main';

    const {
      AppServerModuleNgFactory,
      LAZY_MODULE_MAP,
    } = require(`../../dist/${configuration}/main`);

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
          console.log('YES ERVER IS ON');
          resolve(`Node Express server listening on http://localhost:${this.PORT}`);
        });
      } catch (error) {
        reject('ERROR');
      }
    });
  }
  shutdown() {
    this.server.close();
  }
}
