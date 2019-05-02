import {
  Path,
  experimental,
  logging,
  virtualFs,
  terminal,
} from '@angular-devkit/core';
import { join, normalize} from 'path';
import { NgClass } from '@angular/common';
import { ApplicationRef, NgZone, enableProdMode } from '@angular/core';
import { renderModuleFactory } from '@angular/platform-server';
import * as child_process from 'child_process';
import { readFileSync } from 'fs';
import 'reflect-metadata';
import 'zone.js/dist/zone-node';
import { Schema as AmpgularSpaceSchema } from '../lib/config/schema';
import { loadJsonFile } from './utils';
const puppeteer = require('puppeteer');
import { test } from 'packages/angular_devkit/core/src/_golden-api';
import { ArgumentOutOfRangeError } from 'rxjs';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';
import { BuildCommand } from '../commands/build-impl';
import {
  Arguments,
  CommandContext,
  CommandDescription,
  CommandScope,
} from '../models/interface';
import { parseArguments } from '../models/parser';
import { Workspace } from '../models/workspace';
import { Launchserver, ExpressConfig, ExpressServer } from './expressserver';
import { webpackRun } from './webpack';
import { getProjectName, runOptionsBuild } from './workspace-extensions';
import { load } from 'cheerio';

interface BrowserRenderOptions {
  url: string;
}

export class RenderEngine {
  private _browser: any;
  private _page: any;
  private _target: string;
  private _host: virtualFs.Host<{}>;
  private _ampgularConfig: AmpgularSpaceSchema;
  private _command: string;
  private _logger: logging.Logger;
  private _workspace: Workspace;
  appServerNew: ExpressServer;
  newCrome: ChromeRenderer;
  _context: CommandContext;
  projectName: any;
  localhost: any;
  _workingFolder: string;
  _bundlePath: string;
  public _options: any;
  constructor(
    ampgularConfig: AmpgularSpaceSchema,
    host: virtualFs.Host<{}>,
    command: string,
    logger: logging.Logger,
    context: CommandContext,
    workspace: Workspace,
    options: any,
    workingFolder: string,
    bundlePath: string,

  ) {
    this._ampgularConfig = ampgularConfig;
    this._target = ampgularConfig.target;
    this._host = host;
    this._command = command;
    this._logger = logger;
    this._context = context;

    this._workspace = workspace;
    this._options = options;
    this._workingFolder = workingFolder;
    this._bundlePath = bundlePath;

  }

  public async initialize() {

    const basedir = normalize(process.cwd());


    if (this._options.build) {
      if (this._target == 'browser') {
        await this.runBuildClient();

        return;
      } else {
        await this.runBuildServer();
      }
    }

    if (this._target == 'browser') {
         this.newCrome = new ChromeRenderer();
        // Launchin PUOETTER  FOR ALTER RENDER

        const SERVER_CONFIG: ExpressConfig = {
          assetsPath: 'dist/public/assets',
          launchPath: 'dist/public',
          message: 'Launching Puppeteer for Browser Render Port 4200',
          url: 'no',
          port:4200
        }
        this.appServerNew = new ExpressServer(SERVER_CONFIG, this._logger);
        await this.appServerNew.LaunchServerSPA();

        await this.newCrome.initialize();
      }

    if (this._target == 'node' && this._options.webpack) {
      //
      await webpackRun('render', this._logger);
      if (this._options.localhost) {
        await webpackRun('server', this._logger);
        const serverClass = require(basedir + '/ampgular/seo/server_webpack');
        this.localhost = new serverClass.ExpressNodeServer();
        const returnSever = await this.localhost.bootstrapServer(this._workingFolder,this._bundlePath);
        this._logger.info(returnSever)

       // require(basedir + '/ampgular/seo/server_webpack');
      }
    }
    if (this._target == 'node' && this._options.localhost && !this._options.webpack ) {
      //
      const serverClass = require(basedir + '/ampgular/seo/server');
      this.localhost = new serverClass.ExpressNodeServer();
      const returnSever = await this.localhost.bootstrapServer(this._workingFolder,this._bundlePath);
      this._logger.info(returnSever)
      // await this.renderWepack(basedir + '/ampgular/seo/server')
    }


  }


  async runBuildClient() {
    if (!this.projectName) {
      this.projectName = await getProjectName(this._workspace);
    }

    const newOptions = {
      target: 'browser',
      configuration: this._options.configuration,
      projectName: this.projectName,
    };

    await runOptionsBuild(newOptions, this._logger);
  }

  async runBuildServer() {
    this.projectName = await getProjectName(this._workspace);

    const newOptions = {
      target: 'node',
      configuration: this._options.configuration,
      projectName: this.projectName,
      mode: this._options.mode
    };

    await runOptionsBuild(newOptions, this._logger);
   // await _exec('node-sass',[ 'src/styles.scss', '-o', 'dist/amp/css'],{},this._logger)

  }

  public async renderUrl(): Promise<Function> {



    switch (this._target) {
      case 'browser':
        return await this.renderclient();
        break;
      case 'node':

        return await this.renderserver();
        break;
      default:
        return await this.renderclient();
        break;
    }
  }

  async renderserver(): Promise<Function> {
    const basedir = normalize(process.cwd());
    if (this._options.webpack) {

      return require(basedir + '/ampgular/seo/render_webpack').renderserver;
    } else {

      return require(basedir + '/ampgular/seo/render').renderserver;
    }

  }

  async renderclient(): Promise<Function> {
    this._logger.info(terminal.blue('Rendering routes through Puppeteer'))

    return async (options: BrowserRenderOptions): Promise<string> => {
      let Route="";
      if(options.url.substr(0,1)!="/"){
          Route = "/" + options.url
        }
        else {
          Route = options.url
        }
        const html = await this.newCrome.render({
        url: 'http://localhost:4200' + Route,
      });


      return html;
    };
  }

  public async clenUp() {
    switch (this._target) {
      case 'browser':
        this.newCrome.close();
       this.appServerNew.CloseServer();
        break;
      case 'node':
        if (this._options.localhost) { this.localhost.shutdown(); }
    }
  }
}

class ChromeRenderer {
  private browser: any;
  private page: any;

  public async initialize() {
    this.browser = await puppeteer.launch({defaultViewport: null});
    this.page = await this.browser.newPage();
  }

  public async render(options: BrowserRenderOptions) {
    await this.page.goto(options.url, { waitUntil: 'networkidle2' });

    return await this.page.content(() => {
      

      return  document.documentElement.outerHTML
    });
  }

  async close() {
    this.browser.close();
  }
}



