/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Path, basename, dirname, join, normalize, resolve, terminal } from '@angular-devkit/core';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { runInThisContext } from 'vm';
import { optimizeStatic } from '../helpers-seo/optimize-css';
import { BaseCommandOptions } from '../models/command';
import { Arguments } from '../models/interface';
import { RenderCommand } from '../models/render-command';
import { Schema as PrerenderOptions } from '../schemas/prerender';
import { getRoutes } from '../utilities/utils';
import { Schema as PrerenderCommandSchema } from './prerender';

export class PrerenderCommand<T extends BaseCommandOptions = BaseCommandOptions>
 extends RenderCommand<PrerenderCommandSchema> {
  public readonly command = 'prerender';
  private _commandptions: PrerenderOptions;
  private ROUTES: string[];

  public async run(options: PrerenderOptions & Arguments): Promise<0 | 1> {
    this.commandConfigOptions = {
      ...this._ampgularConfig.prerender as PrerenderOptions,
      ...this.commandConfigOptions };
    await super.run(options);
    await this.validateAndLaunch();

    this.ROUTES = this._getRoutes();
    this.logger.info(`Starting Prerendering of ${this.ROUTES.length} routes/paths`);

    if (!existsSync(this.PUBLIC_PATH)) {
      mkdirSync(this.PUBLIC_PATH);
    }
    let i = 1;

    for (const route of this.ROUTES) {

      let html = await this.renderUrl(route);

      if ((this.commandConfigOptions as PrerenderOptions).cssOptimize) {
        html = await optimizeStatic(html);
      }
      /// writing index
      if (route == '' || route == '/') {
        this._prepareWriting(route, 'index.html', html);
      } else if ((this.commandConfigOptions as PrerenderOptions).namedFiles) {

        const nameFile = basename(normalize(route));
        const routeSplit = route.split('/');
        routeSplit.pop();
        const newRoute = routeSplit.join('/');
        this._prepareWriting(newRoute, nameFile + '.html', html);
      } else {
        this._prepareWriting(route, 'index.html', html);
      }
      this.loggingSameLine(terminal.blue(`Rendering Path  number ${i}: ${route}`));

      i++;

    }

    return 0;
  }

  _getRoutes() {
   return  getRoutes(this.basedir);
  }

  _prepareWriting(route: string, nameFile: string, html: string) {
    this._ensuredirp(join(this.PUBLIC_PATH, normalize(route)));
    this._writefile(join(this.PUBLIC_PATH, normalize(route), nameFile), html);

  }

  _writefile(p: string, html: string) {
    writeFileSync(
      p,
      html,
    );
  }

  _ensuredirp(p: string) {
    while (!existsSync(p)) {
      this._mkdirp(p);
    }
  }

  _mkdirp(p: string) {
    // Create parent folder if necessary.
    if (!existsSync(dirname(normalize(p)))) {
      this._mkdirp(dirname(normalize(p)));
    }
    if (!existsSync(p)) {
      mkdirSync(p);
    }
  }

}
