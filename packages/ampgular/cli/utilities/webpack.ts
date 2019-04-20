
import * as webpack from 'webpack';
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const nodeExternals = require('webpack-node-externals');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
import { logging, join, normalize, path } from '@angular-devkit/core';
import chalk from 'chalk';

export async function webpackRun(command: string, logger: logging.Logger) {

 return new Promise((resolve, reject) => {


  const AMPGULAR_FOLDER = join(normalize(process.cwd()), 'ampgular/seo');

  const webpackConfig: any = Object.assign({}, webpackConfigTemplate, {
    entry: { command: './ampgular/seo/' + command + '.ts' },
    output: {
      path: AMPGULAR_FOLDER,
      filename: command + '_webpack.js',
      library: command + 'Webpack',
      libraryTarget: 'umd',
      umdNamedDefine: true,
    },
  });

  const webpackCompiler = webpack(webpackConfig);
  const statsConfig = getWebpackStatsConfig(false);
  let i = 0;
  const callback: webpack.compiler.CompilerCallback = (err, stats) => {
    i = i + 1;
    if (err) {
      reject(err);
      console.error(err);
    }
    console.log('webpack run XXXXXXXXXX');
    resolve(true);


  };
  webpackCompiler.run(callback);
});
}



export async function webpackcss(entryPoints:Array<string>) {

  return new Promise((resolve, reject) => {


   const SRC_FOLDER = join(normalize(process.cwd()), 'src');
   const AMP_FOLDER = join(normalize(process.cwd()), 'dist/amp');


   const webpackConfig: any =  {
     entry: { entry: './src/styles.scss', },
     output: {
       path: AMP_FOLDER,
       filename: 'noop.js',
     },
     plugins: [
      new MiniCssExtractPlugin({
        filename: "styles.css"
      })
    ],
    module: {
      rules: [
        {
          test: /\.s?css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'sass-loader'
          ]
        }
      ]
    }
  }


   const webpackCompiler = webpack(webpackConfig);
   const statsConfig = getWebpackStatsConfig(false);
   let i = 0;
   const callback: webpack.compiler.CompilerCallback = (err, stats) => {
     i = i + 1;
     if (err) {
       reject(err);
       console.error(err);
     }
     console.log('webpack run scss');
     resolve(true);


   };
   webpackCompiler.run(callback);
 });
 }


const webpackConfigTemplate = {
  entry: { static: './projects/ssr/webpack/static.ts' },
  resolve: { extensions: ['.js', '.ts'] },
  target: 'node',
  mode: 'none',
  // this makes sure we include node_modules and other 3rd party libraries
  // externals: [],
  externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
  module: {
    rules: [{
      test: /\.ts$/,
      loader: 'ts-loader',
      exclude: [/node_modules\/puppeteer/, /node_modules\/@ampgular/] },
    ],
  },
  plugins: [
    // Temporary Fix for issue: https://github.com/angular/angular/issues/11580
    // for 'WARNING Critical dependency: the request of a dependency is an expression'
    new webpack.ContextReplacementPlugin(
      /(.+)?angular(\\|\/)core(.+)?/,
      join(normalize(__dirname), 'src'), // location of your src
      {}, // a map of your routes
    ),
    new webpack.ContextReplacementPlugin(
      /(.+)?express(\\|\/)(.+)?/,
      join(normalize(__dirname), 'src'),
      {},
    ),
    new ProgressBarPlugin({
        format: '  build [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)',
        clear: false,
      }),
  ],
};


const webpackOutputOptions = {
  colors: true,
  hash: true, // required by custom stat output
  timings: true, // required by custom stat output
  chunks: true, // required by custom stat output
  chunkModules: false,
  children: false, // listing all children is very noisy in AOT and hides warnings/errors
  modules: false,
  reasons: false,
  warnings: true,
  errors: true,
  assets: true, // required by custom stat output
  version: false,
  errorDetails: false,
  moduleTrace: false,
};

const verboseWebpackOutputOptions = {
  children: true,
  assets: true,
  version: true,
  reasons: true,
  chunkModules: false, // TODO: set to true when console to file output is fixed
  errorDetails: true,
  moduleTrace: true,
};


function getWebpackStatsConfig(verbose = false) {
  return verbose
    ? Object.assign(webpackOutputOptions, verboseWebpackOutputOptions)
    : webpackOutputOptions;
}
