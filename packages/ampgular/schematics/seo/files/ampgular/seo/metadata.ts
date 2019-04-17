/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable, Inject } from '@angular/core';
import { Title, Meta, ɵBrowserDomAdapter, MetaDefinition } from '@angular/platform-browser';

import {  ɵDomAdapter, ɵgetDOM } from '@angular/platform-browser';
import { isPlatformBrowser, isPlatformServer, DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';


 interface MetaExtendedDefinition extends MetaDefinition  {
 
} 





@Injectable()
export class MetaService extends Meta {
  // tslint:disable-next-line:variable-name
  public _dom: ɵDomAdapter = ɵgetDOM();
  lang: string;
  offers: {};
  reviews: {};
  myReview = {};
  myAggregateReview = {};
  // private _dom2: ɵBrowserDomAdapter = getDOM();
  localBusiness: any = {};
  organization: any = {};
  homeText: any = {};
  events: any = [];

  // event2:any =  {} ;
  // event3:any =  {} ;
  // tslint:disable-next-line:variable-name
  private _head: any;
  constructor(private _doc:any
  ) {
    super(_doc);
    this._head = this._doc.head;
    this._doc = this._dac;
  }

  /**
   * Sets the title of the page
   */
  public setTitle(title: string) {
  this.setTitle(title)
  }

  public setNoIndex() {
    // const ele = this._createMetaElement();
    // this._dom.setAttribute(ele, 'name', 'robots');
    // this._dom.setAttribute(ele, 'content', 'noindex');
    // this._dom.appendChild(this._head, ele);
    let tag:MetaExtendedDefinition = {
      name:"robots" , content:"noindex"
    }
    this.addTag(tag)


  }

  public insertJsonLd(jsonLd: {}) {
    const jsonScriptLink = this._createScriptElement();
    this._dom.setAttribute(jsonScriptLink, 'type', 'application/ld+json');
    this._dom.setInnerHTML(jsonScriptLink, JSON.stringify(jsonLd));

    this._dom.appendChild(this._head, jsonScriptLink);
  }

  public setMustMetadata() {


  }


  

  linkCano(metaUpdate: any) {





      // const html = this._document;
      const html = this._dom.childNodesAsList(this._doc)[1];
      this._dom.setAttribute(html, 'lang', this.lang);

      const childNodesAsList: Node[] = this._dom.childNodesAsList(this._head);

      // childNodesAsList.forEach((x =>  {
      //   let p = x as HTMLElement;
      //   console.log(p);
      // });

     // const insertIni = childNodesAsList.find(x => x.localName === 'script');

      // const Name2 = childNodesAsList.find(el=> el.attributes.item.name=='keywords');


  }

  createandInsert(
    name: string,
    nameContent: string,
    content: string,
    contentValue: string,
    parent: Node,
    after: Node
  ) {
    const ele = this._createMetaElement();
    this._dom.setAttribute(ele, name, nameContent);
    this._dom.setAttribute(ele, content, contentValue);
    this._dom.insertBefore(parent, after, ele);
  }

  createandInsertScheme(
    name: string,
    nameContent: string,
    content: string,
    contentValue: string,
    scheme: string,
    schemcontent: string,
    parent: Node,
    after: Node
  ) {
    const ele = this._createMetaElement();
    this._dom.setAttribute(ele, name, nameContent);
    this._dom.setAttribute(ele, content, contentValue);
    this._dom.insertBefore(parent, after, ele);
  }



  private _createMetaElement(): HTMLMetaElement {
    return this._dom.createElement('meta') as HTMLMetaElement;
  }

  private _createLinkElement(): HTMLLinkElement {
    return this._dom.createElement('link') as HTMLLinkElement;
  }

  private _createScriptElement(): HTMLScriptElement {
    return this._dom.createElement('script') as HTMLScriptElement;
  }

  // private _prepareMetaElement(tag: MetaDefinition, el: HTMLMetaElement): HTMLMetaElement {
  //   Object.keys(tag).forEach((prop: string) => this._dom.setAttribute(el, prop, tag[prop]));
  //   return el;
  // }

  private _appendMetaElement(meta: HTMLMetaElement): void {
    const head = this._doc.head;
    this._dom.appendChild(head, meta);
  }
  private _appendLinkElement(meta: HTMLLinkElement): void {
    const head = this._doc.head;
    this._dom.appendChild(head, meta);
  }
}
