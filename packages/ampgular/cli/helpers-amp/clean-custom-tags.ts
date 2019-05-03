import { AmpDescription, MiniCheerioElement } from '../models/interface';
import { cleanAttributes, whiteListed } from './whitelistedtags';
import { readFileSync, writeFileSync } from 'fs';
import { join, normalize } from 'path';
const CleanAttributes = async (
  args: AmpDescription,
): Promise<AmpDescription> => {

    const $ = args.cheerio;

   const customClean:any = _readFile()

    const toClean =   cleanAttributes.concat(customClean.clean);

    toClean.forEach(attr => {

    $(attr.tag).attr(attr.attr, null);
   });


    return args;
};

const CleanCustomElements = async (
  args: AmpDescription,
): Promise<AmpDescription> => {

    const $ = args.cheerio;

    $('app-root').each((index, element: any) => {
        element.tagName = 'div';

      });


    const customTags: any[] = [];


    const elements = $('*');
    elements.each((index, element) => {

          if (whiteListed.indexOf(element.tagName.toLocaleLowerCase()) === -1) {

              if (customTags.indexOf(element.tagName) === -1) {
                  customTags.push(
                      element.tagName,
                  );
               }

          } else {
           }

      });




    if (customTags.indexOf('picture') !== -1) {
        args =   customFunctions['picture']('picture', args);
      }


    customTags.filter(x => x !== 'picture').forEach(tag => {
       if ((customFunctions as any)[tag] != undefined) {
        args =   (customFunctions as any)[tag](tag, args);
       } else {


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


        //  console.log(args['singleUniStyle'])

       // $(tag).addClass('_nc' + tag);
        const changeCustom = $(tag);
        changeCustom.each((index, element) => {
          let oldClass = element.attribs['class'] || '';
          let newClass = '_nc' + tag + " " + oldClass
          element.attribs['class'] = newClass
          if (element.tagName != 'app-root') {
            element.tagName = 'div';
          }
        });
       }


      });


    return args;
};


const customFunctions = {

  'picture': Picture,
  'img': Img,
};


function Img(tag: string, args: AmpDescription) {
  const $ = args['cheerio'];
  const imageGroup = $(tag);
  imageGroup.each((index, ele: CheerioElement) => {
  //    console.log(ele.attribs['src']);
      const attribs = {
          'src': ele.attribs['src'],
          'height': ele.attribs['height'],
          'width': ele.attribs['width'],
      };

      if (attribs['height'] == undefined && attribs['width'] == undefined ) {
        // attribs['height'] = '200';
        // attribs['width'] = '200';
        // attribs['layout'] = 'responsive';

      }


      if (ele.attribs['layout'] != undefined) {
          (attribs as any)['layout'] = ele.attribs['layout'];
      }
      if (ele.attribs['id'] != undefined) {
        (attribs as any)['id'] = ele.attribs['id'];
      }

      if (ele.attribs['class'] != undefined) {
        (attribs as any)['class'] = ele.attribs['class'];
      }

      if (ele.attribs['style'] != undefined) {
        (attribs as any)['style'] = ele.attribs['style'];
      }
      const imgElement = new MiniCheerioElement(
          'amp-img', attribs,
      );

      $(imgElement.toXString()).insertBefore($(ele));
      // ele.attribs = attribs;
      // ele.tagName = 'amp-img';


      //  'layout': ele.attribs['layout'],


  });


  // console.log(args['singleUniStyle']);
  const regExp = new RegExp( '}(img)|\s(img)', 'gi');

  // args['singleUniStyle'].replace(regExp,  (x,code) => {
  //   console.log( 'Y si')
  //   return "amp-img"
  // })

  const regExpImg = new RegExp( '(?<!\\.)\\b' + 'img' + '\\b', 'gm');


  args['singleUniStyle'] =  args['singleUniStyle'].replace(regExpImg,  (x, code) => {
      return   'amp-img';

  },
    );


  $('img').remove();

  return args;
}


function Picture(tag: string, args: AmpDescription) {
const $ = args['cheerio'];
const pictureGroup = $(tag);

pictureGroup.each((index, pictureElement: CheerioElement) => {

     const imgSrc = pictureElement.children.filter(x => x.tagName == 'img')[0].attribs['srcset'];
     const imgSclass = pictureElement.children.filter(x => x.tagName == 'img')[0].attribs['class'];


     pictureElement.children.filter(x => x.tagName == 'source').forEach(
        ele => {

            const imgElement = new MiniCheerioElement(
                'amp-img',
                {
                    'src': imgSrc,
                    'media': ele.attribs['media'],
                    'srcset': ele.attribs['srcset'],
                    'layout': 'responsive',
                    'height': ele.attribs['height'],
                    'width': ele.attribs['width'],
                    'class': imgSclass,
                },
            );


            $(imgElement.toXString()).insertBefore($(pictureElement));
        });
    // pictureElement.nodeValue = 'juajuajua';
     pictureElement.children = [];
     $('picture').remove();

},

);

return args;
}


export const cleanHtml = async (
  args: AmpDescription,
): Promise<AmpDescription> => {

  const $= args.cheerio



  const scriptTags = $('script');
    scriptTags.each(function(i:number, item:CheerioElement) {
     if (item.attribs['type'] !== undefined ) {
        if( item.attribs['type'].match(/application\/ld\+json/g)) {}
        else {  $(item).remove();}
      }
      else {
        $(item).remove();
      }



  });
  args =  await  CleanCustomElements (args);

  args =  await  CleanAttributes(args);



  return args;
};



const _readFile = (): Object => {

  let file = JSON.parse(
    readFileSync(join(normalize(process.cwd()), 'ampgular/amp/clean_attributes.json')).toString('utf-8'),
  );

  return  file
}
