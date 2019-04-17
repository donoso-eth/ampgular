export class MiniCheerioElement {
    protected tagname: string;
    protected attribs: object;
    toXString(): string
    {
        return '<' + this.tagname + Object.keys(this.attribs).reduce((prev, x) =>
        prev = prev + ' ' + x + '=\''  +  this.attribs[x] + '\' ' , ' ') + '>';

    }
    constructor(tagname: string, attribs: any) {
        this.tagname = tagname;
        this.attribs = attribs;
    }


}
export interface AmpArgs {

    cheerio: CheerioStatic;
    singleUniStyle: string;
    indexHtml: string;
    angCompo: string[];
    customScript: string[];
    route?: string;
    state?: { };
}
