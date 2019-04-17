import { Path, getSystemPath, join, normalize } from '@angular-devkit/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { loadJsonFile } from '../utilities/utils';


export function getBuilderDescription<OptionsT>(commandConfig: any): Observable<any> {
    // Check cache for this builder description.

    return new Observable(obs => {
      // TODO: this probably needs to be more like NodeModulesEngineHost.
      const basedir = getSystemPath(commandConfig.workspace.root);
      const pkg = commandConfig.schema;
      const commandName = commandConfig.name;
      // const pkgJsonPath = nodeResolve(pkg, { basedir, checkLocal: true });
      const commandjsonPath = join(
        normalize(basedir),
        'node_modules',
        pkg,
        commandName + '.json',
      );

      let buildersJsonPath: Path;
      let Paths: any;

      // Read the `builders` entry of package.json.
      return loadJsonFile(normalize(commandjsonPath), commandConfig.host)
        .pipe(
          // Validate builders json.
          // concatMap((builderPathsMap) => this._workspace.validateAgainstSchema<BuilderPathsMap>(
          //   builderPathsMap, this._buildersSchema)),
          map(commandSchema => {
            const commandDescription = {
              name: commandName,
              schema: commandSchema,
              description: commandSchema['description'],
            };

            // Save to cache before returning.
            // this._builderDescriptionMap.set(builderDescription.name, builderDescription);

            return commandDescription;
          }),
        )
        .subscribe(obs);
    });
  }

export  function  getCommandConfig<OptionsT>(commandConfig: any): Observable<any> {
    // Check cache for this builder description.
    const { command: CommandName, overrides } = commandConfig;

    return new Observable(obs => {
      // TODO: this probably needs to be more like NodeModulesEngineHost.
      const basedir = getSystemPath(commandConfig.workspace.root);

      const commandName = CommandName;
      // const pkgJsonPath = nodeResolve(pkg, { basedir, checkLocal: true });
      const configjsonPath = join(
        normalize(basedir),
        'ampgular',
        'ampgular.json',
      );

      // Read the `builders` entry of package.json.
      return loadJsonFile(normalize(configjsonPath), commandConfig.host)
        .pipe(
          // Validate builders json.
          // concatMap((builderPathsMap) => this._workspace.validateAgainstSchema<BuilderPathsMap>(
          //   builderPathsMap, this._buildersSchema)),
          map(config => {
            const commandConfig = {
              name: commandName,
              schema: '@ampgular/cli/schemas',
              options: {
                ...(config[commandName] as {}),
                ...(overrides as {}),
              } as OptionsT,
            };

            // Save to cache before returning.
            // this._builderDescriptionMap.set(builderDescription.name, builderDescription);

            return commandConfig;
          }),
        )
        .subscribe(obs);
    });
  }
