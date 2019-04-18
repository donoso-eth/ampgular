/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// tslint:disable
// tslint:disable:no-any non-null-operator no-big-function

import { join, json, normalize, terminal } from '@angular-devkit/core';
import { createConsoleLogger } from '@angular-devkit/core/node';
import { readFileSync } from 'fs';
import { getCommandDescription } from '../../commands/deploy-impl';
import { CommandWorkspace } from '../../models/interface';
import { ROUTES } from '../mocks/routes';
import { TestBed } from '../mocks/test-bed';


const angObj = {
  '$schema': '../node_modules/@ampgular/cli/lib/config/schema.json',
  'version': 1,
  'target': 'node',
  'host': 'https://madrid-day-spa.com',
  'buildConfig': {
    'configuration': 'production',
    'build': false,
  },
  'amp': {
    'cssOptimize': false,
    'ampValidation': false,
    'dynamicFiles': ['uno', 'dos'],
    'stateFiles': ['una', 'dos'],
    'serviceWorker': true,
    'pluginsFiles': ['three', 'four'],
    'host': '',
  },
  'renderConfig': {
    'node': {
      'webpack': false,
      'localhost': false,
    },
    'browser': {
      'port': '4000',
    },
  },
  'deploy': {
    'targetApp': 'prerender',
    'sitemap': true,
    'robots': true,
    'files': [{ 'from': '/src/_fonts.scss', 'to': 'public' }],
  },
  'prerender': {
    'routes': false,
    'static': true,
    'cssOptimize': false,
    'namedFiles': false,
  },
  'spider': {
    'entryPaths': [
      '/',
    ],
    'excludePaths': [
      '/es/exclusion1', '/es/exclusion2',
    ],
    'ensureCanonical': false,
    'excludeQuery': true,
    'build': false,
  },
  'sitemap': {
    'defaultPriority': 0.8,
    'defaultFrecuency': 'weekly',
    'custom': [
    ],
  },
};


