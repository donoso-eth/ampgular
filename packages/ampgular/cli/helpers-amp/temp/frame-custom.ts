import { miniCheerioElement, logObject, errorType, AmpArgs } from './helper/model';
import { logger } from './helper/utils'
import { ampState } from './state'
import { ampConfig } from './settings/amp-routes';
import { installServiceWorker } from './5-beJustAMP/sw';

export const customFunctions = {

    'picture': Picture,
    'img': Img
}


// export const ampScripts = {

//     'bind':
//     'form': Form,
//     'img': Img
// }


export const embedScripts = async (args:AmpArgs):Promise<any> =>{


 let $= args['cheerio'];




 const JSONLD = $('[type=\'application/ld+json\']');


 $('link').remove('[rel=\'stylesheet\']');
 $('script').remove();
// <script async custom-element="amp-form" src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>

 $('head').children('[charset="utf-8"]').after('<script async src="https://cdn.ampproject.org/v0.js"></script>');

$('head').children('[src="https://cdn.ampproject.org/v0.js"]').after('<script async custom-template="amp-mustache" src="https://cdn.ampproject.org/v0/amp-mustache-0.2.js"></script>');
$('head').children('[src="https://cdn.ampproject.org/v0.js"]').after('<script async custom-element="amp-list" src="https://cdn.ampproject.org/v0/amp-list-0.1.js"></script>')
 $('head').children('[src="https://cdn.ampproject.org/v0.js"]').after('<script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>');
 $('head').children('[src="https://cdn.ampproject.org/v0.js"]').after('<script async custom-element="amp-form" src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>');
 $('head').children('[src="https://cdn.ampproject.org/v0.js"]').after('<script async custom-element="amp-bind" src="https://cdn.ampproject.org/v0/amp-bind-0.1.js"></script>')
 //  $('head').children('[src="https://cdn.ampproject.org/v0.js"]').after('<script async custom-element="amp-position-observer" src="https://cdn.ampproject.org/v0/amp-position-observer-0.1.js"></script>');

args['customScript'].forEach(script=>{
    $('head').children('[src="https://cdn.ampproject.org/v0.js"]').after('<script async custom-element="' + script + '" src="https://cdn.ampproject.org/v0/' + script + '-0.1.js"></script>');

});

$('head').children().remove('style');

$('head').append('<style amp-custom>' + args['singleUniStyle'] + '</style>')

$('head').append('<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>');

$('head').children('[rel="manifest"]').after('<meta name="amp-google-client-id-api" content="googleanalytics">')

const anaScript =  JSON.stringify({ "vars" : {
  "gtag_id": "UA-115673518-1",
  "config" : {
    "UA-115673518-1": { "groups": "default" }
  }
},
"triggers": {
  "trackPageView":{
    "on":"visible",
    "request":"pageview"
  }
},
"linkers": {
  "enabled": true
}
})
const analitics = `<amp-analytics type="gtag" data-credentials="include">
<script type="application/json">
 ${anaScript}
</script>
</amp-analytics>`

 $('body').prepend(analitics);

if(ampConfig['serviceWorker']){
  $('head').children('[src="https://cdn.ampproject.org/v0.js"]').after('<script async custom-element="amp-install-serviceworker" src="https://cdn.ampproject.org/v0/amp-install-serviceworker-0.1.js"></script>')

  args = await installServiceWorker(args)
}



$('head').append(JSONLD);


let alterGroup = $("[rel=\'alternate\']");

alterGroup.each((index, ele: CheerioElement) => {
  ele.attribs['href'] = ele.attribs['href'] + '/amp'
})


return args

}


