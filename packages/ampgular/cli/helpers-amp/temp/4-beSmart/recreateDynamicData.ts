import { AmpArgs } from "../../server-amp/helper/model";
import { load } from "cheerio";
import { ampDynamic } from "../../server-amp/dynamicData";
import { recreateEvent } from "../../server-amp/helper/utils";
import * as minimatch from "minimatch";

const BuildDynamicSpec = async (args: AmpArgs): Promise<{}> => {
  const dynamic = ampDynamic;
  const myPageDynamic = {};
  Object.keys(dynamic).forEach(singleDynamic => {
    if (
      dynamic[singleDynamic].routes.length == undefined &&
      dynamic[singleDynamic].routes["match"].some(patternAr =>
        minimatch(args["route"], patternAr, {})
      )
    ) {
      myPageDynamic[singleDynamic] = dynamic[singleDynamic];
    } else if (
      dynamic[singleDynamic].routes["match"].some(patternAr =>
        minimatch(args["route"], patternAr, {})
      ) &&
      args["route"].split("/").length == dynamic[singleDynamic].routes["length"]
    ) {
      myPageDynamic[singleDynamic] = dynamic[singleDynamic];
    }
  });

  return myPageDynamic;
};
const formPostData = async (
  args: AmpArgs,
  dynamic: any,
  form: any
): Promise<AmpArgs> => {
  const $ = args["cheerio"];
  const myIdForm = `[id='${form["id"]}']`;

  const formId$ = $(myIdForm);


  //console.log(listInputs)

  //const listId = new String(listAttr$['attribs']['id']).toString();

  //$(list['id']).attr("id",listAttr$['attribs']['id']+ "-delete");

  /////// FROM STATE INIT LOADING AND EMPTY DIVS
  // let initString = "";
  // if (form["state"].indexOf("init") != -1) {
  //   const myLookID$ = $(`[id='${form["id"] + "Init"}']`);
  //   initString = `<div [hidden]="${
  //     form["id"]
  //   }Loaded" >  ${myLookID$.html()}  </div> `;
  // }

  if (form["state"].indexOf("loading") != -1) {

    const myLookID$ = $(`[id='${form["id"] + "Loading"}']`);

    myLookID$.attr("submitting","")
    }

  if (form["state"].indexOf("success") != -1) {
    const myLookID$ = $(`[id='${form["id"] + "Success"}']`);
    myLookID$.attr("submit-success","")
  }

  if (form["state"].indexOf("error") != -1) {
    const myLookID$ = $(`[id='${form["id"] + "Error"}']`);
    myLookID$.attr("submit-error","")
  }



  formId$.attr("method", "post");
  formId$.attr("action-xhr", form['api']);
  formId$.attr("target", "_top");


  if (form['validation']){
    formId$.attr("novalidate",null);
  }

  const formhtml = `<form  id="${myIdForm}"
  method="post"
  action-xhr="${form["api"]}"
  target="_top"
  on="submit-success: ${
    form["id"]
  }Loaded:true})">

</form>`;

  // /////EVENTS to SUBIT
  // if (list["submit"] != undefined) {
  //   list["submit"].forEach(async submit => {
  //     args = await recreateEvent(
  //       args,
  //       submit["id"],
  //       submit["event"],
  //       `${myIdForm}.submit`
  //     );
  //   });
  // }

  return args;
};

