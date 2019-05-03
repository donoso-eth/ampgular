import { join, normalize } from 'path';
import { load } from 'cheerio';
import { readFileSync, writeFileSync, existsSync,  mkdirSync } from 'fs';
import { BeReadySpec } from '../helpers-amp/amp-1-be-spec-ready';
import { Schema as AmpOptions, Mode } from '../schemas/amp';
import { AmpDescription, StateSchema, DynamicSchema } from './interface';
import { consoleTestResultHandler } from 'tslint/lib/test';
import { BeJustAmp } from '../helpers-amp/amp-3-be-just-AMP';
import { BeSmart } from '../helpers-amp/amp-2-be-smart';
import { logging } from '@angular-devkit/core';
const amphtmlValidator = require('amphtml-validator');

export class AmpPage {

    private _angularString: string;
    private _ampString: string;

    private PUBLIC_FOLDER: string =  join(normalize(process.cwd()), 'dist/public');
    private BROWSER_FOLDER: string =  join(normalize(process.cwd()), 'dist/browser');
    private AMP_FOLDER: string =  join(normalize(process.cwd()), 'dist/amp');

    private _args: AmpDescription;
    _$: CheerioStatic;

    public readonly stateMap: {};
    public readonly dynamicMap: {};
    public readonly pluggingMap: {};
    public readonly globalCss: string;

    constructor(public route: string,  globalCss: string, public logger:logging.Logger) {


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
            route: this.route
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

  public AmpCanonical(){
    // Embedding AMphtml tag in the canonical version of the page /////

    const publicIndex = readFileSync(join(this.PUBLIC_FOLDER, this.route, 'index.html')).toString();
    let only$ = load(publicIndex)
    const canonicalLink = only$("[rel=\'canonical\']")
    const amphtml = only$("[rel=\'amphtml\']")

    // we only insert the amphtml tag when is nicht vorhanden
    if (amphtml.length == 0) {
      only$('head').children("[rel=\'canonical\']").after('<link rel="amphtml" href="' + canonicalLink.attr('href') + '/amp" />')
      writeFileSync(join(this.PUBLIC_FOLDER, this.route, '/index.html'), only$.html(), 'utf-8');
    }
  }

  public AMPisValid = async (): Promise<boolean> => {
    const html = this.args.cheerio.html();
    const route = this.route;
    return await validateAMP(html,route)
  }


    public AmpToFile(mode:String) {

      const myAMPHtml = this._args.cheerio.html()  // .replace('<html', '<html amp')
      if (mode=='test') {
          writeFileSync(join(this.AMP_FOLDER, '/index.html'), myAMPHtml
          , 'utf-8');

      }
       else if (mode== Mode.Render) {
        if (!existsSync(join(this.AMP_FOLDER, this.route, 'amp'))) {
          mkdirSync(join(this.AMP_FOLDER, this.route, 'amp'));
        }

          writeFileSync(join(this.AMP_FOLDER, this.route, 'amp','/index.html'), myAMPHtml
          , 'utf-8');
        }
        else if (mode== Mode.Deploy) {

          if (!existsSync(join(this.PUBLIC_FOLDER, this.route, 'amp'))) {
            mkdirSync(join(this.PUBLIC_FOLDER, this.route, 'amp'));
          }
          writeFileSync(join(this.PUBLIC_FOLDER, this.route, 'amp','/index.html'), myAMPHtml
          , 'utf-8');
      }
    }


}
const validateAMP = async (html: string, route: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    amphtmlValidator.getInstance().then(function (validator:any) {
      var result = validator.validateString(html);
      if (result.status === 'PASS'){
        console.log(`Passing AMP VALIDATION: ${route}`)
        resolve(true)
      }
      else {
        console.warn(result.status + ": " + route);
        for (var ii = 0; ii < result.errors.length; ii++) {
          var error = result.errors[ii];
          var msg = 'line ' + error.line + ', col ' + error.col + ': ' + error.message;
          if (error.specUrl !== null) {
            msg += ' (see ' + error.specUrl + ')';
          }
          ((error.severity === 'ERROR') ? console.error : console.warn)(msg);

        }
        console.log();
        resolve(false)
      }
    });
  })
}
