import { basename, experimental, logging, strings } from '@angular-devkit/core';
import {
  OptionIsNotDefinedException,
  Rule,
  SchematicContext,
  SchematicsException,
  Source,
  Tree,
  apply,
  branchAndMerge,
  chain,
  externalSchematic,
  forEach,
  mergeWith,
  move,
  template,
  url,
} from '@angular-devkit/schematics';
import { throws } from 'assert';
import * as ts from 'typescript';
import { getWorkspace, getWorkspacePath } from './utility';
import {
  // getDecoratorMetadata,
  // findNode,
  addImportToModule,
} from './utility';
import { InsertChange } from './utility';
// import { JsonObject } from "../core/src";

export interface test {
  architect?: any;
}

function listProjectNames(workspace: any): string[] {
  return Object.keys(workspace);
}

function getDefaultProjectName(workspace: any): string | null {


  if (workspace.defaultProject) {
    // If there is a default project name, return it.
    return workspace.defaultProject;
  } else if (listProjectNames(workspace).length === 1) {
    // If there is only one project, return that one.
    return listProjectNames(workspace)[0];
  }

  // Otherwise return null.
  return null;
}

function getClientProjectOptions(
  options: any, host: Tree,
): experimental.workspace.WorkspaceProject {
  const workspace = getWorkspace(host);
  const maybeProjectNames = listProjectNames(workspace.projects);
  let projectName;
  switch (maybeProjectNames.length) {
    case 0:
      throw new Error(`No projects founds in workspace`);
      break;
    case 1:
      projectName = maybeProjectNames[0];
      break;
    default:
      const defaultProjectName = getDefaultProjectName(workspace);
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
  options.clientProject = projectName;

  return options;
}


function externalUniversal(options: any, host: Tree): Rule {
  const filePathServer = '/src/app/app.server.module.ts';
  const existsUniversal = host.exists(filePathServer);
  if (options.clientProject == undefined) {
    options = getClientProjectOptions(options, host);
  }
  if (existsUniversal || options.target == 'browser') {
    return (host: Tree, _context: SchematicContext) => {
      return host;
    };
  } else {


    return branchAndMerge(
      externalSchematic('@schematics/angular', 'universal', options),
    );
  }
}


function changeConfigPaths(options: any, host: Tree): Rule {
  return (host: Tree) => {
    const workspace = getWorkspace(host);

    const { target } = options;
    const configAvailable: any = {
      server: { test: 'server' },
      client: { test: 'client' },
    };


    const clientProject: test = workspace.projects[options.clientProject] as {};


    if (target == 'node') {

      clientProject.architect.server.configurations['amp'] =
      Object.assign({}, clientProject.architect.server.configurations['production'])
        ;
      clientProject.architect.server.configurations['amp'][
        'fileReplacements'
      ] = [
          {
            replace: 'src/environments/environment.ts',
            with: 'src/environments/environment.amp.ts',
          },
        ];
    } else {

      clientProject.architect.build.configurations['amp'] =
      Object.assign({}, clientProject.architect.build.configurations['production'])
        ;
      clientProject.architect.build.configurations['amp'][
        'fileReplacements'
      ] = [
          {
            replace: 'src/environments/environment.ts',
            with: 'src/environments/environment.amp.ts',
          },
        ];
    }


    const workspacePath = getWorkspacePath(host);
    host.overwrite(workspacePath, JSON.stringify(workspace, null, 2));

    return host;
  };
}

function createFiles(options: any, host: Tree): Rule {


  const templateSource = applyWithOverwrite(url('./files'), [
    template({
      ...strings,
      ...(options as object),
      stripTsExtension: (s: string) => {
        return s.replace(/\.ts$/, '');
      },
    }),
    move(''),
  ]);

  return templateSource;
}

function applyWithOverwrite(source: Source, rules: Rule[]): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const rule = mergeWith(
      apply(source, [
        ...rules,
        forEach((fileEntry) => {

          if (tree.exists(fileEntry.path)) {

            // tree.overwrite(fileEntry.path, fileEntry.content);
            return null;
          } else {
            tree.create(fileEntry.path, fileEntry.content);
          }

          return fileEntry;
        }),

      ]),
    );

    return rule(tree, _context);
  };
}

