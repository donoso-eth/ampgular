/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Path,
  basename,
  dirname,
  experimental,
  json,
  normalize,
  virtualFs,
} from '@angular-devkit/core';
import { findUp } from '../utilities/find-up';
import { Workspace } from './workspace';


export class WorkspaceLoader {
  // TODO: add remaining fallbacks.
  private _configFileNames = [
    normalize('.angular.json'),
    normalize('angular.json'),
  ];
  constructor(private _host: virtualFs.Host, private registry: json.schema.CoreSchemaRegistry) { }

  loadWorkspace(projectPath?: string): Promise<Workspace> {
    return this._loadWorkspaceFromPath(this._getProjectWorkspaceFilePath(projectPath));
  }

  // TODO: do this with the host instead of fs.
  private _getProjectWorkspaceFilePath(projectPath?: string): Path {
    // Find the workspace file, either where specified, in the Angular CLI project
    // (if it's in node_modules) or from the current process.
    const workspaceFilePath = (projectPath && findUp(this._configFileNames, projectPath))
      || findUp(this._configFileNames, process.cwd())
      || findUp(this._configFileNames, __dirname);

    if (workspaceFilePath) {
      return normalize(workspaceFilePath);
    } else {
      throw new Error(`Local workspace file ('angular.json') could not be found.`);
    }
  }

  private _loadWorkspaceFromPath(workspacePath: Path) {
    const workspaceRoot = dirname(workspacePath);
    const workspaceFileName = basename(workspacePath);
    const workspace = new Workspace(workspaceRoot, this._host, this.registry);

    return workspace.loadWorkspaceFromHost(workspaceFileName).toPromise();
  }
}