function Img(tag:string, args:AmpArgs) {
    let $ = args['cheerio']
    let imageGroup = $(tag);
    imageGroup.each((index, ele: CheerioElement) => {
    //    console.log(ele.attribs['src']);
        let attribs = {
            'src': ele.attribs['src'],
            'height': ele.attribs['height'],
            'width': ele.attribs['width'],
        }

        if (attribs['height']==undefined && attribs['width']==undefined )
        {
          // attribs['height'] = '200';
          // attribs['width'] = '200';
          // attribs['layout'] = 'responsive';

        }


        if (ele.attribs['layout'] != undefined) {
            attribs['layout'] = ele.attribs['layout'];
        }
        if (ele.attribs['id'] != undefined) {
            attribs['id'] = ele.attribs['id'];
        }

        if (ele.attribs['class'] != undefined) {
            attribs['class'] = ele.attribs['class'];
        }

        if (ele.attribs['style'] != undefined) {
            attribs['style'] = ele.attribs['style'];
        }
        let imgElement = new miniCheerioElement(
            'amp-img', attribs
        );

        $(imgElement.toXString()).insertBefore($(ele));
        //ele.attribs = attribs;
        //ele.tagName = 'amp-img';



        //  'layout': ele.attribs['layout'],


    })


    //console.log(args['singleUniStyle']);
    var regExp = new RegExp( '}(img)|\s(img)', 'gi');

    // args['singleUniStyle'].replace(regExp,  (x,code) => {
    //   console.log( 'Y si')
    //   return "amp-img"
    // })

    const regExpImg = new RegExp( '(?<!\\.)\\b' + 'img' + '\\b', 'gm')


    args['singleUniStyle'] =  args['singleUniStyle'].replace(regExpImg,  (x,code) =>
       {
        return   "amp-img"

    }
      );


    $('img').remove();
    return args;
}



function Form(tag:string, args:AmpArgs) {
    let $ = args['cheerio']
    let formGroup = $(tag);
    if (args['customScript'].indexOf('amp-form')==-1){
        args['customScript'].push('amp-form');
      }
    formGroup.each((index, formElement) => {

        if (formElement.attribs['id'] == undefined) {
            logger({ "type": errorType.E1000, "message": 'Form wo id ' });
        }
        else {

            ampState['form'] == undefined ? logger({ "type": errorType.E1001, "message": 'State not reflecting Form-ID' }) : {


            };


            if (ampState['form'][formElement.attribs['id']] == undefined) {
                logger({ "type": errorType.E1001, "message": 'State not reflecting Form-ID' });

            }
            else {
                logger({ "type": errorType.E1001, "message": 'State YES' });

                if (ampState['form'][formElement.attribs['id']]['hidden-input'] != undefined) {

                    ampState['form'][formElement.attribs['id']]['hidden-input']
                        .forEach(x => {
                            let attribs = {}
                            attribs['id'] = x.id;
                            attribs['value'] = x.value;
                            attribs['hidden'] = ''
                            let inputElement = new miniCheerioElement(
                                'input', attribs
                            );

                          $(formElement).prepend(inputElement.toXString())
                        }
                    )
                }
                let attribsForm = Object.assign( {},formElement.attribs,ampState['form'][formElement.attribs['id']]['attribs']);
               formElement.attribs= attribsForm;
            }
        };




    })
    //     $or('[' + x.name + ']').each((index, element) => {

    //     })
    //     $('[' + x.name + ']').removeAttr(x.name);
    // }
    // )
    return args;

}



function Picture(tag:string, args:AmpArgs) {
    let $ = args['cheerio']
    let pictureGroup = $(tag);

    pictureGroup.each((index, pictureElement: CheerioElement) => {

         let imgSrc = pictureElement.children.filter(x => x.tagName == 'img')[0].attribs['srcset'];
         let imgSclass = pictureElement.children.filter(x => x.tagName == 'img')[0].attribs['class'];


        pictureElement.children.filter(x => x.tagName == 'source').forEach(
            ele => {

                let imgElement = new miniCheerioElement(
                    'amp-img',
                    {
                        'src': imgSrc,
                        'media': ele.attribs['media'],
                        'srcset': ele.attribs['srcset'],
                        'layout': 'responsive',
                        'height': ele.attribs['height'],
                        'width': ele.attribs['width'],
                        'class': imgSclass
                    }
                );



                $(imgElement.toXString()).insertBefore($(pictureElement));
            });
        // pictureElement.nodeValue = 'juajuajua';
        pictureElement.children = [];
        $('picture').remove();

    }

    )

    return args;
}
