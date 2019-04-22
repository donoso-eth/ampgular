/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// tslint:disable
// tslint:disable:no-any non-null-operator no-big-function


import {  createDocument } from 'domino';
import { prepareCss } from '../../helpers-seo/optimize-css';
import { TestBed, ampgularWorkspace } from '../mocks/test-bed';
import { Mode } from '../../schemas/prerender';


describe ('OPTIMIZE CSS', () => {
  it('it Optimize CSS Properly ', async () => {

    const html = `<html> <head>
    <link rel="stylesheet" href="styles.css">
     <style>  .test1 { color:red;} .testDelete:{background:yellow}</style>
     <style> .test3 { color:green;} .test2Delete:{background:red}</style>
    </head> <body> <h2 class="test1">  <p class="test3"> Madrid Day Spa test</p>  </body> </html>`;
    const htmlOptimized = await prepareCss(html,true,'', Mode.Render,"production");

    const document = createDocument(htmlOptimized);
    const head = document.querySelector(
      'head',
    ) as HTMLHeadElement;

    const linkCss = head.querySelector(
      "[rel='stylesheet']",
    ) as HTMLLinkElement;

    const styles = head.querySelectorAll(
      'style',
    ) ;

    const body = document.querySelector(
      'body',
    ) as HTMLBodyElement;

    const linkCssBody = body.querySelector(
      "[rel='stylesheet']",
    ) as HTMLLinkElement;


    expect(styles.item(0).textContent).not.toContain('Delete');
    expect(styles.length).toBe(1);
    expect(linkCss).toBeUndefined();
    expect(linkCssBody).not.toBeUndefined();
  });
});


describe('PRERENDER SHOULD WORK', () => {
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
    spyOn(process.stdout, 'write').and.returnValue(true);


    command = await TestBed.createCommand('prerender');

    spyOn(command, 'validateScope').and.returnValue(true);
    spyOn(command, 'renderUrl').and.callFake((url: any) => {

      if (url == '/') {

        return `<html> <head>  </head> <body> <a href="/es/hola">  </body> </html>`;
      } else if (url == '/es/hola') {

        return `<html> <head> <link rel='canonical'   href="https://www.nuilea.com/es/hola"> </head> <body> <a href="/es/test2">  <a href="/es/test?test=test"> </body> </html>`;
      } else if (url == '/es/test2') {

        return `<html> <head>  <meta name="robots" content="noindex"> </head> <body>  </body> </html>`;
      } else {
        return `<html> <head> </head> <body>  </body> </html>`;
      }


    });

    spyOn(command, 'checkOptions').and.returnValue(true);
    spyOn(command, '_writefile').and.returnValue(true);
    spyOn(command, '_getRoutes').and.returnValue(['/', '/es/hola', '/es/test2']);


  });

  // it("it PRERENDER rotues", async () => {

  //   command._ampgularConfig = Object.assign({},ampgularWorkspace) ;
  //   command.commandConfigOptions = Object.assign({}, ampgularWorkspace.prerender);


  //   try {
  //     await command.run();
  //   }
  //   catch (e) {

  //   }
  //   expect(command._writefile.calls.count()).toEqual(3);
  // });

  it('it NAMEDFILES properly', async () => {

    spyOn(command, '_prepareWriting').and.callFake((route: string, name: string, html: string) => {
      if (route == '/') {
        expect(name).toEqual('index.html');
      } else {
        expect(route).toEqual('/es');
        expect(name).not.toEqual('index.html');
      }

      return true;

  });


    command._ampgularConfig = Object.assign({}, ampgularWorkspace);
    command.commandConfigOptions = Object.assign({}, ampgularWorkspace.prerender);
    command.commandConfigOptions.namedFiles =  true;

    try {
      await command.run();
    } catch (e) {

    }


  });


});
