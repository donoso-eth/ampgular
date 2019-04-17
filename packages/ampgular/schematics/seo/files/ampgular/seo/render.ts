import 'zone.js/dist/zone-node';
import 'reflect-metadata';

import { renderModuleFactory } from '@angular/platform-server';

import {join, normalize} from 'path';
import { readFileSync } from 'fs';
import { enableProdMode } from '@angular/core';


// Faster server renders w/ Prod mode (dev mode never needed)

// enableProdMode();
// Express server
// const myUrl = process.argv.slice(2)[0];


// * NOTE :: leave this as require() since this file is built Dynamically from webpack

export async function renderserver(options: any, path: string): Promise<any> {

  const basedir = normalize(process.cwd());
  const WORKING_FOLDER = join(basedir, path);

  // Our index.html we'll use as our template


  const indexTemplate = readFileSync(
    join(WORKING_FOLDER, 'index.html')).toString();


  // * NOTE :: leave this as require() since this file is built Dynamically from webpack
  const {
    // tslint:disable-next-line:no-shadowed-variable
    AppServerModuleNgFactory,
    // tslint:disable-next-line:no-shadowed-variable
    LAZY_MODULE_MAP
  } = require('../../dist/server/main');
  const {
    // tslint:disable-next-line:no-shadowed-variable
    provideModuleMap
  } = require('@nguniversal/module-map-ngfactory-loader');



  return new Promise((resolve, reject) => {


 renderModuleFactory(AppServerModuleNgFactory, {
    document: indexTemplate,
    url: options.url,
    extraProviders: [provideModuleMap(LAZY_MODULE_MAP)]
  }).then(html => resolve(html))
    .catch(err => console.log(err));

  });
}