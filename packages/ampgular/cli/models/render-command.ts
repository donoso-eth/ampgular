/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  logging,
} from '@angular-devkit/core';
import * as child_process from 'child_process';
import { Schema as BuildOptions } from '../schemas/build-config';
import { Schema as PrerenderOptions } from '../schemas/prerender';
import { Schema as RenderOptions } from '../schemas/render-config';
import { Schema as SpiderOptions } from '../schemas/spider';
import { RenderEngine } from '../utilities/render-engine';
import { AmpgularCommand } from './ampgular-command';
import { BaseCommandOptions } from './command';
import { Arguments } from './interface';
import { Mode } from '../schemas/amp';
import { writeFileSync } from 'fs';
import { join } from 'path';
export interface RenderCommandOptions extends BaseCommandOptions {
  // project?: string;
  // configuration?: string;
  // prod?: boolean;
  // target?: string;
}

export abstract class RenderCommand<T extends BaseCommandOptions = BaseCommandOptions>
 extends AmpgularCommand<RenderCommandOptions> {
  private _renderengine: RenderEngine;
  public options: RenderCommandOptions & Arguments;
  // If this command supports running multiple targets.
  private _bundlePath: string;
  private _workingFolder: string;
  command: string | undefined;


  renderFunction: Function;

  public commandConfigOptions: PrerenderOptions | SpiderOptions;
  public buildConfigOptions: BuildOptions;
  public renderConfigOptions: RenderOptions;
  target: string;
  CommandConf: any;

  public async initialize(
    options: RenderCommandOptions & Arguments,
  ): Promise<void> {
    await super.initialize(options);



    this.target = this._ampgularConfig.target;
    this.renderConfigOptions = this._ampgularConfig
      .renderConfig as RenderOptions;
    const renderCommandOptions: any = (this.renderConfigOptions as any)[
      this.target
    ];
    this.buildConfigOptions = this._ampgularConfig.buildConfig as BuildOptions;

    const extra = this.overrides['--'] as string[] || [];



    this.commandConfigOptions = {
      ...this.commandConfigOptions,
      ...renderCommandOptions,
      ...this.buildConfigOptions,
      ...options,
      ...this.overrides,
    } ;




  }

  async validateAndLaunch(): Promise<number> {

    if (this.target == 'browser') {
      this._bundlePath = 'dist/browser';
    } else if (this.commandConfigOptions.configuration=='amp'){
      this._bundlePath = 'amp';
    } else {
      this._bundlePath = 'server';
    }

    if ((this.commandConfigOptions as PrerenderOptions).mode == Mode.Deploy){

      this._workingFolder = 'dist/browser';
    }
    else {
      if (this.target == 'browser') {
        this._workingFolder = 'dist/browser';
      } else if (this.commandConfigOptions.configuration=='amp'){
        this._workingFolder = 'src';
      } else {
        this._workingFolder = 'src';
      }
    }



    try {

      this._renderengine = new RenderEngine(
        this._ampgularConfig,
        this._host,
        this.command as string,
        this.logger,
        this.context,
        this._workspace,
        this.commandConfigOptions,
        this._workingFolder,
        this._bundlePath,
      );

      await this._renderengine.initialize();

      this.renderFunction = await this._renderengine.renderUrl();
    } catch (e) {
      console.log(e['errors']);

      return 1;
    }

    return 0;
  }

  protected async renderUrl(url: string): Promise<string> {

  return  await this.renderFunction({ url: url }, this._workingFolder, this._bundlePath);
  }

  public async run(options: RenderCommandOptions & Arguments): Promise<number> {
   return await super.run(options);

  }


  public async finalize() {
    await this._renderengine.clenUp();
  }


}
