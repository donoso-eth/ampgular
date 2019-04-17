import * as express from 'express';
const bodyParser = require('body-parser');
import { join } from 'path';

export class ExpressServer {
  app: any;

  constructor() {
    this.app = express();
  }

  async CloseServer() {
    this.app.close();
  }

  async LaunchServer(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {


        const PORT = process.env.PORT || 4200;

        const DIST_FOLDER = join(process.cwd(), 'dist/browser');

        this.app.get('*.*', express.static(join(DIST_FOLDER)));
        this.app.get('*',  (req: any, res: any) => {
          res.sendFile(join(DIST_FOLDER, 'index.html')); // load the single view file (angular will handle the page changes on the front-end)
        });

        this.app.listen(4200, async () => {
          resolve(this.app);
        });
      } catch (err) {
        console.log('error-server');
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
    const net = require('net');

    try {
      const app = express();

      portInUse(5858, function(returnValue: any) {
        console.log(returnValue);
    });

      const PORT = process.env.PORT || 4200;

      const DIST_FOLDER = join(process.cwd(), 'dist/browser');

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

// export async function LaunchStaticServer(){
//   const app = express();

//   const PORT = process.env.PORT || 5000;

//   let ssrConfig: SSRCliOptions = {
//     cliOptions: {
//       command:""
//     },
//     appOptions:{},
//     configOptions:readConfig(),
//   };
//   const DIST_FOLDER = join(process.cwd(), ssrConfig.configOptions.paths.DIST_FOLDER);
//   const PUBLIC_FOLDER = DIST_FOLDER + '-public';

//   app.get("*.*", express.static(join(PUBLIC_FOLDER)));

//   app.get('*', function(req, res) {
//     console.log(req)
//     res.sendFile(join(PUBLIC_FOLDER + '/' + req.url + "/index.html"));
// });
//   // and the rest routes will be redirected to "/"

//   app.listen(5000, async () => {
//      console.log('\n Serving App http://localhost:5000 \n')
//     });

//   // app.get("*", function(req, res) {
//   //   res.sendFile(join(DIST_FOLDER, "index.html")); // load the single view file (angular will handle the page changes on the front-end)
//   // });

// }
