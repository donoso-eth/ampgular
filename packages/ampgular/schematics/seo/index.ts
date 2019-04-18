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
import { WorkspaceProject, WorkspaceSchema, getWorkspace, getWorkspacePath } from './utility';

// import { JsonObject } from "../core/src";

export interface Test {
  // tslint:disable-next-line:no-any
  architect?: any;
}

export interface SeoOptions {
  target: string;
  clientProject?: string;
}

function listProjectNames(workspace: { [k: string]: WorkspaceProject; }): string[] {
  return Object.keys(workspace);
}

function getDefaultProjectName(workspace: WorkspaceSchema): string | null {


  if (workspace.defaultProject) {
    // If there is a default project name, return it.
    return workspace.defaultProject;
  } else if (listProjectNames(workspace.projects).length === 1) {
    // If there is only one project, return that one.
    return listProjectNames(workspace.projects)[0];
  }

  // Otherwise return null.
  return null;
}

function getClientProjectOptions(
  options: SeoOptions, host: Tree,
): SeoOptions {
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


function externalUniversal(options: SeoOptions, host: Tree): Rule {
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


function changeConfigPaths(options: SeoOptions, host: Tree): Rule {
  return (host: Tree) => {
    const workspace = getWorkspace(host);

    const { target } = options;


    const clientProject: Test = workspace.projects[options.clientProject as string] as {};

    if (target == 'node') {

      clientProject.architect.server.configurations['seo'] =
      Object.assign({}, clientProject.architect.server.configurations['production'])
        ;
      clientProject.architect.server.configurations['seo'][
        'fileReplacements'
      ] = [
          {
            replace: 'src/environments/environment.ts',
            with: 'src/environments/environment.seo.ts',
          },
        ];
    } else {

      clientProject.architect.build.configurations['seo'] =
      Object.assign({}, clientProject.architect.build.configurations['production'])
        ;
      clientProject.architect.build.configurations['seo'][
        'fileReplacements'
      ] = [
          {
            replace: 'src/environments/environment.ts',
            with: 'src/environments/environment.seo.ts',
          },
        ];
    }


    const workspacePath = getWorkspacePath(host);
    host.overwrite(workspacePath, JSON.stringify(workspace, null, 2));

    return host;
  };
}

function createFiles(options: SeoOptions, host: Tree): Rule {


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

// function addModuleLoader(): Rule {
//   return (host: Tree) => {
//     host.getDir('src').visit(filePath => {
//       if (!filePath.endsWith('app.server.module.ts')) {
//         return;
//       }
//       const content = host.read(filePath);

//       if (!content) {
//         throw new SchematicsException(`app.server.modulets does not exist.`);
//       }
//       const sourceText = content.toString('utf-8');

//       const source = ts.createSourceFile(
//         filePath,
//         sourceText,
//         ts.ScriptTarget.Latest,
//         true,
//       );

//       const importRecorder = host.beginUpdate(filePath);
//       const importChanges = addImportToModule(
//         source,
//         filePath,
//         'ModuleMapLoaderModule',
//         '@nguniversal/module-map-ngfactory-loader',
//       );

//       for (const change of importChanges) {
//         if (change instanceof InsertChange) {
//           importRecorder.insertLeft(change.pos, change.toAdd);
//         }
//       }
//       host.commitUpdate(importRecorder);

//       return host;
//     });
//   };
// }

function updteEnvironmentFiles(options: SeoOptions, tree: Tree): Rule {
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
      tree.overwrite('src/environments/environment.server.ts',
      JSON.stringify(enProdConfig, null, 2));
    }


    return tree;
  };
}

function addDependenciesandCreateScripts(options: SeoOptions): Rule {
  return (host: Tree) => {
    const pkgPath = '/package.json';
    const buffer = host.read(pkgPath);
    if (buffer === null) {
      throw new SchematicsException('Could not find package.json');
    }

    const pkg = JSON.parse(buffer.toString());
    pkg.dependencies['@nguniversal/module-map-ngfactory-loader'] = '^7.1.1';
    pkg.dependencies['@nguniversal/express-engine'] = '^7.1.1';

    host.overwrite(pkgPath, JSON.stringify(pkg, null, 2));

    return host;
  };
}

export function seo(options: SeoOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {


    return chain([
      externalUniversal(options, tree),
      createFiles(options, tree),
      changeConfigPaths(options, tree),
      addDependenciesandCreateScripts(options),
      // addConfigurationToConfig(options),
    //  updteEnvironmentFiles(options,tree)
    ])(tree, context);
  };
}
