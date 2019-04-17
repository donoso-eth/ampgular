
import { join, json, normalize, terminal } from '@angular-devkit/core';
import { createConsoleLogger } from '@angular-devkit/core/node';
import { load } from 'cheerio';
import { readFileSync } from 'fs';
import { getCommandDescription } from '../../commands/deploy-impl';
import { AmpDescription, CommandConstructor, CommandInterface, CommandWorkspace } from '../../models/interface';

export const ampgularWorkspace = {
    '$schema': '../node_modules/@ampgular/cli/lib/config/schema.json',
    'version': 1,
    'target': 'node',
    'host': 'https://madrid-day-spa.com',
    'buildConfig': {
        'configuration': 'production',
        'build': false,
    },
    'renderConfig': {
        'node': {
            'webpack': false,
            'localhost': false,
        },
        'browser': {
            'port': '4000',
        },
    },
    'deploy': {
        'targetApp': 'prerender',
        'sitemap': true,
        'robots': true,
        'files': [{ 'from': '/src/_fonts.scss', 'to': 'public' }],
    },
    'prerender': {
        'routes': false,
        'static': true,
        'cssOptimize': false,
        'namedFiles': false,
    },
    'spider': {
        'entryPaths': [
            '/',
        ],
        'excludePaths': [
            '/es/exclusion1', '/es/exclusion2',
        ],
        'ensureCanonical': false,
        'excludeQuery': true,
        'build': false,
    },
    'sitemap': {
        'defaultPriority': 0.8,
        'defaultFrecuency': 'weekly',
        'custom': [
        ],
    },
};
export class TestBed {

    private _ampgularWorkSpace = {
        '$schema': '../node_modules/@ampgular/cli/lib/config/schema.json',
        'version': 1,
        'target': 'node',
        'host': 'https://madrid-day-spa.com',
        'buildConfig': {
            'configuration': 'production',
            'build': false,
        },
        'renderConfig': {
            'node': {
                'webpack': false,
                'localhost': false,
            },
            'browser': {
                'port': '4000',
            },
        },
        'deploy': {
            'targetApp': 'prerender',
            'sitemap': true,
            'robots': true,
            'files': [{ 'from': '/src/_fonts.scss', 'to': 'public' }],
        },
        'prerender': {
            'routes': false,
            'static': true,
            'cssOptimize': false,
            'namedFiles': false,
        },
        'spider': {
            'entryPaths': [
                '/',
            ],
            'excludePaths': [
                '/es/exclusion1', '/es/exclusion2',
            ],
            'ensureCanonical': false,
            'excludeQuery': true,
            'build': false,
        },
        'sitemap': {
            'defaultPriority': 0.8,
            'defaultFrecuency': 'weekly',
            'custom': [
            ],
        },
    };

    public get ampgularWorkspace() {
        return this._ampgularWorkSpace;
    }


    public static async createCommand(command: string): Promise<CommandInterface> {

        const logger = createConsoleLogger(
            false,
            process.stdout,
            process.stderr,
            {
                warn: s => terminal.bold(terminal.yellow(s)),
                error: s => terminal.bold(terminal.red(s)),
                fatal: s => terminal.bold(terminal.red(s)),
            },
        );
        const registry = new json.schema.CoreSchemaRegistry([]);
        registry.addPostTransform(json.schema.transforms.addUndefinedDefaults);
        registry.registerUriHandler((uri: string) => {
            if (uri.startsWith('amp-cli://')) {

                const content = readFileSync(

                    join(normalize(__dirname), '..', '..', 'schemas', uri.substr('amp-cli://commands'.length)),
                    'utf-8',
                );
                const file = Promise.resolve(JSON.parse(content));

                return file;
            } else {
                return null;
            }
        });
        const workspace: CommandWorkspace = {
            configFile: 'angular.json',
            root: '',
        };

        const descriptionCommand = await getCommandDescription(command, registry);


        return new descriptionCommand.impl({ workspace }, descriptionCommand, logger);
    }


    public static async mockAmpDescription(): Promise<AmpDescription> {

     const indexPath = join(normalize(__dirname), 'index.html');
     const cssPath = join(normalize(__dirname), 'styles.css');
     const html = readFileSync(indexPath).toString('utf-8');
     const globalCss  = readFileSync(cssPath).toString('utf-8');
     const $ = load(html);
     const testDescription: AmpDescription  = {
         cheerio: $,
         singleUniStyle: globalCss,
         customScript: [],
         angCompo: [],
         pageDynamic: {},
         pageState: {},
         pagePluggins: {},
         options: {
           cssOptimize: true,
           ampValidation: true,
           dynamicFiles: [],
           serviceWorker: true,
           host: '',
           pluginsFiles: [],
           stateFiles: [],

         },
        };

     return testDescription;

    }


}