function addModuleLoader(): Rule {
  return (host: Tree) => {
    host.getDir('src').visit(filePath => {
      if (!filePath.endsWith('app.server.module.ts')) {
        return;
      }
      const content = host.read(filePath);

      if (!content) {
        throw new SchematicsException(`app.server.modulets does not exist.`);
      }
      const sourceText = content.toString('utf-8');

      const source = ts.createSourceFile(
        filePath,
        sourceText,
        ts.ScriptTarget.Latest,
        true,
      );

      const importRecorder = host.beginUpdate(filePath);
      const importChanges = addImportToModule(
        source,
        filePath,
        'ModuleMapLoaderModule',
        '@nguniversal/module-map-ngfactory-loader',
      );

      for (const change of importChanges) {
        if (change instanceof InsertChange) {
          importRecorder.insertLeft(change.pos, change.toAdd);
        }
      }
      host.commitUpdate(importRecorder);

      return host;
    });
  };
}

function addConfigurationToConfig(options: any): Rule {
  return (tree: Tree) => {

    const configPath = '/ampgular/ampgular.json';
    const buffer = tree.read(configPath);

    if (buffer === null) {
      throw new SchematicsException('Could not find ampgualr.json');
    }
    const { target } = options;
    const config = JSON.parse(buffer.toString());
    config['target'] = target;
    const configAvailable: any = {
      server: { test: 'server' },
      client: { test: 'client' },

    };
    config[target] = configAvailable[target];
    tree.overwrite(configPath, JSON.stringify(config, null, 2));

    return tree;
  };
}

function updteEnvironmentFiles(options: any, tree: Tree): Rule {
  return (tree: Tree) => {

    const envDev = tree.read('src/environments/environment.ts') as Buffer;
    const myBuffer = envDev.toString('utf8');
    const evDevConfig = JSON.parse(myBuffer);
    evDevConfig.seo = false;
    tree.overwrite('src/environments/environment.ts', JSON.stringify(evDevConfig, null, 2));

    if (options.target == 'browser') {
      const envProd = tree.read('src/environments/environment.prod.ts') as Buffer;
      const enProdConfig = JSON.parse(envProd.toString());
      enProdConfig.seo = true;

      tree.overwrite('src/environments/environment.seo.ts', JSON.stringify(enProdConfig, null, 2));
      enProdConfig.seo = false;
      tree.overwrite('src/environments/environment.prod.ts', JSON.stringify(enProdConfig, null, 2));
    } else {
      const envProd = tree.read('src/environments/environment.server.ts') as Buffer;
      const enProdConfig = JSON.parse(envProd.toString());
      enProdConfig.seo = true;

      tree.overwrite('src/environments/environment.seo.ts', JSON.stringify(enProdConfig, null, 2));
      enProdConfig.seo = false;
      tree.overwrite('src/environments/environment.server.ts', JSON.stringify(enProdConfig, null, 2));
    }


    return tree;
  };
}

function addDependenciesandCreateScripts(options: any): Rule {
  return (host: Tree) => {
    const pkgPath = '/package.json';
    const buffer = host.read(pkgPath);
    if (buffer === null) {
      throw new SchematicsException('Could not find package.json');
    }

    const pkg = JSON.parse(buffer.toString());

    pkg.dependencies['@nguniversal/module-map-ngfactory-loader'] = '^7.1.1';
    pkg.dependencies['@ampgular/cli'] = '^0.0.1';


    host.overwrite(pkgPath, JSON.stringify(pkg, null, 2));

    return host;
  };
}

export function amp(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {


    return chain([
      externalUniversal(options, tree),
      createFiles(options, tree),
      changeConfigPaths(options, tree),
      // addDependenciesandCreateScripts(options),
      // addConfigurationToConfig(options),
    //  updteEnvironmentFiles(options,tree)
    ])(tree, context);
  };
}
