/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// tslint:disable:no-any non-null-operator no-big-function

import { join, json, normalize, terminal } from '@angular-devkit/core';
import { createConsoleLogger } from '@angular-devkit/core/node';
import { readFileSync } from 'fs';
import { getCommandDescription } from '../../commands/deploy-impl';
import { CommandWorkspace } from '../../models/interface';
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


describe('SPIDER SHOULD WORK', () => {

  let command: any;

  class MockWriteStream {
    lines: string[] = [];
    write(str: string) {
      // Strip color control characters.
      // this.lines.push(str.replace(/[^\x20-\x7F]\[\d+m/g, ''));

      return true;
    }
  }
  let stdout: MockWriteStream, stderr: MockWriteStream;
  beforeEach(async function () {

    command = await TestBed.createCommand('spider');

    spyOn(command, 'validateScope').and.returnValue(true);
    spyOn(command, 'renderUrl').and.callFake((url: any) => {

      if (url == '/') {

        return `<html> <head>  </head> <body> <a href="/es/hola">  </body> </html>`;
      } else if (url == '/es/hola') {

        return `<html> <head> <link rel='canonical'   href="https://madrid-day-spa.com/es/hola"> </head> <body> <a href="/es/test2">  <a href="/es/test?test=test"> </body> </html>`;
      } else if (url == '/es/test2') {

        return `<html> <head>  <meta name="robots" content="noindex"> </head> <body>  </body> </html>`;
      } else {
        return `<html> <head> </head> <body>  </body> </html>`;
      }


    });

    spyOn(command, 'checkOptions').and.returnValue(true);
    spyOn(command, '_writeSummary').and.returnValue(true);
    spyOn(command, '_writeVerbose').and.returnValue(true);

    spyOn(process.stdout, 'write');

  });

  it('it SPIDER rotues', async () => {

    command._ampgularConfig = Object.assign({}, angObj);
    command.commandConfigOptions = Object.assign({}, angObj.spider);
    command.commandConfigOptions.ensureCanonical = false;

    try {
      await command.run();
    } catch (e) {

    }
    expect(command._routesDone.length).toBe(2);
    expect(command._routesNoIndex.length).toBe(1);
  });

  it('it SPIDER ensure Canonical', async () => {

    const spideOptions = {
      'entryPaths': [
        '/',
      ],
      'excludePaths': [
        '/es/exclusion1', '/es/exclusion2',
      ],
      'ensureCanonical': true,
      'excludeQuery': true,
      'build': false,
    };

    command._ampgularConfig = Object.assign({}, angObj);
    command.commandConfigOptions =  Object.assign({}, spideOptions);


    try {
    await command.run();
    } catch (e) {

    }
    console.log(command._routesDone);
    const routesLength = command._routesDone.length;
    expect(routesLength).toBe(1);
    expect(command._routesNoIndex.length).toBe(1);
    expect(command._routesNoCanonical.length).toBe(1);
    expect(command._routesCanonical.length).toBe(1);
  });


  it('it SPIDER ensure excludePaths', async () => {

    command._ampgularConfig = Object.assign({}, angObj);
    command.commandConfigOptions =  Object.assign({}, angObj.spider);
    command.commandConfigOptions.excludePaths = ['/es/hola'];
    command.commandConfigOptions.excludeQuery = true;

    try {
    await command.run();
    } catch (e) {

    }

    const routesLength = command._routesDone.length;

    expect(routesLength).toBe(1);
    expect(command._routesNoCanonical.length).toBe(0);
    expect(command._routesCanonical.length).toBe(0);
  });

  it('it SPIDER filter Query', async () => {

    command._ampgularConfig = Object.assign({}, angObj);
    command.commandConfigOptions =  Object.assign({}, angObj.spider);
    command.commandConfigOptions.excludeQuery = false;

    try {
    await command.run();
    } catch (e) {

    }


    expect(command._routesDone.length).toBe(3);
    expect(command._routesNoIndex.length).toBe(1);

  });

  it('it SPIDER Verbose', async () => {
    const spideOptions = {
      'entryPaths': [
        '/',
      ],
      'excludePaths': [
        '/es/exclusion1', '/es/exclusion2',
      ],
      'ensureCanonical': false,
      'excludeQuery': true,
      'build': false,
    };

    command._ampgularConfig = Object.assign({}, angObj);
    command.commandConfigOptions =  Object.assign({}, angObj.spider);
    command.commandConfigOptions.verbose = true;


   // console.log('asdasd' + mSpy.calls.count())
    try {
    await command.run();
    } catch (e) {

    }
    expect(command._writeVerbose.calls.count()).toEqual(2);


  });

  it('it SPIDER Verbose Canonical', async () => {
    const spideOptions = {
      'entryPaths': [
        '/',
      ],
      'excludePaths': [
        '/es/exclusion1', '/es/exclusion2',
      ],
      'ensureCanonical': true,
      'excludeQuery': true,
      'build': false,
    };

    command._ampgularConfig = Object.assign({}, angObj);
    command.commandConfigOptions =  Object.assign({}, angObj.spider);
    command.commandConfigOptions.verbose = true;
    command.commandConfigOptions.ensureCanonical = true;


    try {
    await command.run();
    } catch (e) {

    }
    expect(command._writeVerbose.calls.count()).toEqual(4);


  });


});
