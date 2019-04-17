import 'zone.js/dist/zone-node';
import { enableProdMode } from '@angular/core';
// Express Engine
import { ngExpressEngine } from '@nguniversal/express-engine';
// Import module map for lazy loading
import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';

import * as express from 'express';
import { join } from 'path';

// const render = require('./render_webpack.js').renderserver;

// import * as render from './render_webpack.js';


const {
  AppServerModuleNgFactory,
  LAZY_MODULE_MAP
} = require('../../dist/server/main');
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

  async bootstrapServer(path:string) {
    return new Promise((resolve, reject) => {
      const WORKING_FOLDER = join(process.cwd(), path);
      try {
        this.app.engine(
          'html',
          ngExpressEngine({
            bootstrap: AppServerModuleNgFactory,
            providers: [provideModuleMap(LAZY_MODULE_MAP)]
          })
        );
        this.app.set('view engine', 'html');
        this.app.set('views', WORKING_FOLDER);

        this.app.get(
          '*.*',
          express.static(WORKING_FOLDER, {
            maxAge: '1y'
          })
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
  shutdown() {
    this.server.close();
  }