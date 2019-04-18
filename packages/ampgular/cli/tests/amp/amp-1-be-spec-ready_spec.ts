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
import { BeReadySpec } from '../../helpers-amp/amp-1-be-spec-ready';
import { AmpDescription, CommandWorkspace } from '../../models/interface';
import { TestBed } from '../mocks/test-bed';

describe('BE READY SPEC STYLES & COMPONENTS', () => {
  let logger: any;
  let ampDescription: AmpDescription;

  class MockWriteStream {
    lines: string[] = [];
    write(str: string) {
      // Strip color control characters.
      // this.lines.push(str.replace(/[^\x20-\x7F]\[\d+m/g, ''));

      return true;
    }
  }

  beforeEach(async function () {

    ampDescription = await TestBed.mockAmpDescription();

   // spyOn(command, 'validateScope').and.returnValue(true)


   // spyOn(process.stdout, 'write');

  });

  it('it should remove all custom components and styles tag from document', async () => {

    ampDescription.options = {
        cssOptimize: false,
        ampValidation: false,
        dynamicFiles: [],
        stateFiles: [],
        serviceWorker: true,
        pluginsFiles: [''],
        host: '',
    };

    const BeReadySpecClass = jasmine.createSpy('BeReadySpec');


    ampDescription =  await BeReadySpec(ampDescription);

    const html = ampDescription.cheerio.html();


    expect(html.length).not.toBe(0);
    expect(html).not.toMatch(/<app-root/g);
    expect(html).not.toMatch(/<app-/g);
    expect(ampDescription.cheerio('style').length).toBe(0);


  });


});
