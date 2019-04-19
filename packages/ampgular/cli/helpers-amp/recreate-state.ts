/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { AmpDescription } from '../models/interface';
import {
  AmpClassArray as ClassAmpListBind, AmpEvent as EventAmpListBind,
  Schema as ListBindComponentSchema,
} from '../schemas/component-list-bind';
import {
  AmpClass as ClassAmpListSingle, AmpEvent as EventAmpListSingle,
  Schema as ListSingleComponentSchema,
} from '../schemas/component-list-single';
import {
  AmpClass as ClassAmpMultiBind,
  Schema as MultiBindComponentSchema,
} from '../schemas/component-multi-bind';
import {
  AmpEventScroll,
  Schema as ScrollComponentSchema,
} from '../schemas/component-scroll';
import { AmpClass, Schema as SimpleComponentSchema } from '../schemas/component-simple';
import { recreateEvent } from './utils';


export const createComponentDefault = async (
  args: AmpDescription, state: SimpleComponentSchema, stateName: string):
  Promise<AmpDescription> => {
  const $ = args.cheerio;
  // tslint:disable-next-line:no-any
  let obj: any = {};
  obj['current' + stateName] = stateName + 0;

  state.css.forEach((css: AmpClass) => {
    const classLook = css.id;

    const classId = $(classLook);
    classId.each((index, idEle) => {
      const styleId = new String(idEle.attribs['class']).toString();
      idEle['attribs']['[class]'] =
        stateName +
        "==true? '" +
        css['class'] +
        ' ' +
        styleId +
        "' : '" +
        styleId +
        "'";
    });
  });

  obj = {};

  for (const myEvent of state.events) {
    args = await recreateEvent(
      args,
      myEvent['id'],
      'tap',
      'AMP.setState({' + stateName + ': !' + stateName + '})',
    );
  }

  args = await AddState(args, stateName, false);

  return args;
};

export const createComponentListSingle = async (
  args: AmpDescription,
  state: ListSingleComponentSchema, stateName: string): Promise<AmpDescription> => {
  const $ = args.cheerio;


  const myRule: ClassAmpListSingle = state.css[0];
  const myID = myRule['id'];
  const myClass = myRule['class'];
  const classId = $(myID);
  classId.each(async (index, idEle) => {
    // tslint:disable-next-line:no-any
    const obj: any = {};
    obj['current' + stateName + index] = stateName + index + 0;
    const stylesbefore: string[] = [];
    const stylesAfter: string[] = [];
    const i = 0;
    const styleId = idEle.attribs['class'];
    const cla =
      stateName + index + "? '" + myClass + ' ' + styleId + "' : '" + styleId + "'";

    idEle.attribs['[class]'] = cla;
    args = await AddState(args, stateName + index, false);
  });

  state.events.forEach((myEvent: EventAmpListSingle) => {
    const classLook = myEvent['id'].slice(1, myEvent['id'].length);

    const classId = $(myEvent['id']);
    classId.each((index, idEle) => {
      const tap =
        'tap:AMP.setState({' + stateName + index + ':!' + stateName + index + '})';

      idEle['attribs']['on'] = tap;
      if (idEle.tagName != 'button') {
        idEle['attribs']['role'] = 'button';
        idEle['attribs']['tabindex'] = '';
      }
    });
  });

  return args;
};

export const createComponentListBind = async (
  args: AmpDescription,
  state: ListBindComponentSchema, stateName: string): Promise<AmpDescription> => {

  const $ = args.cheerio;

  args = await AddState(args, stateName, 0);

  // EVENTS
  state.events.forEach((event: EventAmpListBind) => {
    const myID = event['id'];
    const classId = $(myID);
    if (classId.length > 0) {
      classId.each((index, idEle) => {
        const tap = 'tap:AMP.setState({' + stateName + ':' + index + '})';

        idEle['attribs']['on'] = tap;
        if (idEle.tagName != 'button') {
          idEle['attribs']['role'] = 'button';
          idEle['attribs']['tabindex'] = '';
        }
      });
    }
  });

  // CSS
  state.css.forEach((css: ClassAmpListBind) => {
    const myID = css['id'];
    const classId = $(myID);
    const classIndex = css['class'];

    if (classId.length > 0) {
      classId.each((index, idEle) => {
        let eleClass = new String(idEle['attribs']['class']).toString();
        classIndex
          .filter((classLocal: string) => classLocal != '')
          .map((classLocal: string) => new RegExp('\\b' + classLocal + '\\b', 'gm'))
          .forEach((x: RegExp) => {
            eleClass = eleClass.replace(x, '');
          });
        idEle['attribs']['[class]'] =
          stateName +
          '<' +
          index +
          "? '" +
          eleClass +
          ' ' +
          classIndex[0] +
          "' :(" +
          stateName +
          '==' +
          index +
          "? '" +
          eleClass +
          ' ' +
          classIndex[1] +
          "' : '" +
          eleClass +
          ' ' +
          classIndex[2] +
          "')";
      });
    }
  });

  return args;
};

