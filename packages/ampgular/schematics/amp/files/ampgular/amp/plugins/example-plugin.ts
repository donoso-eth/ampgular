

export  default async function (args: AmpDescription): Promise<AmpDescription> {

  const $ = args.cheerio;

  let classLook = "[id='name']";
  let link1$ = $(classLook);
  link1$.attr('on', 'change:AMP.setState({name:event.value})');
  classLook = "[id='fieldName']";
  link1$ = $(classLook);
  let myClass = link1$.attr('class');
  link1$.attr('[class]', `name!=''? '${myClass} mat-form-field-should-float': '${myClass}' `);


  classLook = "[id='email']";
  link1$ = $(classLook);
  link1$.attr('on', 'change:AMP.setState({email:event.value})');
  classLook = "[id='fieldEmail']";
  link1$ = $(classLook);
  myClass = link1$.attr('class');
  link1$.attr('[class]', `email!=''? '${myClass} mat-form-field-should-float': '${myClass}' `);


  classLook = "[id='phone']";
  link1$ = $(classLook);
  link1$.attr('on', 'change:AMP.setState({phone:event.value})');
  classLook = "[id='fieldPhone']";
  link1$ = $(classLook);
  myClass = link1$.attr('class');
  link1$.attr('[class]', `phone!=''? '${myClass} mat-form-field-should-float': '${myClass}' `);


  classLook = "[id='comment']";
  link1$ = $(classLook);
  link1$.attr('on', 'change:AMP.setState({comment:event.value})');
  link1$.attr('rows', '5');
  classLook = "[id='fieldComment']";
  link1$ = $(classLook);
  myClass = link1$.attr('class');
  link1$.attr('[class]', `comment!=''? '${myClass} mat-form-field-should-float': '${myClass}' `);


  link1$.each(function(i, item) {

 // console.log(item.attribs, i)

 const myParent = item.parent.attribs['class'];
 // console.log(myParent)
});
  args['singleUniStyle'] = args['singleUniStyle'].replace(/\.mat-focused/gm, ':focus-within');


  return args;
}
