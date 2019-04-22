/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { terminal, logging } from '@angular-devkit/core';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Command } from '../models/command';
import { findUp } from '../utilities/find-up';
import { Schema as VersionCommandSchema } from './version';

export class VersionCommand extends Command<VersionCommandSchema> {
  public static aliases = ['v'];

  async run() {

    await _exec("ng",["version"],{},this.logger);

    const pkg = require(path.resolve(__dirname, '..', 'package.json'));
    let projPkg;
    try {
      projPkg = require(path.resolve(this.workspace.root, 'package.json'));
    } catch (exception) {
      projPkg = undefined;
    }

    const patterns = [
      /^@ampgular\/.*/,
    ];

    const maybeNodeModules = findUp('node_modules', __dirname);
    const packageRoot = projPkg
      ? path.resolve(this.workspace.root, 'node_modules')
      : maybeNodeModules;

    const packageNames = [
      ...Object.keys(pkg && pkg['dependencies'] || {}),
      ...Object.keys(pkg && pkg['devDependencies'] || {}),
      ...Object.keys(projPkg && projPkg['dependencies'] || {}),
      ...Object.keys(projPkg && projPkg['devDependencies'] || {}),
      ];

    if (packageRoot != null) {
      // Add all node_modules and node_modules/@*/*
      const nodePackageNames = fs.readdirSync(packageRoot)
        .reduce<string[]>((acc, name) => {
          if (name.startsWith('@')) {
            return acc.concat(
              fs.readdirSync(path.resolve(packageRoot, name))
                .map(subName => name + '/' + subName),
            );
          } else {
            return acc.concat(name);
          }
        }, []);

      packageNames.push(...nodePackageNames);
    }

    const versions = packageNames
      .filter(x => patterns.some(p => p.test(x)))
      .reduce((acc, name) => {
        if (name in acc) {
          return acc;
        }

        acc[name] = this.getVersion(name, packageRoot, maybeNodeModules);

        return acc;
      }, {} as { [module: string]: string });

    let ampCliVersion = pkg.version;
    if (!__dirname.match(/node_modules/)) {
      let gitBranch = '??';
      try {
        const gitRefName = '' + child_process.execSync('git symbolic-ref HEAD', {cwd: __dirname});
        gitBranch = path.basename(gitRefName.replace('\n', ''));
      } catch {
      }

      ampCliVersion = `local (v${pkg.version}, branch: ${gitBranch})`;
    }
    let angularCoreVersion = '';
    const angularSameAsCore: string[] = [];

    const namePad = ' '.repeat(
      Object.keys(versions).sort((a, b) => b.length - a.length)[0].length + 3,
    );
    const asciiArt = `
    _     __     _  ____   ____   _   _  _         _      ____
   / \\   |   \\  / ||     \\| ___| | | | || |       /  \\   |  _ \\
  / △ \\  |   _\\/_ ||  _ _|| |  _ | | | || |      / △  \\  | |_||
 / ___ \\ |  |   | ||  |   | |_| || |_| || |___  / ___  \\ | |  \\\\
/_/   \\_\\|__|   |_||__|   |_____||_____||_____|/_/    \\_\\|_|   \\\\
`.split('\n').map(x => terminal.red(x)).join('\n');

    this.logger.info(asciiArt);
    this.logger.info(`
      Ampgular CLI: ${ampCliVersion}
      Node: ${process.versions.node}
      OS: ${process.platform} ${process.arch}

      Package${namePad.slice(7)}Version
      -------${namePad.replace(/ /g, '-')}------------------
      ${Object.keys(versions)
          .map(module => `${module}${namePad.slice(module.length)}${versions[module]}`)
          .sort()
          .join('\n')}
    `.replace(/^ {6}/gm, ''));
  }

  private getVersion(
    moduleName: string,
    projectNodeModules: string | null,
    cliNodeModules: string | null,
  ): string {
    try {
      if (projectNodeModules) {
        const modulePkg = require(path.resolve(projectNodeModules, moduleName, 'package.json'));

        return modulePkg.version;
      }
    } catch (_) {
    }

    try {
      if (cliNodeModules) {
        const modulePkg = require(path.resolve(cliNodeModules, moduleName, 'package.json'));

        return modulePkg.version + ' (cli-only)';
      }
    } catch {
    }

    return '<error>';
  }
}
function _exec(
  command: string,
  args: string[],
  opts: { cwd?: string },
  logger: logging.Logger,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const { status, error, stderr, stdout, output } = child_process.spawnSync(
      command,
      args,
      {
        stdio: 'inherit',
        ...opts,
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

