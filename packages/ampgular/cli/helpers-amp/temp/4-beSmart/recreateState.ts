import { AmpArgs, MiniCheerioElement } from "../../server-amp/helper/model";
import { load } from "cheerio";
import { ɵConsole } from "@angular/core";
import { recreateEvent } from "../../server-amp/helper/utils";

const createComponentDefault = async (args: AmpArgs, state: any): Promise<AmpArgs> => {
  const $ = args["cheerio"];

  const myPageState = args["state"];
  let obj = {};
  obj["current" + state] = state + 0;
  let stylesbefore: string[] = [];
  let stylesAfter: string[] = [];
  let i = 0;
  myPageState[state].css.forEach(css => {
    let classLook = css["id"];

    const classId = $(classLook);
    classId.each((index, idEle) => {
      let styleId = new String(idEle.attribs["class"]).toString();
      idEle["attribs"]["[class]"] =
        state +
        "==true? '" +
        css["class"] +
        " " +
        styleId +
        "' : '" +
        styleId +
        "'";
    });
  });

  obj = {};

  for (const myEvent of myPageState[state].events) {
    args = await recreateEvent(
      args,
      myEvent["id"],
      "tap",
      "AMP.setState({" + state + ": !" + state + "})"
    );
  }

  args = await AddState(args, state, false);

  return args;
};

const createComponentListSingle = async (args: AmpArgs, state: any): Promise<AmpArgs> => {
  const $ = args["cheerio"];

  const myPageState = args["state"];
  const myRule = myPageState[state]["css"][0];
  const myID = myRule["id"];
  const myClass = myRule["class"];
  const classId = $(myID);
  classId.each(async (index, idEle) => {
    let obj = {};
    obj["current" + state + index] = state + index + 0;
    let stylesbefore: string[] = [];
    let stylesAfter: string[] = [];
    let i = 0;
    let styleId = idEle.attribs["class"];
    let cla =
      state + index + "? '" + myClass + " " + styleId + "' : '" + styleId + "'";

    idEle.attribs["[class]"] = cla;
    // styleId ? stylesbefore.push(styleId) : stylesbefore.push("");
    // styleId
    //   ? stylesAfter.push(styleId + " " + myClass)
    //   : stylesAfter.push(myClass);
    // obj[state + index + 0] = {};
    // obj[state + index + 0].style = stylesbefore;
    // obj[state + index + 0].next = state + index + 1;
    // obj[state + index + 1] = {};
    // obj[state + index + 1].style = stylesAfter;
    // obj[state + index + 1].next = state + index + 0;
    // let stateText =
    //   `<amp-state id="` +
    //   state +
    //   index +
    //   `">
    //          <script type="application/json">` +
    //   JSON.stringify(obj) +
    //   `
    //          </script>
    //          </amp-state>`;
    // $("body").prepend(stateText);

    args = await AddState(args, state + index, false);
  });

  myPageState[state]["events"].forEach(myEvent => {
    let classLook = myEvent["id"].slice(1, myEvent["id"].length);

    const classId = $(myEvent["id"]);
    classId.each((index, idEle) => {
      let tap =
        "tap:AMP.setState({" + state + index + ":!" + state + index + "})";

      idEle["attribs"]["on"] = tap;
      if (idEle.tagName != "button") {
        idEle["attribs"]["role"] = "button";
        idEle["attribs"]["tabindex"] = "";
      }
    });
  });

  return args;
};

const createComponentListBind = async (args: AmpArgs, state: any): Promise<AmpArgs> => {
  const myBindState = args["state"][state];
  const $ = args["cheerio"];

  args = await AddState(args, state, 0);

  //EVENTS
  myBindState.events.forEach(event => {
    const myID = event["id"];
    const classId = $(myID);
    if (classId.length > 0) {
      classId.each((index, idEle) => {
        let tap = "tap:AMP.setState({" + state + ":" + index + "})";

        idEle["attribs"]["on"] = tap;
        if (idEle.tagName != "button") {
          idEle["attribs"]["role"] = "button";
          idEle["attribs"]["tabindex"] = "";
        }
      });
    }
  });

  //CSS
  myBindState.css.forEach(css => {
    const myID = css["id"];
    const classId = $(myID);
    const classIndex = css["class"];

    if (classId.length > 0) {
      classId.each((index, idEle) => {
        let eleClass = new String(idEle["attribs"]["class"]).toString();
        classIndex
          .filter(classLocal => classLocal != "")
          .map(classLocal => new RegExp("\\b" + classLocal + "\\b", "gm"))
          .forEach(x => {
            eleClass = eleClass.replace(x, "");
          });
        idEle["attribs"]["[class]"] =
          state +
          "<" +
          index +
          "? '" +
          eleClass +
          " " +
          classIndex[0] +
          "' :(" +
          state +
          "==" +
          index +
          "? '" +
          eleClass +
          " " +
          classIndex[1] +
          "' : '" +
          eleClass +
          " " +
          classIndex[2] +
          "')";
      });
    }
  });

  return args;
};

