
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
import { WorkspaceProject, WorkspaceSchema,
  getWorkspace,
  getWorkspacePath } from './utility';
import { UpdateEnvironmentFile } from './utility/ng-ast-utils';

export interface Test {
  // tslint:disable-next-line:no-any
  architect?: any;
}

export interface AmpOptions {
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
  options: AmpOptions, host: Tree,
): AmpOptions {
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

function changeConfigPaths(options: AmpOptions, host: Tree): Rule {
  return (host: Tree) => {
    const workspace = getWorkspace(host);

    const { target } = options;

    if (options.clientProject == undefined) {
      options = getClientProjectOptions(options, host);
    }

    const clientProject: Test = workspace.projects[options.clientProject as string] as {};


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
      clientProject.architect.server.configurations['amp'][
          'outputPath'
        ] =  'dist/amp';


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
      clientProject.architect.build.configurations['amp'][
          'outputPath'
        ] =  'dist/amp';

    }


    const workspacePath = getWorkspacePath(host);
    host.overwrite(workspacePath, JSON.stringify(workspace, null, 2));

    return host;
  };
}

function createFiles(options: AmpOptions, host: Tree): Rule {


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


function updateEnvironmentFiles(options: AmpOptions, tree: Tree): Rule {
  return (tree: Tree) => {

    const changeEnvFile = new UpdateEnvironmentFile();
    tree = changeEnvFile.changeEnvFile(
      { name: 'amp', initiator: false },
      'src/environments/environment.ts', tree);
    let originalPath: string;
    originalPath = 'src/environments/environment.prod.ts';
    const originalPathExists =  tree.exists(originalPath);
    if (!originalPathExists) {
        throw new SchematicsException(`environment prod file not found.`);
      }

    const originalFileBuffer = tree.read(originalPath) as Buffer;
    const originalFileString = originalFileBuffer.toString('utf-8');

    const seoPath = 'src/environments/environment.seo.ts';
    const ampPath = 'src/environments/environment.amp.ts';
    const existsAmpFile = tree.exists(ampPath);

    if (existsAmpFile) {
      tree.overwrite(ampPath, originalFileString);
    } else {
      tree.create(ampPath, originalFileString);
    }
    tree = changeEnvFile.changeEnvFile(
      { name: 'amp', initiator: true },
      ampPath, tree);

    tree = changeEnvFile.changeEnvFile(
      { name: 'amp', initiator: false },
      seoPath, tree);

    tree = changeEnvFile.changeEnvFile(
      { name: 'amp', initiator: false },
      originalPath, tree);


    return tree;
  };
}

function addDependenciesandCreateScripts(options: AmpOptions): Rule {
  return (host: Tree) => {
    const pkgPath = '/package.json';
    const buffer = host.read(pkgPath);
    if (buffer === null) {
      throw new SchematicsException('Could not find package.json');
    }

    const scssPath = 'srs/styles.scss';

    if (host.exists(scssPath)) {
      const pkg = JSON.parse(buffer.toString());
      pkg.scripts['build-amp-css'] = 'node-sass src/styles.scss -o dist/amp';
      host.overwrite(pkgPath, JSON.stringify(pkg, null, 2));
    }

    return host;
  };
}


function externalSeo(options: AmpOptions, host: Tree): Rule {

    return branchAndMerge(
      externalSchematic('@ampgular/seo', 'ng-add', options),
    );

}


export function amp(options: AmpOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {


    return chain([
      externalSeo(options, tree),
      createFiles(options, tree),
      changeConfigPaths(options, tree),
      addDependenciesandCreateScripts(options),
      updateEnvironmentFiles(options, tree),
    ])(tree, context);
  };
}
