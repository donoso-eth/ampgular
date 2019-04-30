/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */


import * as child_process from 'child_process';
import * as fs from 'fs';
import { normalize, join } from 'path';
import { Command } from '../models/command';
import { findUp } from '../utilities/find-up';
import { Schema as VersionCommandSchema } from './version';
import { readFileSync } from 'fs';

export class ConfigCommand extends Command<VersionCommandSchema> {
  public static aliases = ['v'];

  async run() {

    console.log(join(normalize(process.cwd()),'ampgular/ampgular.json'));
    const ampJson =  readFileSync(join(normalize(process.cwd()),'ampgular/ampgular.json'));

    this.logger.info(ampJson.toString('utf-8'));

    return 0

}
}