const createComponentMultiBind = async (args: AmpArgs, state: any): Promise<AmpArgs> => {
  const myPageState = args["state"];

  const $ = args["cheerio"];
  let obj = {};
  let ii = 0;

  let classesCleaning = {}
  for (const cssKey of Object.keys(myPageState[state].css)) {
    let i = 0;
    let cssArray = myPageState[state].css[cssKey];

    cssArray.forEach(css => {
      classesCleaning[i]==undefined?  classesCleaning[i]="" : classesCleaning[i]
      classesCleaning[i] = (css.class + " " + classesCleaning[i]).trim()
      i++
    })
  }

  for (const cssKey of Object.keys(myPageState[state].css)) {
    let stylesbefore: string[] = [];
    let stylesAfter: string[] = [];
    let i = 0;
    let cssArray = myPageState[state].css[cssKey];
    cssArray.forEach(css => {

      if (ii == 0) {
        obj["current" + state] = cssKey;
      }

      let classLook = css["id"];

      const classId = $(classLook);

      classId.each((index, idEle) => {

        let myLocalClasses = idEle.attribs["class"].split(" ")



        let styleId   =
        myLocalClasses.filter(local=> ! classesCleaning[i].split(" ").includes(local)).join(" ").trim();
        //console.log(testCss);
        //let styleId = idEle.attribs["class"].replace(css.class,'');


        if (ii == 0) {
          let cla =
            state + "[" + state  + ".current" + state + "].style[" + i + "]";
          idEle.attribs["[class]"] = cla;
        }

        //styleId?stylesbefore.push(styleId):stylesbefore.push('');
        styleId
          ? stylesAfter.push(styleId + " " + css.class)
          : stylesAfter.push(css.class);
        i = i + 1;
      });
    });
    obj[cssKey] = {};
    obj[cssKey].style = stylesAfter;

    ii = 1;
  }

  let stateText =
    `<amp-state id="` +
    state +
    `">
       <script type="application/json">` +
    JSON.stringify(obj) +
    `
       </script>
       </amp-state>`;
  $("body").prepend(stateText);

  for (const myEvent of myPageState[state].events) {
    args = await recreateEvent(
      args,
      myEvent["id"],
      "tap",
      "AMP.setState({" + state + ": {currentdateId : '" +   myEvent["state"] + "'}})"
    );
  }

  return args;
};

const createComponentScroll = async (args: AmpArgs, state: any): Promise<AmpArgs> => {
  const $ = args["cheerio"];

  const myPageState = args["state"];
  let obj = {};
  obj["current" + state] = state + 0;
  let stylesbefore: string[] = [];
  let stylesAfter: string[] = [];
  let i = 0;
  myPageState[state].events.forEach(event => {
    //  console.log(event);
    let scroll =
      "tap:" +
      event["target"] +
      ".scrollTo(duration=" +
      event["duration"] +
      ")";

    let classLook = event["id"];

    const classId = $(classLook);

    classId.attr("on", scroll);
    if (classId[0].tagName != "button") {
      classId.attr("role", "button");
      classId.attr("tabindex", "");
    }
  });
  return args;
};

const AddState = async (
  args: AmpArgs,
  state: any,
  value: any
): Promise<AmpArgs> => {
  let objString = `<amp-state id="${state}" > ${value}  </amp-state>`;
  args["cheerio"]("body").prepend(objString);
  return args;
};

export const recreateState = async (args: AmpArgs): Promise<AmpArgs> => {
  const myPageState = args["state"];

  if (myPageState == undefined) {
    return args;
  }

  Object.keys(myPageState).forEach(async state => {
    const myComponent = myPageState[state];
    const componentType = myComponent["type"];

    switch (componentType) {
      case "list-single":
        args = await createComponentListSingle(args, state);
        break;
      case "list-bind":
        args = await createComponentListBind(args, state);
        break;
      case "multi-bind":
        args = await createComponentMultiBind(args, state);
        break;

      case "scroll":
        args = await createComponentScroll(args, state);
        break;

      default:
        args = await createComponentDefault(args, state);
        break;
    }
  });

  return args;
};
