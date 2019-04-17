import { experimental, join, json, normalize, terminal, Path } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { clearLine, cursorTo, moveCursor } from 'readline';
import { getBuilderDescription, getCommandConfig } from '../helpers-seo/options';
import { Schema as AmpgularOptions } from '../lib/config/schema';
import { Schema as SitemapOptions } from '../schemas/sitemap';
import { parseJsonSchemaToOptions } from '../utilities/json-schema';
import { loadWorkspaceAndAmpgular } from '../utilities/workspace-extensions';
import { BaseCommandOptions, Command } from './command';
import { Arguments } from './interface';
import { parseArguments } from './parser';
import { Workspace } from './workspace';
export abstract class AmpgularCommand<
    T extends BaseCommandOptions = BaseCommandOptions
    > extends Command<BaseCommandOptions> {
    public _host = new NodeJsSyncHost();
    _ampgularConfig: AmpgularOptions;
    _registry: json.schema.CoreSchemaRegistry;
    public commandConfigOptions: any;
    public _workspace: Workspace;
    CommandConf: any;
    PrerenderDesc: any;
    overrides: Arguments;
    public basedir: Path = normalize(process.cwd());
    public PUBLIC_PATH = join(this.basedir, 'dist/public');
    public AMP_PATH = join(this.basedir, 'dist/amp');
    public BROWSER_PATH = join(this.basedir, 'dist/browser');

    async initialize(options: T & Arguments): Promise<void> {

        this._registry = new json.schema.CoreSchemaRegistry([]);
        this._registry.addPostTransform(json.schema.transforms.addUndefinedDefaults);

        this._registry.registerUriHandler((uri: string) => {
            if (uri.startsWith('amp-cli://')) {
                const content = readFileSync(
                    join(normalize(__dirname), '..', uri.substr('amp-cli://'.length)),
                    'utf-8',
                );

                return Promise.resolve(JSON.parse(content));
            } else {
                return null;
            }
        });
        const loadSpaces =
        await loadWorkspaceAndAmpgular(this.workspace.root, this._host, this._registry);
        this._workspace = loadSpaces[0];
        this._ampgularConfig = loadSpaces[1];


        this.CommandConf = {
            host: this._host,
            workspace: this._workspace,
            schema: '@ampgular/cli/schemas',
            name: this.command,

        };

        this.PrerenderDesc = await getBuilderDescription(
            this.CommandConf,
        ).toPromise();
        const commandOptionArray = await parseJsonSchemaToOptions(
            this._registry,
            this.PrerenderDesc.schema,
        );
        const extra = options['--'] as string[] || [];
        const overrides = parseArguments(extra, commandOptionArray, this.logger);
        this.overrides = overrides;


        this.description.options.push(
            ...(await parseJsonSchemaToOptions(this._registry, this.PrerenderDesc.schema)),
        );


    }

    public loggingSameLine(message: string) {
        cursorTo(process.stdout, 0);
        moveCursor(process.stdout, 0, -1);
        clearLine(process.stdout, 0);
        process.stdout.write(chalk.blue(
         message),
        );
        process.stdout.write('\n');
      }

    public async  checkOptions(): Promise<0|1> {
        this.logger.info(terminal.yellow(`Starting Options Parsing & Validation for ${this.command}`));

        if (this.overrides != undefined) {

        if (this.overrides['--'] && this.overrides['--'] != undefined) {
            (this.overrides['--'] || []).forEach(additional => {
                this.logger.fatal(`Unknown option: '${additional.split(/=/)[0]}'`);
            });
            this.logger.error(
                `For avaialble options, type: 'amp ${this.command} --help'`,
            );

            return 1;
        }
    }
        try {

            await this._workspace
                .validateAgainstSchema(
                    this.commandConfigOptions,
                    this.PrerenderDesc.schema,
                )
                .toPromise();
        } catch (e) {
            this.logger.fatal(` Properties from ${JSON.stringify(this.commandConfigOptions)} not accepted in ${this.command} Schema Definition`);

            return 1;
        }
        this.logger.info(terminal.blue(`Options Parsing & Validation..... Completed for ${this.command}`));

        return 0;

    }

    public async run(options: T & Arguments): Promise<0 | 1> {
        return this.checkOptions();
    }

}
