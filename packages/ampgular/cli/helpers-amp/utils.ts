import { AmpDescription, LogObject } from '../models/interface';


export function logger(logObject: LogObject) {
  console.log(logObject.type + ' ' + logObject.message);
}

export const recreateEvent = async (
  args: AmpDescription,
  id: string,
  event: string,
  method: String,
): Promise<AmpDescription> => {
  const $ = args['cheerio'];
  const classId = $(id);
  classId.each((index, idEle) => {
    const attrOn = idEle['attribs']['on'];

    if (attrOn == undefined) {
      if (idEle.tagName != 'button') {
        idEle['attribs']['role'] = 'button';
        idEle['attribs']['tabindex'];
        classId.attr('tabindex', '');
      }

      idEle['attribs']['on'] = `${event}:${method}`;
    } else {
      const i = 0;
      let attribSplit = [];

      const found = false;

      if (attrOn.split(';').some(x => x.split(':')[0] == event)) {
        attribSplit = attrOn.split(';').map(local => {
          if (local.split(':')[0] == event) {
            local = local + ',' + method;

            return local;
          } else {
            return local;
          }
        });
      } else {
        attribSplit.push(attrOn.split(';'));
        attribSplit.push(`${event}:${method}`);
      }
      idEle['attribs']['on'] = attribSplit.join(';');
    }
  });

  return args;
};
