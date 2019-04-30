/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */


import {
  JsonParseMode, isJsonObject,
 json, logging,
} from '@angular-devkit/core';
import { join, dirname, normalize,  relative, resolve} from 'path';
import * as child_process from 'child_process';
import {
  existsSync, mkdirSync, readFileSync,
  readdirSync, rmdirSync, statSync, unlinkSync, writeFileSync
} from 'fs';
import { CommandMapOptions } from '../models/command-runner';
import {
  Arguments, CommandDescription, CommandDescriptionMap,
  CommandInterface, CommandWorkspace
} from '../models/interface';
import { findUp } from '../utilities/find-up';
import { parseJsonSchemaToCommandDescription } from '../utilities/json-schema';
import { getWorkspaceDetails } from '../utilities/project';
import { Schema as DeployCommandSchema } from './deploy';

// tslint:disable-next-line:no-implicit-dependencies
import glob = require('glob');

import { AmpgularCommand } from '../models/ampgular-command';
import { Schema as DeployOptions, TargetApp } from '../schemas/deploy';
import { ExpressServer, ExpressConfig } from '../utilities/expressserver';
import { Mode } from '../schemas/prerender';

interface FileMove {
  from: string;
  to: string;
}

export class DeployCommand extends AmpgularCommand<DeployCommandSchema> {
  public readonly command = 'deploy';
  private build: CommandInterface;
  private prerender: CommandInterface;
  private amp: CommandInterface;
  private commnadWorkspace: CommandWorkspace;
  appServerNew: ExpressServer;
  workspace: CommandWorkspace;

  public async initialize(
    options: DeployCommandSchema & Arguments,
  ): Promise<void> {


    await super.initialize(options);

    this.commandConfigOptions = {
      ...this._ampgularConfig.deploy,
      ...this.overrides
    } as DeployOptions;

  }

  public async run(options: DeployCommandSchema & Arguments): Promise<number> {
    await super.run(options);

    const targetApp = (this.commandConfigOptions as DeployOptions).targetApp;



    this.logger.info('........  BROWSER APP ....... FOR  DEPLOYING');
    await this._createClientBundle();

    await this._copyFilestoPublic();

    if ((this.commandConfigOptions as DeployOptions).sitemap) {
      await this._createSiteMap();
    }

    if ((this.commandConfigOptions as DeployOptions).robots) {
      await this._copyRobots();
    }

    if ((this.commandConfigOptions as DeployOptions).files.length > 0) {
      await this._copyCustom((this.commandConfigOptions as DeployOptions).files);
    }


    if (targetApp == TargetApp.Prerender || targetApp == TargetApp.Ssr) {
      this.logger.info('........ NODE APP .......  FOR RENDERING ');
      await this._createServerBundle(false);
      switch (targetApp) {
        case TargetApp.Prerender:
          this.logger.info('PRERENDERING THE SITE .......  FOR DEPLOYING');
          await this._callPrerender(false);
          break;
        case TargetApp.Ssr:
          this.logger.info('PREPARING SERVER SIDE THE SITE .......  FOR DEPLOYING');
          break;
        default:
          break;
      }

    }

    if ((this.commandConfigOptions as DeployOptions).amp == true) {
      this.logger.info('BUNDLING AMP APP .......  FOR DEPLOYING');
      await this._createServerBundle(true);
      this.logger.info('PRERENDERING AMP APP .......  FOR DEPLOYING');
      await this._callPrerender(true);
      this.logger.info('CREATING AMP PAGES .......  FOR DEPLOYING');

      await this._createAmpPages();


    }





    if ((this.commandConfigOptions as DeployOptions).serve) {
      const SERVER_CONFIG: ExpressConfig = {
        assetsPath: 'dist/public/assets',
        launchPath: 'dist/public',
        message: 'Express Server on localhost:5000 from DEPLOY CHECK',
        url: 'http://localhost:5000',
        port:5000
      }
      this.appServerNew = new ExpressServer(SERVER_CONFIG, this.logger);
      await this.appServerNew.LaunchServer();

      return 55;
    }
    else {
      return 0;
    }

  }


