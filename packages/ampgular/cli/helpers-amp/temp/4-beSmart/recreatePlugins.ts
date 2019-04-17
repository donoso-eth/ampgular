import { AmpArgs } from '../helper/model';
import { plugins } from '../pluginConfig';
import * as minimatch from "minimatch";

 const BuildPluginsSpec = async (args:AmpArgs):Promise<{}> => {

  const plugin = plugins;
  const myPagePlugin = {};
  Object.keys(plugin).forEach(singlePlugin=> {


    if (plugin[singlePlugin].routes.length==undefined && plugin[singlePlugin].routes['match'].some(patternAr =>
      minimatch(args['route'], patternAr, {})))
      {
        myPagePlugin[singlePlugin] = plugin[singlePlugin]
      }

      else if (plugin[singlePlugin].routes['match'].some(patternAr =>
        minimatch(args['route'], patternAr, {})) &&  args['route'].split("/").length==plugin[singlePlugin].routes['length']) {
          myPagePlugin[singlePlugin] = plugin[singlePlugin]
      }


  })


  return myPagePlugin

}



export const recreatePlugins = async (args:AmpArgs):Promise<any> => {

  const myPagePlugin = await BuildPluginsSpec(args)


   for (const myPlugin of  Object.keys(myPagePlugin)){
      args =  myPagePlugin[myPlugin]['plugin'](args)
   }


  return args
}