export const createComponentMultiBind = async (
  args: AmpDescription, state: MultiBindComponentSchema,
  stateName: string): Promise<AmpDescription> => {


  const $ = args['cheerio'];
  // tslint:disable-next-line:no-any
  const obj: any = {};
  let ii = 0;

  // tslint:disable-next-line:no-any
  const classesCleaning: any = {};
  for (const cssKey of Object.keys(state.css)) {
    let i = 0;
    const cssArray = state.css[cssKey];

    cssArray.forEach((css: ClassAmpMultiBind) => {
      classesCleaning[i] == undefined ?
        classesCleaning[i] = '' : classesCleaning[i] = classesCleaning[i];
      classesCleaning[i] = (css.class + ' ' + classesCleaning[i]).trim();
      i++;
    });
  }

  for (const cssKey of Object.keys(state.css)) {
    const stylesbefore: string[] = [];
    const stylesAfter: string[] = [];
    let i = 0;
    const cssArray = state.css[cssKey];
    cssArray.forEach((css: ClassAmpMultiBind) => {

      if (ii == 0) {
        obj['current' + stateName] = cssKey;
      }

      const classLook = css['id'];

      const classId = $(classLook);

      classId.each((index, idEle) => {

        const myLocalClasses = idEle.attribs['class'].split(' ');


        const styleId =
          myLocalClasses
            .filter(local => !classesCleaning[i].split(' ').includes(local)).join(' ').trim();

        if (ii == 0) {
          const cla =
            stateName + '[' + stateName + '.current' + stateName + '].style[' + i + ']';
          idEle.attribs['[class]'] = cla;
        }

        styleId
          ? stylesAfter.push(styleId + ' ' + css.class)
          : stylesAfter.push(css.class);
        i = i + 1;
      });
    });
    obj[cssKey] = {};
    obj[cssKey].style = stylesAfter;

    ii = 1;
  }

  const stateText =
    `<amp-state id="` +
    stateName +
    `">
       <script type="application/json">` +
    JSON.stringify(obj) +
    `
       </script>
       </amp-state>`;
  $('body').prepend(stateText);

  for (const myEvent of state.events) {
    args = await recreateEvent(
      args,
      myEvent['id'],
      'tap',
      'AMP.setState({' + stateName + ": {currentdateId : '" + myEvent['state'] + "'}})",
    );
  }

  return args;
};

export const createComponentScroll = async (
  args: AmpDescription, state: ScrollComponentSchema,
  stateName: string): Promise<AmpDescription> => {
  const $ = args['cheerio'];


  // tslint:disable-next-line:no-any
  const obj: any = {};
  obj['current' + stateName] = stateName + 0;
  const stylesbefore: string[] = [];
  const stylesAfter: string[] = [];
  const i = 0;
  state.events.forEach((event: AmpEventScroll) => {
    //  console.log(event);
    const scroll =
      'tap:' +
      event['target'] +
      '.scrollTo(duration=' +
      event['duration'] +
      ')';

    const classLook = event['id'];

    const classId = $(classLook);

    classId.attr('on', scroll);
    if (classId[0].tagName != 'button') {
      classId.attr('role', 'button');
      classId.attr('tabindex', '');
    }
  });

  return args;
};

const AddState = async (
  args: AmpDescription,
  state: string,
  value: string | boolean | number,
): Promise<AmpDescription> => {
  const objString = `<amp-state id="${state}" > ${value}  </amp-state>`;
  args['cheerio']('body').prepend(objString);

  return args;
};
