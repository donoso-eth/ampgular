import { Path, dirname, join, normalize } from '@angular-devkit/core';
import { load } from 'cheerio';
import { readFileSync, writeFileSync } from 'fs';
import { BeReadySpec } from '../helpers-amp/amp-1-be-spec-ready';
import { Schema as AmpOptions } from '../schemas/amp';
import { AmpDescription, StateSchema, DynamicSchema } from './interface';
import { consoleTestResultHandler } from 'tslint/lib/test';
import { BeJustAmp } from '../helpers-amp/amp-3-be-just-AMP';
import { BeSmart } from '../helpers-amp/amp-2-be-smart';

export class AmpPage {

    private _angularString: string;
    private _ampString: string;

    private PUBLIC_FOLDER: Path =  join(normalize(process.cwd()), 'dist/public');
    private BROWSER_FOLDER: Path =  join(normalize(process.cwd()), 'dist/browser');
    private AMP_FOLDER: Path =  join(normalize(process.cwd()), 'dist/amp');

    private _args: AmpDescription;
    _$: CheerioStatic;

    public readonly stateMap: {};
    public readonly dynamicMap: {};
    public readonly pluggingMap: {};
    public readonly globalCss: string;

    constructor(public route: string,  globalCss: string) {


        this.globalCss = globalCss;

        // load the html CODE


    }

    public initialize(
      options: AmpOptions, pageState: StateSchema,
      pageDynamic: DynamicSchema, pagePlugins: any) {

        // this._angularString =
        // readFileSync(join(this.PUBLIC_FOLDER, (options as any).route
        // , 'index.html')).toString('utf-8');
        // console.log(options);

        this._ampString = readFileSync(join(this.AMP_FOLDER, this.route
        , 'index.html')).toString('utf-8');

        this._$ = load(this._ampString);

        this._args = {
            singleUniStyle: this.globalCss,
            cheerio: this._$,
            angCompo: [],
            customScript: [],
            options: options,
            pageState: pageState,
            pageDynamic: pageDynamic,
            pagePlugins: pagePlugins,
        };
    }


    get args(): AmpDescription  {
        return this._args;
    }
    set args(updatedArgs: AmpDescription)  {
        this._args = updatedArgs;
    }

    public async AmpToSpec() {

        this._args = await BeReadySpec(this._args);

    }

    public async AmpToSmart() {

      this._args = await BeSmart(this._args);

  }

    public async AmpToJustAmp() {

      this._args = await BeJustAmp(this._args);

  }

    public AmpToFile(mode:String) {

      const myAMPHtml = this._args.cheerio.html().replace('<html', '<html amp')
      if (mode=='test') {
          writeFileSync(join(this.AMP_FOLDER, '/index.html'), myAMPHtml
          , 'utf-8');

      }
    }


}
