/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// tslint:disable
// tslint:disable:no-any non-null-operator no-big-function


import { TargetApp } from '../../schemas/deploy';
import { TestBed, ampgularWorkspace } from '../mocks/test-bed';


describe('DEPPLOY SHOULD WORK', () => {
  let logger: any;
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
    stdout = new MockWriteStream();
    stderr = new MockWriteStream();
    // process.stdout.write = function(str:any) {
    //   return ''
    // };
    // spyOn(process.stdout, 'write').and.returnValue(true);


    command = await TestBed.createCommand('deploy');

    spyOn(command, 'validateScope').and.returnValue(true);
    spyOn(command, 'checkOptions').and.returnValue(true);
    spyOn(command, '_createClientBundle');
    spyOn(command, '_createServerBundle');
    spyOn(command, '_callPrerender');
    spyOn(command, '_createSiteMap');
    spyOn(command, '_copyRobots');
    spyOn(command, '_copyCustom');
    spyOn(process.stdout, 'write').and.returnValue(true);

  });

  it('it DEPLOY TARGET SPA Correctly', async () => {

    command._ampgularConfig = Object.assign({}, ampgularWorkspace) ;
    command.commandConfigOptions = Object.assign({}, ampgularWorkspace.prerender);
    command.commandConfigOptions.targetApp = TargetApp.Spa;
    command.commandConfigOptions.sitemap = false;

    try {
      await command.run();
    } catch (e) {

    }
    expect(command._createClientBundle.calls.count()).toEqual(1);
    expect(command._createServerBundle.calls.count()).toEqual(0);
    expect(command._callPrerender.calls.count()).toEqual(0);
    expect(command._createSiteMap.calls.count()).toEqual(0);
  });


  it('it call SITEMAP', async () => {

  command._ampgularConfig = Object.assign({}, ampgularWorkspace) ;
  command.commandConfigOptions = Object.assign({}, ampgularWorkspace.prerender);
  command.commandConfigOptions.targetApp = TargetApp.Spa;
  command.commandConfigOptions.sitemap = true;

  try {
    await command.run();
  } catch (e) {

  }
  expect(command._createClientBundle.calls.count()).toEqual(1);
  expect(command._createServerBundle.calls.count()).toEqual(0);
  expect(command._callPrerender.calls.count()).toEqual(0);
  expect(command._createSiteMap.calls.count()).toEqual(1);
});

  it('it copy Files and Prerender', async () => {

  command._ampgularConfig = Object.assign({}, ampgularWorkspace) ;
  command.commandConfigOptions = Object.assign({}, ampgularWorkspace.prerender);
  command.commandConfigOptions.targetApp = TargetApp.Prerender;
  command.commandConfigOptions.sitemap = false;
  command.commandConfigOptions.robots = false;
  command.commandConfigOptions.files = [{from: '/madrid', to: 'spa'},
                                        {from: '/madrid', to: 'spa'}];

  try {
    await command.run();
  } catch (e) {

  }
  expect(command._createClientBundle.calls.count()).toEqual(1);
  expect(command._createServerBundle.calls.count()).toEqual(1);
  expect(command._callPrerender.calls.count()).toEqual(1);
  expect(command._createSiteMap.calls.count()).toEqual(0);
  expect(command._copyCustom.calls.count()).toEqual(1);

});


});
