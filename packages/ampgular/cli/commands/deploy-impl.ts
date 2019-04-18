/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */


import { JsonParseMode, dirname, isJsonObject,
  join, json, logging, normalize, path, relative, resolve } from '@angular-devkit/core';
import * as child_process from 'child_process';
import { existsSync, mkdirSync, readFileSync,
  readdirSync, rmdirSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { CommandMapOptions } from '../models/command-runner';
import { Arguments, CommandDescription, CommandDescriptionMap,
  CommandInterface, CommandWorkspace } from '../models/interface';
import { findUp } from '../utilities/find-up';
import { parseJsonSchemaToCommandDescription } from '../utilities/json-schema';
import { getWorkspaceDetails } from '../utilities/project';
import { Schema as DeployCommandSchema } from './deploy';

// tslint:disable-next-line:no-implicit-dependencies
import glob = require('glob');

import { AmpgularCommand } from '../models/ampgular-command';
import { Schema as DeployOptions, TargetApp } from '../schemas/deploy';

interface FileMove {
 from: string;
 to: string;
}

export class DeployCommand extends AmpgularCommand<DeployCommandSchema> {
  public readonly command = 'deploy';
  private build: CommandInterface;
  private prerender: CommandInterface;
  private commnadWorkspace: CommandWorkspace;

  workspace: CommandWorkspace;

  public async initialize(
    options: DeployCommandSchema & Arguments,
  ): Promise<void> {


    await super.initialize(options);


    this.commandConfigOptions = { ...this._ampgularConfig.deploy,
                                  ...this.overrides} as DeployOptions;


  }

  public async run(options: DeployCommandSchema & Arguments): Promise<0|1> {
    await super.run(options);

    const targetApp = (this.commandConfigOptions as DeployOptions).targetApp;


    try {


      this.logger.info('........  BROWSER APP ....... FOR  DEPLOYING');
      await this._createClientBundle();


      if ((this.commandConfigOptions as DeployOptions).sitemap) {
        this._createSiteMap();
      }

      if ((this.commandConfigOptions as DeployOptions).robots) {
        this._copyRobots();
      }

      if ((this.commandConfigOptions as DeployOptions).files.length > 0) {
        this._copyCustom((this.commandConfigOptions as DeployOptions).files);
      }


      if (targetApp == TargetApp.Prerender || targetApp == TargetApp.Ssr) {
        this.logger.info('........ NODE APP .......  FOR RENDERING ');
        await this._createServerBundle();
        switch (targetApp) {
          case TargetApp.Prerender:
             this.logger.info('........  PRERENDERING THE SITE .......  FOR DEPLOYING');
             await this._callPrerender();
             break;
          case TargetApp.Ssr:
          this.logger.info('........   PRPARING SERVER SIDE THE SITE .......  FOR DEPLOYING');
          break;
          default:
            break;
        }

      }

      this.logger.info('........  CREATING AMP PAGES .......  FOR DEPLOYING');

    } catch (error) {

    }

    return 0;


  }


  async _copyCustom(copyList: Array<FileMove>) {

    copyList.forEach( element => {
      _copy(element.from, element.to);
    });


  }


  async _copyRobots() {
    _copy('ampgular/robots.txt', 'dist/public/robots.txt');

    return ;
}


  async _createSiteMap() {
    const workspace: CommandWorkspace = getWorkspaceDetails() as CommandWorkspace;
    const descriptionBuild = await getCommandDescription('sitemap', this._registry);
    const sitemap = new descriptionBuild.impl({ workspace }, descriptionBuild, this.logger);

    return await  sitemap.validateAndRun({});
}


  async _createClientBundle() {
      const workspace: CommandWorkspace = getWorkspaceDetails() as CommandWorkspace;
      const descriptionBuild = await getCommandDescription('build', this._registry);
      this.build = new descriptionBuild.impl({ workspace }, descriptionBuild, this.logger);

      return await  this.build.validateAndRun({ target: 'browser', configuration: 'production'});
  }


  async _createServerBundle() {
    return await
    this.build.validateAndRun({ target: 'node',
                                configuration: this._ampgularConfig.buildConfig.configuration});
  }

  async _callPrerender() {
    const workspace: CommandWorkspace = getWorkspaceDetails() as CommandWorkspace;
    const descriptionPrerender = await getCommandDescription('prerender', this._registry);
    this.prerender =
    new descriptionPrerender.impl({ workspace }, descriptionPrerender, this.logger);

    return await this.prerender.validateAndRun({ localhost: true, path: 'dist/browser'});
  }

  async _copyFilestoPublic() {


    _rimraf('dist/public');

  // copy the dist Folder to Public

    _recursiveCopy('dist/browser', 'dist/public', this.logger);

  // copy user files defined in ampgular.json
  // TODO Options sitemap


  }

}

const filterFunc = (src: string, dest: string) => {
  return src.indexOf('index.html') === -1 ? true : false;
};

function _rimraf(p: string) {
  glob.sync(join(normalize(p), '**/*'), { dot: true, nodir: true })
    .forEach(p => unlinkSync(p));
  glob.sync(join(normalize(p), '**/*'), { dot: true })
    .sort((a, b) => b.length - a.length)
    .forEach(p => rmdirSync(p));
}

function _recursiveCopy(from: string, to: string, logger: logging.Logger) {
  if (!existsSync(from)) {
    logger.error(`File "${from}" does not exist.`);
    process.exit(4);
  }
  if (statSync(from).isDirectory()) {
    readdirSync(from).forEach(fileName => {
      _recursiveCopy(join(normalize(from), fileName), join(normalize(to), fileName), logger);
    });
  } else {
    _copy(from, to);
  }
}

function _copy(from: string, to: string) {
  // Create parent folder if necessary.
  if (!existsSync(dirname(normalize(to)))) {
    _mkdirp(dirname(normalize(to)));
  }

  // Error out if destination already exists.
  if (existsSync(to)) {
    throw new Error(`Path ${to} already exist...`);
  }

  from = relative(normalize(process.cwd()), normalize(from));
  to = relative(normalize(process.cwd()), normalize(to));

  const buffer = readFileSync(from);
  writeFileSync(to, buffer);
}

function _mkdirp(p: string) {
  // Create parent folder if necessary.
  if (!existsSync(dirname(normalize(p)))) {
    _mkdirp(dirname(normalize(p)));
  }
  if (!existsSync(p)) {
    mkdirSync(p);
  }
}


export async function getCommandDescription(
  commandname: string,
  registry: json.schema.CoreSchemaRegistry): Promise<CommandDescription> {
  let description: CommandDescription | null = null;
  let commands: CommandMapOptions = {};
  const commandMapPath = join(normalize(process.cwd()), 'node_modules/@ampgular/cli/commands.json');
  if (commandMapPath === null) {
      throw new Error('Unable to find command map.');
    }
  const cliDir = dirname(normalize(commandMapPath));
  const commandsText = readFileSync(normalize(commandMapPath)).toString('utf-8');
  const commandJson = json.parseJson(
      commandsText,
      JsonParseMode.Loose,
      { path: commandMapPath },
    );
  if (!isJsonObject(commandJson)) {
      throw Error('Invalid command.json');
    }

  commands = {};
  for (const commandName of Object.keys(commandJson)) {
      const commandValue = commandJson[commandName];
      if (typeof commandValue == 'string') {
        commands[commandName] = resolve(cliDir, normalize(commandValue));
      }
    }

    // Normalize the commandMap
  const commandMap: CommandDescriptionMap = {};
  for (const name of Object.keys(commands)) {
    const schemaPath = commands[name] ;
    const schemaContent = readFileSync(normalize(schemaPath), 'utf-8');
    const schema = json.parseJson(schemaContent, JsonParseMode.Loose, { path: schemaPath });
    if (!isJsonObject(schema)) {
      throw new Error('Invalid command JSON loaded from ' + JSON.stringify(schemaPath));
    }

    commandMap[name] =
      await parseJsonSchemaToCommandDescription(name, schemaPath, registry, schema);
  }

  description = commandMap[commandname];


  return description;
}
