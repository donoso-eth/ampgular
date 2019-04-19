/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// tslint:disable:no-any
// tslint:disable:no-implicit-dependencies
import { logging } from '@angular-devkit/core';
import * as readline from 'readline';
import validateCommits from '../validate-commits';


const emptySha = '0'.repeat(40);


export default function (_: {}, logger: logging.Logger) {
  let validateCommitResult = 0;

  // Work on POSIX and Windows
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  console.log('javierXXXXXXXXX');
  let shay = '';
  let reshay = '';
  rl.on('line', line => {

    const [, localSha, , remoteSha] = line.split(/\s+/);

    shay = localSha;
    reshay = remoteSha;
    if (localSha == emptySha) {
      // Deleted branch.
      return;
    }

    if (remoteSha == emptySha) {
      // New branch.
      validateCommitResult = validateCommits({ base: localSha }, logger);
    } else {
      validateCommitResult = validateCommits({ base: remoteSha, head: localSha }, logger);
    }
  });
  rl.on('end', () => {
    console.log(reshay, shay);
    process.exit(validateCommitResult);
});
}
