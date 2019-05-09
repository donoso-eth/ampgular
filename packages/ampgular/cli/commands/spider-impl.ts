/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { join, normalize, resolve } from 'path';
import { createDocument, createWindow } from 'domino';
import { writeFileSync } from 'fs';
import * as minimatch from 'minimatch';
import { Observable, ReplaySubject, from } from 'rxjs';
import { concatMap, filter, flatMap, map, tap } from 'rxjs/operators';
import { cmp } from 'semver';
import { BaseCommandOptions } from '../models/command';
import { Arguments } from '../models/interface';
import { RenderCommand } from '../models/render-command';
import { Schema as SpiderOptions } from '../schemas/spider';
import { Version } from '../upgrade/version';
import { Schema as SpiderCommandSchema } from './spider';

export class SpiderCommand<T extends BaseCommandOptions = BaseCommandOptions>
extends RenderCommand<SpiderCommandSchema> {
  public readonly command = 'spider';
  public _renderPath = new ReplaySubject<string>(100);
  private _routesDone: Array<string> = [];
  private _routesExcluded: Array<string> = [];
  private _routesSpider = [];
  private _routesDiscovered: Array<string> = [];
  private _routesNoIndex: Array<string> = [];
  private _routesNoCanonical: Array<string> = [];
  private _routesQueryExcluded: Array<string> = [];
  private _routesCanonical: Array<string> = [];
  private _entryPaths: Array<string> = [];
  private _document: Document;
  public async run(options: SpiderOptions & Arguments): Promise<0 | 1> {
    this.commandConfigOptions = { ...this._ampgularConfig.spider as SpiderOptions,
                                  ... this.commandConfigOptions };
    await super.run(options);
    await this.validateAndLaunch();

    this._routesExcluded = [
      ...this._routesExcluded,
      ...(this.commandConfigOptions as SpiderOptions).excludePaths as string[],
    ];
    this._routesDiscovered = [
      ...this._routesDiscovered,
      ...(this.commandConfigOptions as SpiderOptions).entryPaths as string[],
    ];

    try {
      this._renderPath.next(this._routesDiscovered[0]);
      await this.launchEntry();

      return 0;
    } catch (e) {
      return 1;
    }
  }
  async launchEntry() {
    this.logger.info('');

    return new Promise((resolve, reject) => {
      this._renderPath
        .pipe(
          concatMap(async url => await this.renderUrl(url)),
          tap(html => this._ensureCanonical(html)),
          map(html => this._htmlToLinks(html)),
          map(urls => {
            return this._filterQuery(urls);
          }),
          map(exc => this._excludeUrls(exc)),
        )
        .subscribe(
          async htmlList => {
            this._routesDiscovered = this._routesDiscovered.concat(htmlList);
            const set = new Set(this._routesDiscovered);
            this._routesDiscovered = Array.from(set);

              //|| this._routesDone.length==100)

            if (this._routesDiscovered.length == 0 ) {
              this._renderPath.complete();
            } else {

              if ((this.commandConfigOptions as SpiderOptions).verbose) {
                this.logger.info(`Rendered: ${this._routesDone.length}, Discovered: ${
                  this._routesDiscovered.length}:   ${this._routesDiscovered[0]}`);
              } else {
                this.loggingSameLine(`Rendered: ${this._routesDone.length}, Discovered: ${
                  this._routesDiscovered.length
                  }`);
              }


              this._routesExcluded.push(this._routesDiscovered[0]);

              if ((this.commandConfigOptions as SpiderOptions).verbose) {
                this.logger.info(`Starting rendering:  ${this._routesDiscovered[0]}`);
              }


              this._renderPath.next(this._routesDiscovered[0]);
            }
          },
          error => { },
          () => {

            if ((this.commandConfigOptions as SpiderOptions).dryRun){
            this._writeVerbose(this._routesDone,'dry-run')

            } else {
            this._writeSummary();
            }

            if ((this.commandConfigOptions as SpiderOptions).verbose) {
              this._writeVerbose(this._routesNoIndex, 'no-index');
              this._writeVerbose(this._routesDiscovered, 'discovered');
              this._writeVerbose(this._routesQueryExcluded, 'query-excluded');
              if ((this.commandConfigOptions as SpiderOptions).ensureCanonical) {
                this._writeVerbose(this._routesCanonical, 'canonical');
                this._writeVerbose(this._routesNoCanonical, 'noCanonical');
              }

            }

            resolve(0);
          },
        );
    });
  }

  _writeSummary() {
    const basedir = normalize(process.cwd());
    const iniText = 'export const ROUTES: string[] = ';
    writeFileSync(join(basedir, '/ampgular/routes.ts'), iniText + JSON.stringify(this._routesDone));
  }

  _writeVerbose(routes: string[], name: string) {
    const basedir = normalize(process.cwd());
    writeFileSync(join(basedir, `/ampgular/_routes_${name}.json`), JSON.stringify(routes));

  }


  _ensureCanonical(html: string) {
    this._document = createDocument(html);
    const head = this._document.querySelector(
      'head',
    ) as HTMLHeadElement;


    const noIndex = head.querySelector(
      "[name='robots']",
    ) as HTMLMetaElement;
    if (noIndex !== undefined) {
      const noIndexContent = noIndex.getAttribute('content') as string;
      if (noIndexContent == 'noindex') {
        const myShift = this._routesDiscovered.shift() as string;
        if ((this.commandConfigOptions as SpiderOptions).verbose) {
          this.logger.info(`Page set NOINDEX: ${myShift} `);
        }
        this._routesNoIndex.push(myShift);
      }


      return;
    }


    if ((this.commandConfigOptions as SpiderOptions).ensureCanonical) {

      const canonical = head.querySelector(
        "[rel='canonical']",
      ) as HTMLLinkElement;


      if (canonical == undefined) {
        const myShift = this._routesDiscovered.shift() as string;
        if ((this.commandConfigOptions as SpiderOptions).verbose) {
          this.logger.info(`Canonical not Found: ${myShift} `);
        }
        this._routesNoCanonical.push(myShift);

        return;
      }

      const canoRef = canonical.getAttribute('href') as string;


      if (
        this._ampgularConfig.host + this._routesDiscovered[0] ==
        canoRef
      ) {
        const myShift = this._routesDiscovered.shift() as string;
        if ((this.commandConfigOptions as SpiderOptions).verbose) {
          this.logger.info(`Canonical Success: ${myShift} `);
        }
        this._routesCanonical.push(myShift);
        this._routesDone.push(myShift);
      } else {
        const myShift = this._routesDiscovered.shift() as string;
        if ((this.commandConfigOptions as SpiderOptions).verbose) {
          this.logger.info(`Canonical not Found: ${myShift} `);
        }
        this._routesNoCanonical.push(myShift);
      }
    } else {
      const myShift = this._routesDiscovered.shift() as string;
      this._routesDone.push(myShift);
    }
  }

  _filterQuery(urls: string[]): string[] {

    if (this.commandConfigOptions.excludeQuery == true) {

      this._routesQueryExcluded =
      this._routesQueryExcluded.concat(urls.filter(url => url.indexOf('?') !== -1));
      const set = new Set(this._routesQueryExcluded);
      this._routesQueryExcluded = Array.from(set);

      return urls.filter(url => url.indexOf('?') == -1);
    } else {
      return urls;
    }

  }

  _htmlToLinks(html: string): string[] {
    const routesHref = [];

    const body = this._document.querySelector('body') as HTMLBodyElement;
    const href = body.querySelectorAll('[href]');
    for (let index = 0; index < href.length; index++) {
      const attr = href.item(index).getAttribute('href') as string;
      if ( attr.indexOf(':') == -1){
        let myRoute= attr;

        if (attr.indexOf("#")!=-1){
          myRoute = attr.split("#")[0];
        }


        if (myRoute.substr(0,1)!="/"){
          myRoute = "/"+ myRoute
        }

        routesHref.push(myRoute)
      }

    }

    return routesHref;
  }

  _excludeUrls(routes: string[]): string[] {

    const rotuesNotExcluded = routes.filter(route =>
      this._routesExcluded.every(patternAr => {
        return minimatch(route, patternAr, {}) == false;
      }),
    );

    return rotuesNotExcluded;
  }
}
