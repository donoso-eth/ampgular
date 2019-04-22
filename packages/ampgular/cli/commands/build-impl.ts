/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { experimental, logging } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import * as child_process from 'child_process';
import { Schema as AmpgularOptions } from '../lib/config/schema';
import { AmpgularCommand } from '../models/ampgular-command';
import { BaseCommandOptions, Command } from '../models/command';
import { Arguments } from '../models/interface';
import { WorkspaceLoader } from '../models/workspace-loader';
import { Version } from '../upgrade/version';
import { getProjectName, runOptionsBuild } from '../utilities/workspace-extensions';
import { Schema as BuildCommandSchema } from './build';
import { Schema as BuildOptions } from '../schemas/build';

export class BuildCommand extends AmpgularCommand<BuildCommandSchema> {
  public readonly command = 'build';

  public _ampgularConfig: AmpgularOptions;
  private projectName: string;

  public async initialize(
    options: BuildCommandSchema & Arguments,
  ): Promise<void> {
    await super.initialize(options);

    this.commandConfigOptions = { ...{ mode:'render' }, ...this._ampgularConfig.buildConfig,
      ...this.overrides} as BuildOptions;

  }

  public async run(options: BuildCommandSchema & Arguments): Promise<0|1> {
    await super.run(options);


    return this.runBuild(options);

  }
  public async getProject() {
    return await getProjectName(this._workspace);
  }

  public async runBuild(
    options: BuildCommandSchema & Arguments,

  ) {

   this.projectName = options.project as string;


   if (!this.projectName) {

    this.commandConfigOptions.projectName = await this.getProject();
    }


   options = {...this.commandConfigOptions, ...{ target: this._ampgularConfig.target},...options};


   return await runOptionsBuild(options, this.logger);


  }


}

function _exec(
  command: string,
  args: string[],
  opts: { cwd?: string },
  logger: logging.Logger,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const { status, error, stderr, stdout, output } = child_process.spawnSync(
      command,
      args,
      {
        stdio: 'inherit',
        ...opts,
      },
    );

    resolve(output[0]);

    if (status != 0) {
      logger.error(
        `Command failed: ${command} ${args
          .map(x => JSON.stringify(x))
          .join(', ')}`,
      );
      if (error) {
        logger.error('Error: ' + (error ? error.message : 'undefined'));
      } else {
        logger.error(`STDOUT:\n${stdout}`);
        logger.error(`STDERR:\n${stderr}`);
      }
      throw error;
    }
  });
}
