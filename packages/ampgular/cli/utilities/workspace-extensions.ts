
import {
    getSystemPath,

    json,
    logging,

    virtualFs,
    dirname,


  } from '@angular-devkit/core';
import {  relative,  join,  normalize} from 'path';
import * as child_process from 'child_process';
import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { Schema as AmpgularConfig } from '../lib/config/schema';
import { Arguments } from '../models/interface';
import { Workspace } from '../models/workspace';
import { WorkspaceLoader } from '../models/workspace-loader';
import { Schema as BuildOptions } from '../schemas/build';
//import { webpackcss } from './webpack';
import { Mode } from '../schemas/amp';


export async function loadWorkspaceAndAmpgular(
  workspacePath: string, host: virtualFs.Host,
  registry: json.schema.CoreSchemaRegistry): Promise<[Workspace, AmpgularConfig ]> {

    const workspaceLoader = new WorkspaceLoader(host, registry);
    const workspace = await workspaceLoader.loadWorkspace(workspacePath);

    const basedir = getSystemPath(workspace.root);
    const ampgularPath = join(normalize(basedir), 'ampgular', 'ampgular.json');
    // const ampgularConfig = await loadJsonFile(
    //   ampgularPath,
    //   host,
    // ).toPromise();

    const ampgularConfig = JSON.parse(
      readFileSync(ampgularPath).toString('utf-8')) as AmpgularConfig;

    return [workspace , ampgularConfig ];
  }

export async function getProjectName(workspace: Workspace): Promise<string> {
    const maybeProjectNames = workspace.listProjectNames();
    let projectName;
    switch (maybeProjectNames.length) {
      case 0:
        throw new Error(`No projects founds in workspace`);
        break;
      case 1:
        projectName = maybeProjectNames[0];
        break;
      default:
        const defaultProjectName = workspace.getDefaultProjectName();
        const projectNameFilter = maybeProjectNames.filter(
          name => name == defaultProjectName,
        );
        switch (projectNameFilter.length) {
          case 1:
           projectName = projectNameFilter[0];
           break;
          default:
          throw new Error(`No default project found in workspace`);
          break;
        }
    }

    return projectName;

  }

export async function runOptionsBuild(
  options: any, logger: logging.Logger ): Promise<0|1> {

    if (options.target == 'node') {

      logger.warn(`BUILDING SERVER APPLICATON..... this may take several minutes`);
      logger.warn(`Target is ${options.target}  configuration is ${options.configuration} `);


      await _exec('ng', ['run', options.projectName + ':server',
                        '--configuration=' + options.configuration], {}, logger);


      if (options.mode == Mode.Render){
      /* Hack precompiling the scss t the render Folder until we achieve to progamatically launch the node-sass..... */

        if (existsSync(join(normalize(process.cwd()),'src/styles.css'))){

            if(options.configuration == 'amp'){
              _copy(join(normalize(process.cwd()),'src/styles.css'),join(normalize(process.cwd()),'dist/amp/styles.css'))
            }
            else {
              _copy(join(normalize(process.cwd()),'src/styles.css'),join(normalize(process.cwd()),'dist/server/styles.css'))

            }

        }
        else  if (existsSync(join(normalize(process.cwd()),'src/styles.scss'))){


          if(options.configuration == 'amp'){
            await _exec('npm',['run','build-amp-css'], {}, logger);

          }
          else {
            await _exec('npm',['run','build-server-css'], {}, logger);
          }
        }

      }




      return  0;

  } else {
    logger.warn(`BUILDING CLIENT APPLICATON..... this may take several minutes`);
    logger.warn(`Target is ${options.target}  configuration is ${options.configuration} `);
    await _exec('ng', ['build', '--configuration=' + options.configuration], {}, logger);


    const BROWSER_PATH = join(normalize(process.cwd()),'dist/browser');
    const SERVER_PATH = join(normalize(process.cwd()),'dist/server');
    const AMP_PATH = join(normalize(process.cwd()),'dist/amp');

    // Coping css to server folder
    if (options.mode == Mode.Render){


      //CHECK Which STYLES FILE
      let styles = 'styles.css'
        let styleArray = readdirSync(BROWSER_PATH)
          .filter((item: string) => item.match(/^(styles\.)[\w]+(\.css)$/g))

        if (styleArray.length > 0) {
          styles = styleArray[0]
        }

        if (options.configuration=='amp'){
          if (!existsSync(AMP_PATH)) {
            mkdirSync(AMP_PATH);
          }
          _copy( join(BROWSER_PATH, styles),join(AMP_PATH, styles ));
        }
        else {
          if (!existsSync(SERVER_PATH)) {
            mkdirSync(SERVER_PATH);
          }
          _copy( join(BROWSER_PATH, styles),join(SERVER_PATH, styles ));
        }

      }


    }
    return 0;
  }

  function _copy(from: string, to: string) {


    from = relative(normalize(process.cwd()), normalize(from));
    to = relative(normalize(process.cwd()), normalize(to));
    const buffer = readFileSync(from);
    writeFileSync(to, buffer);
  }


function _exec(
    command: string,
    args: string[],
    opts: { cwd?: string },
    logger: logging.Logger,
  ): Promise<string> {


    return new Promise((resolve) => {
      const { status, error, stderr, stdout, output } = child_process.spawnSync(
        command,
        args,
        {
          stdio: 'inherit',
          ...opts,

            shell: true

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
