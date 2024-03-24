/**
 * hm4ever  an open-source based instance of the HM4MINT.nrw course
 * AUTHOR:  Andreas Schwenk <mailto:contact@compiler-construction.com>
 * LICENSE: GPLv3
 */

/**
 * This file implements the entry point and global control.
 */

import { TexLexer } from "./lexer.js";
import {
  createChapterNavigation,
  createGlobalNavigation,
  renderedChapterNavigation,
} from "./nav.js";
import { TexParser } from "./parser.js";
import { Question } from "./question.js";
import { Renderer } from "./render.js";

/** @type {string} -- displayed language; "de" := German */
export let LANG = "de";
/** @type {Object.<string,Object>} -- JSON file contents/synth/tree.json */
export let tree = null;

export let state = {
  debug: false, // debugging mode active? if true, only file test/tmp.tex is shown
  part: -1, // -1 := index
  chapter: -1,
  documentType: "", // "lecture", "example", "training"
  document: -1,
};
export function pushState() {
  let params = [];
  if (state.debug) params.push("debug=true");
  params.push("part=" + state.part);
  if (state.part >= 0) {
    params.push("chapter=" + state.chapter);
    params.push("documentType=" + state.documentType);
    params.push("document=" + state.document);
  }
  let paramsStr = params.length > 0 ? "?" : "";
  paramsStr += params.join("&");
  window.history.pushState(state, null, paramsStr);
}

/** @type {Question[]} -- list of active questions; with student input field(s) */
export let questions = [];

// DOM elements
let navigation = document.getElementById("navigation");
let welcome = document.getElementById("welcome");
let index = document.getElementById("index");

// init
const urlParams = new URLSearchParams(window.location.search);
state.debug = urlParams.has("debug");
if (urlParams.has("part")) state.part = parseInt(urlParams.get("part"));
if (urlParams.has("chapter"))
  state.chapter = parseInt(urlParams.get("chapter"));
if (urlParams.has("documentType")) {
  let validTypes = ["lecture", "example", "training"];
  state.documentType = urlParams.get("documentType");
  if (validTypes.includes(state.documentType) == false)
    state.documentType = "lecture";
}
if (urlParams.has("document"))
  state.document = parseInt(urlParams.get("document"));
window.history.replaceState(state, null, "");
window.onpopstate = function (event) {
  if (event.state) state = event.state;
  render();
};

// (b) load the course tree
fetch("content/synth/tree.json?v=" + Date.now())
  .then((x) => x.json())
  .then((_tree) => {
    tree = _tree;

    if (state.debug == false) {
      // "hm4ever" logo becomes home-button
      document.getElementById("indexLink").addEventListener("click", () => {
        state.part = -1;
        pushState();
        render();
      });
    }

    render();
  });

export function render() {
  if (state.debug) {
    // debugging mode: show chapter in file test/tmp.tex
    welcome.style.display = "none";
    fetch("test/tmp.tex?v=" + Date.now())
      .then((x) => x.text())
      .then((src) => {
        showChapterContents(src);
      });
  } else {
    // non-debugging mode
    if (state.part < 0) {
      showIndex();
    } else {
      if (!renderedChapterNavigation) createChapterNavigation();

      let found = false;
      if (state.part >= 0 && state.part < tree.parts.length) {
        let part = tree.parts[state.part];
        if (state.chapter >= 0 && state.chapter < part.chapters.length) {
          found = true;
          let chapter = part.chapters[state.chapter];
          let doc = null;
          switch (state.documentType) {
            case "lecture":
              doc = chapter.lectures[state.document];
              break;
            case "example":
              doc = chapter.examples[state.document];
              break;
            case "training":
              doc = chapter.trainings[state.document];
              break;
          }
          if (doc != undefined) {
            fetch(doc.path + "?v=" + Date.now())
              .then((x) => x.text())
              .then((src) => {
                showChapterContents(src);
              });
          }
        }
      }
      if (!found) {
        document.getElementById("error").style.display = "block";
        document.getElementById("error").innerHTML = "invalid part/chapter";
      }
    }
  }
}

function showIndex() {
  document.getElementById("content").innerHTML = "";
  welcome.style.display = "block";
  index.style.display = "block";
  navigation.innerHTML = "";
  navigation.style.display = "none";
  createGlobalNavigation();
}

/**
 * Shows chapter by given TeX input source
 * @param {string} src
 */
function showChapterContents(src) {
  document.getElementById("error").innerHTML = "";
  welcome.style.display = "none";
  index.style.display = "none";
  navigation.style.display = "block";

  // reset question list
  questions = [];
  //let lex = new TexLexer(src);
  //lex.test();
  let parser = new TexParser(src);
  try {
    parser.parse();
    //let debug_out = parser.root.toString();
    //console.log(debug_out);
    let renderer = new Renderer(parser.root);
    renderer.render();
    document.getElementById("error").style.display = "none";
    document.getElementById("error").innerHTML = "";
    document.getElementById("content").innerHTML = "";
    document.getElementById("content").appendChild(renderer.doc);
  } catch (e) {
    document.getElementById("error").style.display = "block";
    document.getElementById("error").innerHTML = e;
    document.getElementById("content").innerHTML = "";
  }
}