const formDynamicData = async (
  args: AmpArgs,
  dynamic: any,
  list: any
): Promise<AmpArgs> => {
  const $ = args["cheerio"];
  const myIdSearch = `[id='${list["id"]}']`;
  const myIdList = `[id='${list["id"] + "List"}']`;

  const myIdForm = `${list["id"] + "Form"}`;

  const listId$ = $(myIdList);

  const content = listId$.html(); // .replace(new RegExp(),"");

  let classTop = "";

  const listAttr$ = listId$.get(0);
  const listInputs = Object.keys(listAttr$["attribs"])
    .map(key => {
      let cleanKey = key.replace("attr.", "");

      if (cleanKey === "data-api") {
        list["api"] = listAttr$["attribs"][key];
        return false;
      }
      if (cleanKey === "class") {
        classTop = listAttr$["attribs"][key];
        return false;
      }
      if (cleanKey.indexOf("data-") == -1) {
        return false;
      }
      cleanKey = cleanKey.replace("data-", "");
      let obj = {};
      (obj["key"] = cleanKey), (obj["value"] = listAttr$["attribs"][key]);
      if (list["inputs"]["bind"].some(bind => bind == cleanKey)) {
        obj["[value]"] = cleanKey;
      } else if (list["inputs"]["fixed"].every(fixed => fixed !== cleanKey)) {
        return false;
      }

      return obj;
    })
    .filter(key => key != false)
    .reduce((previous, value) => {
      let objstring = ` type="text" hidden name=${value["key"]} value="${
        value["value"]
      }" `;

      if (value["[value]"] !== undefined) {
        objstring = objstring + `[value]=${value["[value]"]} `;
      }
      objstring = `<input ${objstring} > \n`;

      return previous + objstring;
    }, "");

  //console.log(listInputs)

  //const listId = new String(listAttr$['attribs']['id']).toString();

  //$(list['id']).attr("id",listAttr$['attribs']['id']+ "-delete");

  const listhtml = `<amp-list  id="${list["id"] +
    "List"}" class="${classTop}"  width="auto"
  height="0" [height]="${list["height"]}"
  layout="fixed-height" [src]="${list["src"]}"
  >
  <template type="amp-mustache">
   ${content}
  </template>
  </amp-list>\r`;

  /////// FROM STATE INIT LOADING AND EMPTY DIVS
  let initString = "";
  if (list["state"].indexOf("init") != -1) {
    const myLookID$ = $(`[id='${list["id"] + "Init"}']`);
    initString = `<div [hidden]="${
      list["id"]
    }Loaded" >  ${myLookID$.html()}  </div> `;
  }
  let loadingString = "";
  if (list["state"].indexOf("loading") != -1) {
    const myLookID$ = $(`[id='${list["id"] + "Loading"}']`);
    loadingString = `<div submitting >  ${myLookID$.html()}  </div> `;
  }
  let emptyString = "";
  if (list["state"].indexOf("loading") != -1) {
    const myLookID$ = $(`[id='${list["id"] + "Empty"}']`);
    emptyString = `<div submit-success [hidden]="${
      list["src"]
    }.length >0" >  ${myLookID$.html()}  </div> `;
  }

  const formhtml = `<form  id="${myIdForm}"
  method="post"
  action-xhr="${list["api"]}"
  target="_top"
  on="submit-success:AMP.setState({${list["ampState"]}:event.response, ${
    list["id"]
  }Loaded:true})">
  ${listInputs}
  ${initString}
  ${loadingString}
  ${listhtml}
  ${emptyString}

</form>`;
  $(myIdSearch).after(formhtml);

  /////EVENTS to SUBIT
  if (list["submit"] != undefined) {
    list["submit"].forEach(async submit => {
      args = await recreateEvent(
        args,
        submit["id"],
        submit["event"],
        `${myIdForm}.submit`
      );
    });
  }

  $(myIdSearch).remove();
  return args;
};

const listDynamicData = async (
  args: AmpArgs,
  dynmaic: any,
  list: any
): Promise<AmpArgs> => {
  const $ = args["cheerio"];
  let i = 0;

  while ($(`[id='${list["id"] + i}']`).length != 0) {
    const myIdSearch = `[id='${list["id"] + i}']`;

    const myIdList = `[id='${list["id"] + i + "List"}']`;

    const myIdForm = `${list["id"] + i + "Form"}`;

    const listId$ = $(myIdList);
    const listAttr$ = listId$.get(0);

    const api =
      listAttr$["attribs"][
        Object.keys(listAttr$["attribs"]).filter(
          x => x.indexOf("data-api") != -1
        )[0]
      ];

    const content = listId$.html(); // .replace(new RegExp(),"");

    let classTop = "";
    const listhtml = `<amp-list  items="items.hours" id="${list["id"] +
      i +
      "List"}" class="${classTop}"  width="auto"
        height="60"
        layout="fixed-height" src="${api}"
        >
        <template type="amp-mustache">
         ${content}
        </template>

        </amp-list>\r`;

    $(myIdSearch).after(listhtml);
    $(myIdSearch).remove();

    i++;
  }

  return args;
};

export const recreateDynamicData = async (args: AmpArgs): Promise<AmpArgs> => {
  const myPageDynamic = await BuildDynamicSpec(args);


  if (myPageDynamic == undefined) {
    return args;
  }

  for (const dynamic of Object.keys(myPageDynamic)) {
    const myDynamic = myPageDynamic[dynamic];

    const ListsDynamic = myDynamic["lists"];
    if (ListsDynamic != undefined) {
      ListsDynamic.forEach(async list => {
        switch (list["type"]) {
          case "post":
            args = await formDynamicData(args, dynamic, list);
            break;
          case "get":
            args = await listDynamicData(args, dynamic, list);
            break;

          default:
            break;
        }
      });
    }
    const FormsDynamic = myDynamic["forms"];
    if (FormsDynamic != undefined) {
      FormsDynamic.forEach(async form => {
        switch (form["type"]) {
          case "post":
            args = await formPostData(args, dynamic, form);
            break;
          // case "get":
          //   args = await listDynamicData(args, dynamic,form);
          //   break;

          default:
            break;
        }
      });
    }
  }

  return args;
};
