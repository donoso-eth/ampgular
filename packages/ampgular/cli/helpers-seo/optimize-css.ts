import { load } from 'cheerio';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, join, resolve } from 'path';
import { atRule, decl, parse, root, rule, stringify } from 'postcss';
import * as purify from 'purify-css';


const PUBLIC_FOLDER = join(process.cwd(), 'dist/public');
// const indexHtml = readFileSync(join(PUBLIC_FOLDER, 'index.html')).toString();
const globalCss = ''; // readFileSync(join(PUBLIC_FOLDER, "styles.css")).toString();

export async function optimizeStatic(html: string): Promise<string> {
  /* Read HTML in CHEERIO*/
  const $ = load(html);

  /* PREPPEND GLOBAL STYLES*/
  let singleUniStyle = globalCss;

   /* ADD COMPONENT STYLES*/
  const styleTags = $('style');
  let styleNr = 0;
  styleTags.each(function(i, item) {
    singleUniStyle = item.firstChild.data + ' ' + singleUniStyle;
    styleNr = styleNr + 1;
  });

  const  uniStyle = parse(singleUniStyle);


  const inlineStyle = $('[style]');

  inlineStyle.each(function (i, inline: CheerioElement) {

      inlineStyle.filter(inline).attr('id', '_ng-i' + i);
      inlineStyle.filter(inline).addClass('_ng-i' + i);

      uniStyle.append( '#' + '_ng-i' + i  + '._ng-i' + i + '{' + inline.attribs['style'] + '}' )
          ;
      inlineStyle.filter(inline).removeAttr('style');
  });

  $('head').children().remove('style');
  $('link').remove('[rel=\'stylesheet\']');
  const htmlChe = $('body').html();
  const css = uniStyle.toString();

  // console.log(css);


  const newcss = purify(htmlChe, css,
        {
            // Will minify CSS code in addition to purify.
            minify: true,

            // Logs out removed selectors.
            // rejected: true
        });


  $('head').append('<style  ng-transition="serverApp">' + newcss + '</style>');
  $('body').append('<link rel="stylesheet" href="styles.css">');


  return $.html();
}
