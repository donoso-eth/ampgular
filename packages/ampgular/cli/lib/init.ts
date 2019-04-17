/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { join, normalize } from '@angular-devkit/core';
import * as fs from 'fs';
import { readFileSync } from 'fs';
import * as path from 'path';
import { Duplex } from 'stream';
import 'symbol-observable';
// import { isWarningEnabled } from '../utilities/config';
interface NodeModuleHacked extends NodeModule {
  _compile: any;
}

const ts = require('typescript');
const compilerOptions = ts.readConfigFile(join(normalize(__dirname), '../tsconfig.json'), (p: string | number | Buffer | import('url').URL) => readFileSync(p, 'utf-8')).config;


const basedir = normalize(process.cwd());
require.extensions['.ts'] = function (m: NodeModuleHacked, filename) {
  const source = readFileSync(filename).toString();
  try {
    const result = ts.transpile(source, compilerOptions['compilerOptions'], filename);


    // Send it to node to execute.
    return m._compile(result, filename);
  } catch (err) {
    console.error('Error while running script "' + filename + '":');
    console.error(err.stack);
    throw err;
  }
};


const packageJson = require('../package.json');

// function _fromPackageJson(cwd?: string) {
//   cwd = cwd || process.cwd();

//   do {
//     const packageJsonPath = path.join(cwd, 'node_modules/@angular/cli/package.json');
//     if (fs.existsSync(packageJsonPath)) {
//       const content = fs.readFileSync(packageJsonPath, 'utf-8');
//       if (content) {
//         const json = JSON.parse(content);
//         if (json['version']) {
//           return new SemVer(json['version']);
//         }
//       }
//     }

//     // Check the parent.
//     cwd = path.dirname(cwd);
//   } while (cwd != path.dirname(cwd));

//   return null;
// }


// Check if we need to profile this CLI run.
if (process.env['NG_CLI_PROFILING']) {
  let profiler: {
    startProfiling: (name?: string, recsamples?: boolean) => void;
    stopProfiling: (name?: string) => any; // tslint:disable-line:no-any
  };
  try {
    profiler = require('v8-profiler-node8'); // tslint:disable-line:no-implicit-dependencies
  } catch (err) {
    throw new Error(`Could not require 'v8-profiler-node8'. You must install it separetely with ` +
      `'npm install v8-profiler-node8 --no-save'.\n\nOriginal error:\n\n${err}`);
  }

  profiler.startProfiling();

  const exitHandler = (options: { cleanup?: boolean, exit?: boolean }) => {
    if (options.cleanup) {
      const cpuProfile = profiler.stopProfiling();
      fs.writeFileSync(
        path.resolve(process.cwd(), process.env.NG_CLI_PROFILING || '') + '.cpuprofile',
        JSON.stringify(cpuProfile),
      );
    }

    if (options.exit) {
      process.exit();
    }
  };

  process.on('exit', () => exitHandler({ cleanup: true }));
  process.on('SIGINT', () => exitHandler({ exit: true }));
  process.on('uncaughtException', () => exitHandler({ exit: true }));
}

let cli;
// try {
//   const projectLocalCli = resolve(
//     '@angular/cli',
//     {
//       checkGlobal: false,
//       basedir: process.cwd(),
//       preserveSymlinks: true,
//     },
//   );

//   // This was run from a global, check local version.
//   //const globalVersion = new SemVer(packageJson['version']);
//   let localVersion;
//   let shouldWarn = false;

// //   try {
// //     localVersion = _fromPackageJson();
// //     shouldWarn = localVersion != null && globalVersion.compare(localVersion) > 0;
// //   } catch (e) {
// //     // eslint-disable-next-line no-console
// //     console.error(e);
// //     shouldWarn = true;
// //   }

// //   if (shouldWarn && isWarningEnabled('versionMismatch')) {
// //     const warning = terminal.yellow(tags.stripIndents`
// //     Your global Angular CLI version (${globalVersion}) is greater than your local
// //     version (${localVersion}). The local Angular CLI version is used.

// //     To disable this warning use "ng config -g cli.warnings.versionMismatch false".
// //     `);
// //     // Don't show warning colorised on `ng completion`
// //     if (process.argv[2] !== 'completion') {
// //         // eslint-disable-next-line no-console
// //       console.error(warning);
// //     } else {
// //         // eslint-disable-next-line no-console
// //       console.error(warning);
// //       process.exit(1);
// //     }
// //   }

//   // No error implies a projectLocalCli, which will load whatever
//   // version of amp-cli you have installed in a local package.json
//   cli = require(projectLocalCli);
// } catch {
//   // If there is an error, resolve could not find the amp-cli
//   // library from a package.json. Instead, include it from a relative
//   // path to this script file (which is likely a globally installed
//   // npm package). Most common cause for hitting this is `ng new`
//   cli = require('./cli');
// }

cli = require('./cli');

if ('default' in cli) {
   cli = cli['default'];
 }


// This is required to support 1.x local versions with a 6+ global
let standardInput;
try {
  standardInput = process.stdin;
} catch (e) {
  delete process.stdin;
  process.stdin = new Duplex();
  standardInput = process.stdin;
}

cli({
  cliArgs: process.argv.slice(2),
  inputStream: standardInput,
  outputStream: process.stdout,
})
  .then((exitCode: number) => {
    process.exit(exitCode);
  })
  .catch((err: Error) => {
    console.error('Unknown error: ' + err.toString());
    process.exit(127);
  });
