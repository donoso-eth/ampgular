
import { renderModuleFactory } from '@angular/platform-server';
import { readFileSync } from 'fs';
import { join, normalize } from 'path';
import 'reflect-metadata';
import 'zone.js/dist/zone-node';
import { isDevMode, enableProdMode } from '@angular/core';


// Faster server renders w/ Prod mode (dev mode never needed)

if(isDevMode()) {
  enableProdMode();
}
// Express server
// const myUrl = process.argv.slice(2)[0];


// * NOTE :: leave this as require() since this file is built Dynamically from webpack

export async function renderserver(
  options: any, workingFolder: string, bundlePath: string): Promise<string> {

  const WORKING_FOLDER = join(process.cwd(), workingFolder);


  const indexTemplate = readFileSync(
    join(WORKING_FOLDER, 'index.html')).toString();


 // const REQUIRE_PATH = '../../dist/' + configuration + '/main';

  const {
      AppServerModuleNgFactory,
      LAZY_MODULE_MAP,
    } = require(`../../dist/${bundlePath}/main`);
  const {
    // tslint:disable-next-line:no-shadowed-variable
    provideModuleMap,
  } = require('@nguniversal/module-map-ngfactory-loader');


  return new Promise((resolve, reject) => {


 renderModuleFactory(AppServerModuleNgFactory, {
    document: indexTemplate,
    url: options.url,
    extraProviders: [provideModuleMap(LAZY_MODULE_MAP)],
  }).then(html => resolve(html))
    .catch(err => console.log(err));

  });
}
