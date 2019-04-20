/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { AmpDescription } from '../models/interface';
import { Schema as FormPostComponentSchema } from '../schemas/component-form-post';
import { Schema as ListGetComponentSchema } from '../schemas/component-list-get';
import { Schema as ListPostComponentSchema } from '../schemas/component-list-post';
import {
  createFormPostComponent, createListGetComponent,
  createListPostComponent
} from './recreate-dynamic';
import {
  createComponentDefault, createComponentListBind,
  createComponentListSingle,
  createComponentMultiBind, createComponentScroll
} from './recreate-state';
import { join, normalize } from '@angular-devkit/core';


const recreateState = async (args: AmpDescription): Promise<AmpDescription> => {
  // tslint:disable-next-line:no-any
  const myPageState: any = args.pageState;

  if (myPageState == undefined) {
    return args;
  }

  Object.keys(myPageState).forEach(async state => {
    const myComponent = myPageState[state];
    const componentType = myComponent['type'];

    switch (componentType) {
      case 'list-single':
        args = await createComponentListSingle(args, myComponent, state);
        break;
      case 'list-bind':
        args = await createComponentListBind(args, myComponent, state);
        break;
      case 'multi-bind':
        args = await createComponentMultiBind(args, myComponent, state);
        break;

      case 'scroll':
        args = await createComponentScroll(args, myComponent, state);
        break;

      default:
        args = await createComponentDefault(args, myComponent, state);
        break;
    }
  });

  return args;
};

const recreateDynamicData = async (args: AmpDescription): Promise<AmpDescription> => {
  // tslint:disable-next-line:no-any
  const myPageDynamic: any = args.pageDynamic;


  if (myPageDynamic == undefined) {
    return args;
  }

  for (const dynamic of Object.keys(myPageDynamic)) {
    const myDynamic = myPageDynamic[dynamic];

    const ListsDynamic = myDynamic['lists'];
    if (ListsDynamic != undefined) {
      ListsDynamic.forEach(async (list: ListPostComponentSchema | ListGetComponentSchema) => {
        switch (list['type']) {
          case 'post':
            args = await createListPostComponent(args, dynamic, list as ListPostComponentSchema);
            break;
          case 'get':
            args = await createListGetComponent(args, dynamic, list as ListGetComponentSchema);
            break;

          default:
            break;
        }
      });
    }
    const FormsDynamic = myDynamic['forms'];
    if (FormsDynamic != undefined) {
      FormsDynamic.forEach(async (form: FormPostComponentSchema) => {
        switch (form['type']) {
          case 'post':
            args = await createFormPostComponent(args, dynamic, form);
            break;
          default:
            break;
        }
      });
    }
  }

  return args;
};

const recreatePlugins = async (args: AmpDescription): Promise<AmpDescription> => {

  // tslint:disable-next-line:no-any
  const myPagePlugin: any = args.pagePlugins;


  for (const myPlugin of Object.keys(myPagePlugin)) {

    const pluginFunctionPath = join(normalize(process.cwd()), 'ampgular/amp/plugins/' + myPagePlugin[myPlugin].plugin + '-plugin')
    const myPluginFunction = require(pluginFunctionPath).default;

    args = await myPluginFunction(args);
  }


  return args;
};


export const BeSmart = async (
  args: AmpDescription,
): Promise<AmpDescription> => {

  args = await recreateState(args);

  args = await recreateDynamicData(args);

  args = await recreatePlugins(args);

  return args;
};
