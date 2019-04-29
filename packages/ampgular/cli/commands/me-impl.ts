/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {

  join,  normalize
} from 'path';
import {
  readFileSync,
} from 'fs';
import * as minimatch from 'minimatch';
import { AmpPage } from '../models/amp-page';
import { AmpgularCommand } from '../models/ampgular-command';
import { BaseCommandOptions, Command } from '../models/command';
import {
  AmpDescription, AmpRoute, Arguments, CommandDescription,
  CommandDescriptionMap, CommandInterface, CommandWorkspace,
  DynamicSchema, StateSchema,
} from '../models/interface';
import { Schema as AmpOptions, Mode } from '../schemas/amp';
import { ExpressServer, ExpressConfig } from '../utilities/expressserver';
import { getWorkspaceDetails } from '../utilities/project';
import { getRoutes } from '../utilities/utils';
import { runOptionsBuild } from '../utilities/workspace-extensions';
import { getCommandDescription } from './deploy-impl';
import { Schema as MeCommandSchema } from './me';
import { terminal } from '@angular-devkit/core';




interface StateMap {

}
interface DynamicMap {

}

export class MeCommand extends AmpgularCommand<MeCommandSchema> {
  public readonly command = 'amp';
  public commandConfigOptions: AmpOptions;
  private ROUTES: string[];
  private _toAmpROUTES: string[];
  private _ampRoutesConfig: AmpRoute[];
  private stateFilesMap: StateMap = {
  };
  private dynamicFilesMap: DynamicMap = {
  };
  private pluginsFilesMap: DynamicMap = {
  };
  private _myPageState: StateSchema;
  private _myPageDynamic: DynamicSchema;
  private _myPagePlugins: any;
  private prerender: CommandInterface;
  appServerNew: ExpressServer;
  private _globalCss: string;

  public async initialize(options: MeCommandSchema & Arguments): Promise<void> {
    await super.initialize(options);
    this.commandConfigOptions = {
      ...this._ampgularConfig.amp, ...{
        host: this._ampgularConfig.host,
      },
      ...this.overrides,
    } as AmpOptions;
  }

  public async run(options: MeCommandSchema & Arguments): Promise<number> {

    await super.run(options);

    if(options.mode==Mode.Deploy){
      this.commandConfigOptions.mode = Mode.Deploy
    }

    if (this.overrides['route'] !== undefined) {
     this.commandConfigOptions.mode = Mode.Test;
    }

    if (this.commandConfigOptions.mode == Mode.Test) {
      this._toAmpROUTES = [];
      this._toAmpROUTES.push(this.commandConfigOptions.route as string);
    } else {
    this.ROUTES = this._getRoutes();
    this._ampRoutesConfig = this._getAmpRoutesConfig();
    this._toAmpROUTES = this.ROUTES.filter(route => {
      return this._ampRoutesConfig.some((config: AmpRoute) => {
        if (config['length'] == undefined) {
          return config['match'].some((patternAr: string) =>
            minimatch(route, patternAr, {}),
          );
        } else {
          return (
            config['match'].some((patternAr: string) =>
              minimatch(route, patternAr, {}),
            ) && route.split('/').length == config['length']
          );
        }
      });
    });
  }

    for (const stateFilePath of this.commandConfigOptions.stateFiles) {
      const stateContent: StateMap = this._readFile(stateFilePath) as StateMap;
      this.stateFilesMap = {
        ...this.stateFilesMap,
        ...stateContent,
      };
    }

    for (const dynamicFilePath of this.commandConfigOptions.dynamicFiles) {
      const dynamicContent: StateMap = this._readFile(
        dynamicFilePath,
      ) as StateMap;
      this.dynamicFilesMap = {
        ...this.dynamicFilesMap,
        ...dynamicContent,
      };
    }

    for (const pluginsFilePath of this.commandConfigOptions.pluginsFiles) {
      const plugginContent: StateMap = this._readFile(
        pluginsFilePath,
      ) as StateMap;
      this.pluginsFilesMap = {
        ...this.pluginsFilesMap,
        ...plugginContent,
      };
    }


    if (this.commandConfigOptions.mode!= Mode.Deploy){

      this._globalCss= readFileSync(join(normalize(process.cwd()),'/dist/public/styles.css')).toString('utf-8')

      if (this.commandConfigOptions.prerender){
        await this._callPrerender();
      }
    }

      else {
        this._globalCss= readFileSync(join(normalize(process.cwd()),'/dist/amp/styles.css')).toString('utf-8')
      }







    let k = 1;
    for (const ampRoute of this._toAmpROUTES) {

      // create state associated to Route
      this._myPageState = await this._buildPageStateSpec(ampRoute);

      // create dynamic associated to Route
      this._myPageDynamic = await this._buildDynamicSpec(ampRoute);

      // create pluggin associated to routes
      this._myPagePlugins = await this._buildPluginsSpec(ampRoute);

         ///// Prerender AMP ROUTES


      // create an instance of AMP PAGE
      const myAMPPage = new AmpPage(ampRoute, this._globalCss,this.logger);

      myAMPPage.initialize(this.commandConfigOptions,
        this._myPageState, this._myPageDynamic, this._myPagePlugins);

      await myAMPPage.AmpToSpec();

      await myAMPPage.AmpToSmart();

      await myAMPPage.AmpToJustAmp();

      const passValidation = await myAMPPage.AMPisValid();
      if (passValidation==true){
        await myAMPPage.AmpCanonical();
      }

      await myAMPPage.AmpToFile(this.commandConfigOptions.mode);
      this.loggingSameLine(`AMPing....nr:${k} page:${ampRoute} `);



        k++;
    }

    const SERVER_CONFIG:ExpressConfig = {
      assetsPath: 'src/assets',
      launchPath: 'dist/amp',
      message: 'Express Server on localhost:6000 from AMP testing purposes',
      url:'http://localhost:6000#development=1'
    }
    if (this.commandConfigOptions.mode == "test") {
      SERVER_CONFIG.url = 'http://localhost:6000#development=1';
      this.appServerNew = new ExpressServer(SERVER_CONFIG,this.logger);
      await this.appServerNew.LaunchServer();
      return 55;
    } else if (this.commandConfigOptions.mode == "render") {

      SERVER_CONFIG.url = 'http://localhost:6000';
      SERVER_CONFIG.message = 'Express Server on localhost:6000 from pre-rende check pages',
      this.appServerNew = new ExpressServer(SERVER_CONFIG,this.logger);
      await this.appServerNew.LaunchServer();
      return 55;
    } else {
    return 0;
    }
  }

