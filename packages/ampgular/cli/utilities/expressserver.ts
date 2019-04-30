import  { Express }from 'express';
const bodyParser = require('body-parser');
import express = require('express');
import { Server } from 'http';
import { Path, logging } from '@angular-devkit/core';
import { join, normalize } from 'path';
import { textChangeRangeIsUnchanged } from 'typescript';
const open = require('open');

export interface ExpressConfig {
  assetsPath:string;
  launchPath:string;
  message:string;
  url:string;
  port:number
}

export class ExpressServer {
  private app:  Express;
  public server: Server;

  constructor(public config: ExpressConfig, public logger:logging.Logger) {
    this.app = express();

  }

  async CloseServer() {
  this.server!==undefined? this.server.close():'';
  }

  async openServer(){
    await this.LaunchServer();


  }
  async LaunchServerSPA(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const PORT = this.config.port
        const DIST_FOLDER = join(normalize(process.cwd()), 'dist/browser');



        const ASSETS_FOLDER = join(normalize(process.cwd()), this.config.assetsPath);

        this.app.get('*.*', express.static(join(DIST_FOLDER)));
        this.app.get('*', function(req, res) {
          res.sendFile(join(DIST_FOLDER, 'index.html')); // load the single view file (angular will handle the page changes on the front-end)
        });



        this.server = this.app.listen(PORT, async () => {
          this.logger.info(this.config.message)

          resolve(this.app);
        });
      } catch (err) {
       reject(false);
      }
    });
  }

  async LaunchServer(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const PORT = this.config.port
        const DIST_FOLDER = join(normalize(process.cwd()), this.config.launchPath);
        const ASSETS_FOLDER = join(normalize(process.cwd()), this.config.assetsPath);

        this.app.use('/assets', express.static(ASSETS_FOLDER))

       // this.app.use('/css/styles.css', express.static(CSS_FOLDER))

        this.app.get('*.*', express.static(join(DIST_FOLDER)));


        this.app.get('*',  (req: any, res: any) => {


          res.sendFile(join(DIST_FOLDER, req.url, 'index.html')); // load the single view file (angular will handle the page changes on the front-end)
        });


        this.server = this.app.listen(PORT, async () => {
          this.logger.info(this.config.message)

          if (this.config.url!=='no')

          await open(this.config.url);
          {
            resolve(true);
          }


        });
      } catch (err) {
       reject(false);
      }
    });
  }
}





const portInUse = function(port: number, callback: any) {
  const net = require('net');
  const server = net.createServer(function(socket: any) {
	socket.write('Echo server\r\n');
	socket.pipe(socket);
    });

  server.listen(port, '127.0.0.1');
  server.on('error', function (e: any) {
	callback(true);
    });
  server.on('listening', function (e: any) {
	server.close();
	callback(false);
    });
};


export async function Launchserver(): Promise<any> {
  return new Promise((resolve, reject) => {
    //const myapp = express.Application;

    try {
      const app = express();

      portInUse(5858, function(returnValue: any) {
        console.log(returnValue);
    });

      const PORT = process.env.PORT || 4200;

      const DIST_FOLDER = join(normalize(process.cwd()), 'dist/browser');

      app.get('*.*', express.static(join(DIST_FOLDER)));
      app.get('*', function(req, res) {
        res.sendFile(join(DIST_FOLDER, 'index.html')); // load the single view file (angular will handle the page changes on the front-end)
      });

      app.listen(4200, async () => {
        resolve(app);
      });
    } catch (err) {
      console.log('error-server');
    }
  });
}