  async _copyCustom(copyList: Array<FileMove>) {

    copyList.forEach(element => {
      _copy(join(this.basedir, element.from), join(this.basedir, element.to));
    });


  }


  async _copyRobots() {
    _copy(join(this.basedir, 'ampgular/robots.txt'), join(this.basedir, 'dist/public/robots.txt'));

    return;
  }

  async _createAmpPages()  {
    const workspace: CommandWorkspace = getWorkspaceDetails() as CommandWorkspace;
    const descriptionBuild = await getCommandDescription('me', this._registry);
    const amp= new descriptionBuild.impl({ workspace }, descriptionBuild, this.logger);
    return await amp.validateAndRun({mode:Mode.Deploy});
  }


  async _createSiteMap() {
    const workspace: CommandWorkspace = getWorkspaceDetails() as CommandWorkspace;
    const descriptionBuild = await getCommandDescription('sitemap', this._registry);
    const sitemap = new descriptionBuild.impl({ workspace }, descriptionBuild, this.logger);

    return await sitemap.validateAndRun({});
  }


  async _createClientBundle() {
    const workspace: CommandWorkspace = getWorkspaceDetails() as CommandWorkspace;
    const descriptionBuild = await getCommandDescription('build', this._registry);
    this.build = new descriptionBuild.impl({ workspace }, descriptionBuild, this.logger);

    return await this.build.validateAndRun({ target: 'browser', configuration: 'production' });
  }


  async _createServerBundle(ampVersion: boolean) {
    const workspace: CommandWorkspace = getWorkspaceDetails() as CommandWorkspace;
    const descriptionBuild = await getCommandDescription('build', this._registry);
    this.build = new descriptionBuild.impl({ workspace }, descriptionBuild, this.logger);

    if (ampVersion) {
      return await
        this.build.validateAndRun({
          target: 'node',
          configuration: 'amp'
        });
    }
    else {
      return await
        this.build.validateAndRun({
          target: 'node',
          configuration: this._ampgularConfig.buildConfig.configuration
        });
    }


  }

  async _callPrerender(ampVersion: boolean) {
    const workspace: CommandWorkspace = getWorkspaceDetails() as CommandWorkspace;
    const descriptionPrerender = await getCommandDescription('prerender', this._registry);
    const prerender =
      new descriptionPrerender.impl({ workspace }, descriptionPrerender, this.logger);

    if (ampVersion) {
      return await prerender.validateAndRun({ path: 'dist/amp', configuration: 'amp',mode: Mode.Deploy });
    } else {
      return await prerender.validateAndRun({  path: 'dist/browser',mode: Mode.Deploy });
    }

  }

  async _callAmpMe() {
    const workspace: CommandWorkspace = getWorkspaceDetails() as CommandWorkspace;
    const descriptionPrerender = await getCommandDescription('amp', this._registry);
    this.amp =
      new descriptionPrerender.impl({ workspace }, descriptionPrerender, this.logger);

    return await this.amp.validateAndRun({ mode: 'deploy' });


  }


  async _copyFilestoPublic() {


    _rimraf(join(this.basedir, 'dist/public'));


    _mkdirp(join(this.basedir, 'dist/public'));


    _recursiveCopy(join(this.basedir, 'dist/browser'), join(this.basedir, 'dist/public'), this.logger);


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
    if (!existsSync(to)) {
      mkdirSync(to);
    }

    readdirSync(from).forEach(fileName => {
      _recursiveCopy(join(normalize(from), fileName), join(normalize(to), fileName), logger);
    });
  } else {
    _copy(from, to);
  }
}
function _copy(from: string, to: string) {


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
    const schemaPath = commands[name];
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
