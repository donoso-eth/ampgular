

export  default async function (args:AmpDescription): Promise<AmpDescription> {

  const $ = args.cheerio;
  const alterGroup = $("[rel=\'alternate\']");

  alterGroup.each((index, ele: CheerioElement) => {
    ele.attribs['href'] = ele.attribs['href'] + '/amp';
  });


  return args;
}
