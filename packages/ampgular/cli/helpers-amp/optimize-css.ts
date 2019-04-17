const CssShortener = require('css-shortener');
const str = require('string-to-stream');
const cs = new CssShortener();
const CleanCSS = require('clean-css');
import { load } from 'cheerio';
import * as purify from 'purify-css';
import { AmpDescription } from '../models/interface';

const shortcss = async (args: AmpDescription): Promise<any> => {
  return new Promise((resolve, reject) => {
    const newArgs: AmpDescription = args;
    str(newArgs.singleUniStyle)
      .pipe(cs.cssStream())
      .on('finish', () => {
        const newA = cs.replaceCss(args['singleUniStyle']);
        newArgs['singleUniStyle'] = newA;
        const oldHtml = newArgs['cheerio'].html();
        const newHtml = cs.replaceHtml(oldHtml);
        const new$$ = load(newHtml);
        newArgs['cheerio'] = new$$;
        resolve(newArgs);
      });
  });
};

export const OptimizeCSS = async (
  args: AmpDescription,
): Promise<AmpDescription> => {
  const whiteListed: any[] = [];
  Object.keys(args.pageState as any).forEach(key => {
    (args.pageState as any)['events'].forEach((event: any) => {
      if (event['id'].substr(0, 1) == '.') {
        whiteListed.push(event['id'].substr(1, event['id'].length - 1));
      }
    });
    if ((args.pageState as any)[key]['css'] != undefined) {
      if ((args.pageState as any)[key]['type'] == 'multi-bind') {
        Object.keys((args.pageState as any)[key]['css']).forEach(myCssArray => {
          const mycss = (args.pageState as any)[key]['css'][myCssArray];
          mycss.forEach((css: any) => {
            if (Array.isArray(css['class'])) {
              css['class'].forEach((x: string) => whiteListed.push(x));
            } else {
              whiteListed.push(css['class']);
            }
            if (css['id'].substr(0, 1) == '.') {
              whiteListed.push(css['id'].substr(1, css['id'].length - 1));
            }
          });
        });
      } else {
        (args.pageState as any)[key]['css'].forEach((css: any) => {
          if (Array.isArray(css['class'])) {
            css['class'].forEach((x: string) => whiteListed.push(x));
          } else {
            whiteListed.push(css['class']);
          }
          if (css['id'].substr(0, 1) == '.') {
            whiteListed.push(css['id'].substr(1, css['id'].length - 1));
          }
        });
      }
    }
  });

  const whiteUniq = whiteListed
    .filter(x => x != '')
    .reduce(function(a, b) {
      if (a.indexOf(b) < 0) { a.push(b); }

      return a;
    }, []);

  whiteUniq.forEach((clas: string) => {
    const regExpImg = new RegExp('(?<=\\.)\\b' + clas + '\\b', 'gm');

    args['singleUniStyle'] = args['singleUniStyle'].replace(
      regExpImg,
      (x, code) => {
        return 'ignore-' + clas;
      },
    );
  });

  const whiteListPurify = whiteUniq.map((x: string) => '.ignore-' + x);

  const newcss = purify(args.cheerio.html(), args.singleUniStyle, {
    // Will minify CSS code in addition to purify.
    minify: true,
    whitelist: whiteListPurify,
    // Logs out removed selectors.
    // rejected: true
  });

  args['singleUniStyle'] = newcss;

  const staticCss = args['singleUniStyle'];
  const output = new CleanCSS({
    level: {
      2: {
        all: true, // sets all values to `false`
      },
    },
  }).minify(staticCss);

  args['singleUniStyle'] = output.styles;

  const options = {
    ignorePrefix: '.ignore-',
  };

  args = await shortcss(args);

  return args;
};