  _getRoutes() {
    return getRoutes(this.basedir);
  }

  _getAmpRoutesConfig() {
    return JSON.parse(
      readFileSync(join(this.basedir, 'ampgular/amp/amp_routes.json')).toString(
        'utf-8',
      ),
    ).ampRoutes;
  }


  _readFile = (path: string): Object => {

    let file = JSON.parse(
      readFileSync(join(normalize(process.cwd()), path)).toString('utf-8'),
    );
      delete file['$schema'];
    return  file
  }


  private _buildDynamicSpec = async (route: string): Promise<DynamicSchema> => {
    const dynamic = this.dynamicFilesMap as DynamicSchema;
    const myPageDynamic: DynamicSchema = {};
    Object.keys(dynamic).forEach(singleDynamic => {
      if (
        dynamic[singleDynamic].routes.length == undefined &&
        dynamic[singleDynamic].routes.match.some((patternAr: string) =>
          minimatch(route, patternAr, {}),
        )
      ) {
        myPageDynamic[singleDynamic] = dynamic[singleDynamic];
      } else if (
        dynamic[singleDynamic].routes.match.some((patternAr: string) =>
          minimatch(route, patternAr, {}),
        ) &&
        route.split('/').length == dynamic[singleDynamic].routes['length']
      ) {
        myPageDynamic[singleDynamic] = dynamic[singleDynamic];
      }
    });

    return myPageDynamic;
  }


  private _buildPageStateSpec = async (route: string,
  ): Promise<StateSchema> => {
    /// READ STATE
    const state = this.stateFilesMap as StateSchema;
    const myPageState: StateSchema = {};
    Object.keys(state).forEach((singleState: string) => {
      if (
        state[singleState].routes.length == undefined &&
        state[singleState].routes['match'].some((patternAr: string) =>
          minimatch(route as string, patternAr, {}),
        )
      ) {
        myPageState[singleState] = state[singleState];
      } else if (
        state[singleState].routes['match'].some((patternAr: string) =>
          minimatch(route as string, patternAr, {}),
        ) &&
        (route as string).split('/').length ==
        state[singleState].routes['length']
      ) {
        myPageState[singleState] = state[singleState];
      }
    });

    return myPageState;
  }


  private _buildPluginsSpec = async (route: string,
  ): Promise<StateSchema> => {

    const plugin = this.pluginsFilesMap as any;
    const myPagePlugin: any = {};
    Object.keys(plugin).forEach(singlePlugin => {


      if (plugin[singlePlugin].routes.length == undefined && plugin[singlePlugin]
        .routes['match'].some((patternAr: string) =>
          minimatch(route, patternAr, {}))) {
        myPagePlugin[singlePlugin] = plugin[singlePlugin];
      } else if (plugin[singlePlugin].routes['match'].some((patternAr: string) =>
        minimatch(route, patternAr, {})) && route.split('/').length ==
        plugin[singlePlugin].routes['length']) {
        myPagePlugin[singlePlugin] = plugin[singlePlugin];
      }


    });


    return myPagePlugin;

  }


  async _callPrerender() {
    const workspace: CommandWorkspace = getWorkspaceDetails() as CommandWorkspace;
    const descriptionPrerender = await getCommandDescription('prerender', this._registry);
    this.prerender =
      new descriptionPrerender.impl({ workspace }, descriptionPrerender, this.logger);


    const prerenderOptions: any= {
      configuration: 'amp', target: this._ampgularConfig.target,
        routes: this._toAmpROUTES, path: 'src'
    }

    if(this.commandConfigOptions.localhost){
      prerenderOptions.localhost = true;
    }

    return await this.prerender.validateAndRun(
      prerenderOptions);
  }


}
