/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// tslint:disable
import { Injectable, Inject } from '@angular/core';
import { MetaDefinition, Meta, Title } from '@angular/platform-browser';

import { ɵDomAdapter, ɵgetDOM } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';


interface MetaExtendedDefinition extends MetaDefinition {

}

export interface MustMetaData {
  title: string;
  description: string;
  canonical: string;

}



@Injectable()
export class MetaService {

  public _dom: ɵDomAdapter = ɵgetDOM();
  private jsonLd = {};
  private _head: any;
  private host = "www.yourhost.com"
  constructor(
    @Inject(DOCUMENT) private _doc: any,
    private _title: Title,

  ) {

    this._head = this._doc.head;

  }

  /**
   * Sets the title of the page
   */
  public setTitle(title: string) {
    this._title.setTitle(title);
  }

  public setNoIndex() {
    let tag: MetaExtendedDefinition = {
      name: "robots", content: "noindex"
    }

    this.createandInsert(tag.name,tag.content)

  }

  public pushJsonld(pushJonLd: {}) {
    this.jsonLd = { ...this.jsonLd, ...pushJonLd }
  }

  public insertJsonLd(insertJsonLd: {}) {
    this.jsonLd = { ...this.jsonLd, ...insertJsonLd }
    const jsonScriptLink = this._createScriptElement();
    this._dom.setAttribute(jsonScriptLink, 'type', 'application/ld+json');
    this._dom.setInnerHTML(jsonScriptLink, JSON.stringify(this.jsonLd));
    this._dom.appendChild(this._head, jsonScriptLink);
  }


  public setMustMetadata(metaData: MustMetaData) {
    this._title.setTitle(metaData.title);

    let tag: MetaExtendedDefinition = {
      name: "description", content: metaData.description
    }


    this.createandInsert(tag.name,tag.content)

    const canonicalLink = this._createLinkElement();
    this._dom.setAttribute(canonicalLink, "rel", "canonical");
    this._dom.setAttribute(canonicalLink, "href", this.host + metaData.canonical)
    this._dom.appendChild(this._head, canonicalLink);


  }



  createandInsert(
    name: string,
    nameContent: string,


  ) {
    const ele = this._createMetaElement();
    this._dom.setAttribute(ele, name, nameContent);
   this._dom.appendChild(this._head, ele);
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
