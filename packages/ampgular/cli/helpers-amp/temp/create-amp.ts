
// These are importnaant and needed before anything else
import * as minimatch from "minimatch";
import { load } from 'cheerio';
import { renderModuleFactory } from "@angular/platform-server";
import { enableProdMode } from "@angular/core";

import { Request, Response } from 'express';
// import { platformServer, renderModule, renderModuleFactory } from '@angular/platform-server';

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync
} from 'fs';
enableProdMode();
const amphtmlValidator = require('amphtml-validator');
// Express server

import { ROUTES } from "../server/routes";
import { ToOptimizeCSS } from './3-beOptimized/optimize-css';
import { recreateDynamicData } from './4-beSmart/recreateDynamicData';
import { recreatePlugins } from './4-beSmart/recreatePlugins';
import { recreateState } from './4-beSmart/recreateState';
import { BuildPageStateSpec, CssAllTogether} from './beReady';
import { optimizeAmp } from './css';
import { customFunctions, embedScripts } from './frame-custom';
import { recreateBind } from './frame-state';
import { AmpArgs } from './helper/model';
import { ampConfig, staticConfig } from './settings/amp-routes';
import { whiteListed } from './whitelistedtags';


const PUBLIC_FOLDER = join(process.cwd(), 'dist', 'public');
const AMP_FOLDER = join(process.cwd(), 'dist', 'amp');


let toAmpROUTES =  ROUTES.filter(route => {

  return staticConfig['amp'].some(config => {

    if (config['length'] == undefined) {
        return config['match'].some(patternAr =>
          minimatch(route, patternAr, {}));
        } else {


      return config['match'].some(patternAr =>
        minimatch(route, patternAr, {})) && route.split('/').length == config['length'];
    }
  });
});

if (ampConfig['test']) {
  toAmpROUTES = toAmpROUTES.slice(0, 1);
}


const renderAmp = async() => {
  let i = 0;
  for (const route  of toAmpROUTES) {
    const indexHtml = readFileSync(join(AMP_FOLDER, route, 'index.html')).toString();
    const publicindex = readFileSync(join(PUBLIC_FOLDER, route, 'index.html')).toString();
    const only$ = load(publicindex);
    i++;

    const b  = only$("[rel=\'canonical\']");
    const amphtml = only$("[rel=\'amphtml\']");
    if (amphtml.length == 0) {
    only$('head').children("[rel=\'canonical\']").after('<link rel="amphtml" href="' + b.attr('href') + '/amp" />');
    writeFileSync(join(PUBLIC_FOLDER, route, '/index.html'), only$.html(), 'utf-8');
    }
    let $ = load(indexHtml);

    let args: AmpArgs = {
    'cheerio': $,
    'singleUniStyle': '',
    'indexHtml': $.html(),
    'angCompo': [],
    'customScript': [],
    'route': route,
    'state': {},
    };


    args = await BuildPageStateSpec(args);


    args = await CssAllTogether (args);


    if (ampConfig['cssOptimize']) {
    args = await ToOptimizeCSS(args);
  }

/* Read HTML*/
  // const $ = load(indexHtml);

    $ = args['cheerio'];
  /* CHANGE APP-ROOT */
  /// $('app-root').attr
    $('app-root').each((index, element) => {
    element.tagName = 'div';

  });


    const customTags = [];


    const elements = $('*');
    elements.each((index, element) => {

      if (whiteListed.indexOf(element.tagName.toLocaleLowerCase()) === -1) {

          if (customTags.indexOf(element.tagName) === -1) {
              customTags.push(
                  element.tagName,
              );
           }

      } else {
       }

  });


    if (customTags.indexOf('picture') !== -1) {
    args =   customFunctions['picture']('picture', args);
  }


    customTags.filter(x => x !== 'picture').forEach(tag => {
   if (customFunctions[tag] != undefined) {
    args =   customFunctions[tag](tag, args);
   } else {
    $(tag).each((index, element) => {
      element.tagName = 'div';

    });
   }


  });
    $('section').attr('appbackground', null);
    $('div').attr('classname', null);
    $('div').attr('ng-transclude', null);
    $('div').attr('appbackground', null);
    $('svg').attr('alt', null);
    $('svg').attr('space', null);
    $('div').attr('appscroll', null);
    $('div').attr('matripple', null);
    $('div').attr('mat-ripple', null);
    $('a').attr('routerlink', null);
    $('a').attr('target', null);
    $('a').attr('routerlinkactive', null);
    $('a').attr('noreferrer', null);
    $('a').attr('noopener', null);
    $('a').attr('nofollow', null);
    $('a').attr('ui-sref', null);
    $('a').attr('alt', null);
    $('a').attr('target', null);
    $('input').attr('formcontrolname', null);
    $('input').attr('matinput', null);
    $('button').attr('matsteppernext', null);
    $('button').attr('mat-input', null);
    $('button').attr('mat-button', null);
    $('textarea').attr('mattextareaautosize', null);
    $('textarea').attr('matinput', null);
    $('textarea').attr('value', null);
    $('*').attr('ng-version', null);
    $('*').attr('onclick', null);
    $('*').attr('cass', null);


    // if Config amp to optimize css then OPTOIMIZE


    // args = await CsstoSpec(args)


    args = await recreateState(args);
    args = await recreateDynamicData(args);
    args = await recreatePlugins(args);
    // args = recreateBind(args);


    args = await embedScripts(args);


    if (!existsSync(join(PUBLIC_FOLDER, route, 'amp'))) {
    mkdirSync(join(PUBLIC_FOLDER, route, 'amp'));
  }


    const myAMPHtml = args['cheerio'].html().replace('<html', '<html amp');

    if (ampConfig['ampValidation']) { await validateAMP(myAMPHtml, route); }


    if (ampConfig['test']) {
  writeFileSync(join(PUBLIC_FOLDER, '/index.html'), myAMPHtml
  , 'utf-8');


} else {
  writeFileSync(join(PUBLIC_FOLDER, route, 'amp/index.html'), myAMPHtml
  , 'utf-8');
}


  }

};
const validateAMP = async(html: string, route: string): Promise<any> => {
  return new Promise((resolve, reject) => {
  amphtmlValidator.getInstance().then(function (validator) {
    const result = validator.validateString(html);
    ((result.status === 'PASS') ? console.log  : console.error)(result.status + ': '  + route) ;
    for (let ii = 0; ii < result.errors.length; ii++) {
      const error = result.errors[ii];
      let msg = 'line ' + error.line + ', col ' + error.col + ': ' + error.message;
      if (error.specUrl !== null) {
        msg += ' (see ' + error.specUrl + ')';
      }
      ((error.severity === 'ERROR') ? console.error : console.warn)(msg);
    }
    resolve();
  });
});
};


renderAmp();
