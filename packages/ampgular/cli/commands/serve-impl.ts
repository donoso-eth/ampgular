/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { terminal, logging } from '@angular-devkit/core';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { findUp } from '../utilities/find-up';
import { Schema as ServeCommandSchema } from './serve';
import { Schema as ServeOptions, Command } from '../schemas/serve';
import { Arguments } from '../models/interface';
import { AmpgularCommand } from '../models/ampgular-command';
import { ExpressConfig, ExpressServer } from '../utilities/expressserver';

export class ServeCommand extends AmpgularCommand<ServeCommandSchema> {
  public readonly command = 'serve';
  appServerNew: ExpressServer;
  public commandConfigOptions: ServeOptions;

  public async initialize(
    options: ServeCommandSchema & Arguments,
  ): Promise<void> {
    await super.initialize(options);
    console.log(this.overrides)
    console.log(this.commandConfigOptions)
    this.commandConfigOptions = {command: this.overrides.command as Command}


  }

  async run() {
    let SERVER_CONFIG:ExpressConfig;
    console.log(this.commandConfigOptions.command);
    if (this.commandConfigOptions.command=='deploy'){
      SERVER_CONFIG = {
        assetsPath: 'dist/public/assets',
        launchPath: 'dist/public',
        message: 'Express Server on localhost:5000 from DEPLOY CHECK',
        url: 'http://localhost:5000',
        port:5000
      }
      this.appServerNew = new ExpressServer(SERVER_CONFIG, this.logger);
      await this.appServerNew.LaunchServer();
    }
    else if (this.commandConfigOptions.command=='seo') {
      SERVER_CONFIG  = {
        assetsPath: 'src',
        launchPath: 'dist/server',
        message: 'Express Server on localhost:5000 from SEO prerender Check',
        url: 'http://localhost:5000',
        port:5000
      }
      this.appServerNew = new ExpressServer(SERVER_CONFIG, this.logger);
      await this.appServerNew.LaunchServer();
    }

    else if (this.commandConfigOptions.command=='pre-amp') {
      SERVER_CONFIG  = {
        assetsPath: 'src',
        launchPath: 'dist/amp',
        message: 'Express Server on localhost:5000 from AMP prerender Check',
        url: 'http://localhost:5000',
        port:5000
      }
      this.appServerNew = new ExpressServer(SERVER_CONFIG, this.logger);
      await this.appServerNew.LaunchServer();
    }
    else if (this.commandConfigOptions.command=='pre-amp') {
      SERVER_CONFIG  = {
        assetsPath: 'src',
        launchPath: 'dist/amp',
        message: 'Express Server on localhost:5000 from AMP prerender Check',
        url: 'http://localhost:5000',
        port:5000
      }
      this.appServerNew = new ExpressServer(SERVER_CONFIG, this.logger);
      await this.appServerNew.LaunchServer();
    }
    else {
      return 0
    }

      return 55

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

