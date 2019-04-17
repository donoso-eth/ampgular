import { Path, dirname, join, normalize } from '@angular-devkit/core';
import { load } from 'cheerio';
import { readFileSync } from 'fs';
import { BeReadySpec } from '../helpers-amp/amp-1-be-spec-ready';
import { Schema as AmpOptions } from '../schemas/amp';
import { AmpDescription } from './interface';

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

    constructor(route: string,  globalCss: string) {


        this.globalCss = globalCss;

        // load the html CODE


    }

    public initialize(options: AmpOptions, pageState:any, pageDynamic:any, pagePluggins:any) {

        this._angularString =
        readFileSync(join(this.PUBLIC_FOLDER, (options as any).route
        , 'index.html')).toString('utf-8');

        this._ampString = readFileSync(join(this.AMP_FOLDER, (options as any).route
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
            pagePluggins: pagePluggins,
        };
    }


    get args(): AmpDescription  {
        return this._args;
    }
    set args(updatedArgs: AmpDescription)  {
        this._args = updatedArgs;
    }

    private _loadCSS() {

    }

    public async AmpToSpec() {

        this._args = await BeReadySpec(this._args);

    }


}
