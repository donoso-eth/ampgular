/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {  join, json, normalize } from '@angular-devkit/core';
import { readFileSync, writeFileSync } from 'fs';
import { BaseCommandOptions, Command } from '../models/command';
import { Arguments } from '../models/interface';
import { Schema as SitemapOptions } from '../schemas/sitemap';
import { Version } from '../upgrade/version';
import { Schema as SitemapCommandSchema } from './sitemap';

import minimatch = require('minimatch');

import { AmpgularCommand } from '../models/ampgular-command';

export class SitemapCommand extends AmpgularCommand<SitemapCommandSchema> {
  public readonly command = 'sitemap';

  public commandConfigOptions: SitemapOptions;

  public async initialize(
    options: SitemapCommandSchema & Arguments,
  ): Promise<void> {
    await super.initialize(options);

    this.commandConfigOptions = { ...this._ampgularConfig
    .sitemap,                     ...this.overrides} as SitemapOptions;





  }

  public async run(options: SitemapCommandSchema & Arguments): Promise<0|1> {
    await super.run(options);

    return  this.createSitemap();


  }

  createSitemap(): 0|1 {
    try {
    const basedir = normalize(process.cwd());
    const ROUTES: string[] = require(basedir + '/ampgular/routes').ROUTES;

    const routesObj: Array<Object> = [];
    ROUTES.forEach(route => {
      const obj = {
        url: route,
        priority: this.commandConfigOptions.defaultPriority,
        frecuency: this.commandConfigOptions.defaultFrecuency,
      };
      routesObj.push(obj);
    });
  //   if (this.commandConfigOptions.custom != undefined) {
  //   this.commandConfigOptions.custom.forEach((pattern: any) => {
  //     routesObj.filter((route: any) => pattern.urls.some((patternAr: string) => minimatch(route.url, patternAr, {})) == true).map((route: any) => {
  //       route.priority = pattern.priority;
  //       route.frecuency = pattern.frecuency;
  //     });
  //   });
  // }


    const xmlintro = `<?xml version="1.0" encoding="UTF-8"?>
 <urlset
       xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
             http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;
    const xmlend = `
</urlset>`;

    const ASSETS_FOLDER = join(normalize(process.cwd()), 'dist/public/assets');
    const website = 'https://madrid-day-spa.com';


    let xmlUrl = ``;
    const now = new Date();
    const month =
      (now.getUTCMonth() + 1).toString().length == 2
        ? (now.getUTCMonth() + 1).toString()
        : '0' + (now.getUTCMonth() + 1).toString();
    const dayNr =
      now.getUTCDate().toString().length == 2
        ? now.getUTCDate().toString()
        : '0' + now.getUTCDate().toString();
    const today =
      now.getUTCFullYear().toString() + '-' + month + '-' + dayNr;

    routesObj.forEach((route: any) => {
      xmlUrl =
        xmlUrl +
        `\n     <url> \n        <loc>` +
        website +
        route.url +
        `</loc> \n        <lastmod>` +
        today +
        `</lastmod> \n        <changefreq>` +
        route.frecuency +
        `</changefreq>\n        <priority>` +
        route.priority +
        `</priority>\n      </url> `;
    });

    xmlUrl = xmlintro + xmlUrl + xmlend;

    writeFileSync(join(basedir, 'dist/public', 'sitemap.xml'), xmlUrl);

    return 0;
  } catch (e) {
    return 1;
  }
}


}
