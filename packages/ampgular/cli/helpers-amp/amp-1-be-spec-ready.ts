import { parse } from 'postcss';
import { AmpDescription } from '../models/interface';
import { cleanHtml } from './clean-custom-tags';
import { OptimizeCSS } from './optimize-css';
import { load } from 'cheerio';

const addAngTags = [{ selector: 'app-root' }, { selector: 'router-outlet' }];

const CssAllTogether = async (
  args: AmpDescription,
): Promise<AmpDescription> => {
  const $ = args.cheerio;

  /* PREPPEND GLOBAL STYLES*/
  let singleUniStyle = args.singleUniStyle;

  /* ADD COMPONENT STYLES*/
  const styleTags = $('style');
  let styleNr = 0;
  styleTags.each(function(i, item) {
    singleUniStyle = item.firstChild.data + ' ' + singleUniStyle;
    styleNr = styleNr + 1;
  });

  // const angCompo = args['angCompo'];
  singleUniStyle = singleUniStyle.replace(/!important/gm, '');
  args.singleUniStyle = singleUniStyle;

  args = AngularComponentCheck(args);

  const uniStyle = parse(args.singleUniStyle);

  const inlineStyle = $('[style]');

  inlineStyle.each(function(i, inline: CheerioElement) {
    if (inline.attribs['id'] == undefined) {
      inlineStyle.filter(inline).attr('id', '_ni' + i);
      inlineStyle.filter(inline).addClass('_ni' + i);
      uniStyle.append(
        '#' + '_ni' + i + '._ni' + i + '{' + inline.attribs['style'] + '}',
      );
    } else {
      inlineStyle.filter(inline).addClass('_ni' + i);
      uniStyle.append(
        '#' +
          inline.attribs['id'] +
          i +
          '._ni' +
          i +
          '{' +
          inline.attribs['style'] +
          '}',
      );
    }

    inlineStyle.filter(inline).removeAttr('style');
  });

  $('head')
    .children()
    .remove('style');
  $('link').remove("[rel='stylesheet']");

  args.singleUniStyle = uniStyle.toString();

  return args;
};


const AngularComponentCheck = (args: AmpDescription): AmpDescription => {
  const $ = args['cheerio'];
  const indexHtml = $.html();
  const hostRegex = /(_nghost)-sc([0-9]+)/g;
  const matchHost: string[] = [];
  let angCompo: any[] = [];
  let check1 =indexHtml.replace(hostRegex, function (match, code, id) {

    if (matchHost.indexOf(id) == -1) {
        matchHost.push(
            id
        );
     let aqui = $ ('[_nghost-sc' + id + ']')[0]
     angCompo.push(
         {'selector':aqui.tagName,
        'id':id });
    }

    return "";
});
    const matchCompo:any = [];
    const compoRegex = /(_ngcontent)-sc([0-9]+)/g;


let check2 = indexHtml.replace(compoRegex, function (match, code, id) {

    if (matchCompo.indexOf(id) == -1) {
        matchCompo.push(
            id
        );

    }

    return "";
});




  angCompo = angCompo.concat(addAngTags);
 
  angCompo.forEach(index => {
    const regExp = new RegExp('\\[_nghost-sc' + index.id + '\\]', 'gi');
    args['singleUniStyle'] = args['singleUniStyle'].replace(
      regExp,
      '._nh' + index.id,
    );

    const sel = '_nghost-sc' + index.id;

    $('[' + sel + ']').addClass('_nh' + index.id);
    $('[' + sel + ']').attr(sel, null);
  });

  angCompo
    .filter(x => x.id != undefined)
    .map(x => x.id)
    .forEach(index => {
      const regExp = new RegExp('\\[_ngcontent-sc' + index + '\\]', 'gi');

      args['singleUniStyle'] = args['singleUniStyle'].replace(
        regExp,
        '._nc' + index,
      );

      const sel = '_ngcontent-sc' + index;

      $('[' + sel + ']').addClass('_nc' + index);
      $('[' + sel + ']').attr(sel, null);
    });

  angCompo
    .map(x => x.selector)
    .forEach(tag => {
      // [^.|<#]caca|^caca
      const regExp = new RegExp('[^.|#](' + tag + ')|^(' + tag + ')', 'gi');

      args['singleUniStyle'] = args['singleUniStyle'].replace(
        regExp,
        (x, code) => {
          if (x.length == code.length) {
            //  console.log('dentro-length!=code and match',x)
            return '._nc' + code;
          } else {
            return x.substr(0, 1) + '._nc' + code;
          }
        },
      );

      $(tag).addClass('_nc' + tag);
      const changeCustom = $(tag);
      changeCustom.each((index, element) => {
        if (element.tagName != 'app-root') {
          element.tagName = 'div';
        }
      });
    });

    const adaptedCheerio = load(indexHtml)

  args['angCompo'] = angCompo;
  args['cheerio'] = $ //adaptedCheerio;

  return args;
};


export const BeReadySpec = async (
  args: AmpDescription,
): Promise<AmpDescription> => {
  args = await CssAllTogether(args);

  if ((args.options as any).cssOptimize) {
    args = await OptimizeCSS(args);
  }

  args = await cleanHtml(args);


  return args;
};