describe('AMP SHOULD WORK', () => {

  let command: any;

  class MockWriteStream {
    lines: string[] = [];
    write(str: string) {
      // Strip color control characters.
      // this.lines.push(str.replace(/[^\x20-\x7F]\[\d+m/g, ''));

      return true;
    }
  }

  beforeEach(async function () {

    command = await TestBed.createCommand('me');

    spyOn(command, 'validateScope').and.returnValue(true);

    spyOn(command, 'checkOptions').and.returnValue(true);
    let i = 0;
    spyOn(command, '_readFile').and.callFake((path: string) => {
      i++;
      if (i == 1) {
        const file = JSON.parse(
          readFileSync(join(normalize(__dirname), '..', 'mocks/main_state_config.json')).toString(
            'utf-8',
          ));
        delete file.$schema;

        return file;

      } else if (i == 2) {
        const file = JSON.parse(
          readFileSync(join(normalize(__dirname), '..', 'mocks/second_state_config.json')).toString(
            'utf-8',
          ));
        delete file.$schema;

        return file;
      } else if (i == 3) {
        const file = JSON.parse(
          readFileSync(join(normalize(__dirname), '..', 'mocks/main_dynamic_config.json')).toString(
            'utf-8',
          ));
        delete file.$schema;

        return file;
      } else if (i == 4) {
        const file = JSON.parse(
          readFileSync(join(normalize(__dirname), '..'
          , 'mocks/second_dynamic_config.json')).toString(
            'utf-8',
          ));
        delete file.$schema;

        return file;
          } else {
        return {};
      }
      i++;

    });

    spyOn(command, '_getAmpRoutesConfig').and.returnValue(
      JSON.parse(
        readFileSync(join(normalize(__dirname), '..', 'mocks/amp_routes.json')).toString(
          'utf-8',
        ),
      ).ampRoutes,
      );

   // spyOn(process.stdout, 'write');

  });

  it('it should filter the ROUTES', async () => {

    command._ampgularConfig = Object.assign({}, angObj);
    command.commandConfigOptions = Object.assign({}, angObj.amp);
    spyOn(command, '_getRoutes').and.returnValue(ROUTES);

    try {
      await command.run();
    } catch (e) {

    }

    const numberRoutes = command.ROUTES.length;
    expect(command._toAmpROUTES.length).toBeGreaterThan(0);
    expect(command._toAmpROUTES.length).toBeLessThan(numberRoutes);
    expect(command._getRoutes.calls.count()).toEqual(1);
  });

  it('it  should create the global stateMap', async () => {

    command._ampgularConfig = Object.assign({}, angObj);
    command.commandConfigOptions = Object.assign({}, angObj.amp);

    spyOn(command, '_getRoutes').and.returnValue(ROUTES);
    try {
      await command.run();
    } catch (e) {

    }

    const nrKeysState = Object.keys(command.stateFilesMap).length;

    expect(nrKeysState).toBe(7);

  });

  // it('it  should create the page state associated to the route 1', async () => {

  //   command._ampgularConfig = Object.assign({}, angObj);
  //   command.commandConfigOptions = Object.assign({}, angObj.amp);

  //   spyOn(command, '_getRoutes').and.returnValue(['/es/nuilea-day-spa']);

  //   try {
  //     await command.run();
  //   } catch (e) {

  //   }

  //   expect(Object.keys(command._myPageState).length).toBe(1);
  //   expect(command._myPageState.menuOpen).toBeDefined();

  // });

  // it('it  should create the page state associated to the route 2', async () => {

  //   command._ampgularConfig = Object.assign({}, angObj);
  //   command.commandConfigOptions = Object.assign({}, angObj.amp);

  //   spyOn(command, '_getRoutes')
  //   // tslint:disable-next-line:max-line-length
  //   .and.returnValue(['/es/wellness-y-bienestar-natural/exoticos-y-maravillosos-masajes/reflexologia-tus-pies-en-las-nubes']);

  //   try {
  //     await command.run();
  //   } catch (e) {

  //   }
  //   expect(Object.keys(command._myPageState).length).toBe(4);
  //   expect(command._myPageState.menuOpen).toBeDefined();

  // });

  it('it  should create the global DynamicMap', async () => {

    command._ampgularConfig = Object.assign({}, angObj);
    command.commandConfigOptions = Object.assign({}, angObj.amp);

    spyOn(command, '_getRoutes').and.returnValue(ROUTES);


    try {
      await command.run();
    } catch (e) {

    }


    const nrKeysState = Object.keys(command.dynamicFilesMap).length;

    expect(nrKeysState).toBe(3);

  });

  // it('it  should create the page dynamic associated to the route 1', async () => {

  //   command._ampgularConfig = Object.assign({}, angObj);
  //   command.commandConfigOptions = Object.assign({}, angObj.amp);


  //   spyOn(command, '_getRoutes').and.returnValue(['/es/nuilea-day-spa']);

  //   try {
  //     await command.run();
  //   } catch (e) {

  //   }

  //   expect(Object.keys(command._myPageDynamic).length).toBe(0);


  // });

  // it('it  should create the page state associated to the route 2', async () => {

  //   command._ampgularConfig = Object.assign({}, angObj);
  //   command.commandConfigOptions = Object.assign({}, angObj.amp);


  //   spyOn(command, '_getRoutes')
  //   // tslint:disable-next-line:max-line-length
  //   .and.returnValue(['/es/wellness-y-bienestar-natural/exoticos-y-maravillosos-masajes/reflexologia-tus-pies-en-las-nubes']);

  //   try {
  //     await command.run();
  //   } catch (e) {

  //   }

  //   expect(Object.keys(command._myPageDynamic).length).toBe(1);
  //   expect(command._myPageDynamic.morningDeals).toBeDefined();

  // });

});
