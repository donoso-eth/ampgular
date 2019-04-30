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
    this._bundlePath = 'server';
    this._workingFolder = 'src';


    this.target = this._ampgularConfig.target;
    this.renderConfigOptions = this._ampgularConfig
      .renderConfig as RenderOptions;
    const renderCommandOptions: any = (this.renderConfigOptions as any)[
      this.target
    ];
    this.buildConfigOptions = this._ampgularConfig.buildConfig as BuildOptions;

    const extra = this.overrides['--'] as string[] || [];



    if (extra.filter(x => x.indexOf('--path') != -1).length == 1) {
      const path = extra.filter(x => x.indexOf('--path') != -1)[0];
      this._bundlePath = path.replace('--path=', '');
      extra.splice( extra.indexOf(path), 1 );
    } else if (this.target == 'browser') {
      this._bundlePath = 'dist/browser';
    }

   else if (this.overrides.mode== Mode.Deploy) {
    this._bundlePath = 'dist/browser';
    this._workingFolder = 'dist/browser';
  }
  console.log(this.overrides)


    this.commandConfigOptions = {
      ...this.commandConfigOptions,
      ...renderCommandOptions,
      ...this.buildConfigOptions,
      ...options,
      ...this.overrides,
    } ;

    if(this.commandConfigOptions.configuration=='amp'){
      this._workingFolder = 'src';
      this._bundlePath = 'amp';
    }


  }

  async validateAndLaunch(): Promise<number> {

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

if ((this.commandConfigOptions as PrerenderOptions).mode == Mode.Deploy){
  if(this.commandConfigOptions.configuration=='amp'){
    this._bundlePath = 'amp';
    this._workingFolder = 'dist/browser';
  } else {
    this._bundlePath = 'server';
    this._workingFolder = 'dist/browser';
  }


}

    return await this.renderFunction({ url: url }, this._workingFolder, this._bundlePath);
  }

  public async run(options: RenderCommandOptions & Arguments): Promise<number> {
   return await super.run(options);

  }


  public async finalize() {
    await this._renderengine.clenUp();
  }


}
