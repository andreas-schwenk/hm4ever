/**
 * hm4ever  an open-source based instance of the HM4MINT.nrw course
 * AUTHOR:  Andreas Schwenk <mailto:contact@compiler-construction.com>
 * LICENSE: GPLv3
 */

/**
 * This file implements the entry point and global control.
 */

import { TexLexer } from "./lexer.js";
import { createChapterNavigation, createGlobalNavigation } from "./nav.js";
import { TexParser } from "./parser.js";
import { Question } from "./question.js";
import { Renderer } from "./render.js";

/**@type {boolean} -- debugging mode active? if true, only file test/tmp.tex is shown */
export let debug = false;

/** @type {string} -- displayed language; "de" := German */
export let LANG = "de";
/** @type {Object.<string,Object>} -- JSON file contents/synth/tree.json */
export let tree = null;

/** @type {Question[]} -- list of active questions; with student input field(s) */
export let questions = [];

/** @type {Object.<string, number>} -- the current selected part/chapter/... index */
export let activeIndices = {
  part: 0, // -1 for none
  chapter: 0, // -1 for none
  subchapter: 0, // lecture|exercise|training
};

// DOM elements
let navigation = document.getElementById("navigation");
let welcome = document.getElementById("welcome");
let index = document.getElementById("index");

// initialization function
export function init() {
  if (debug) {
    // debug mode shows chapter in file test/tmp.tex
    welcome.style.display = "none";
    fetch("test/tmp.tex?v=" + Date.now())
      .then((x) => x.text())
      .then((src) => {
        setState(false);
        show_chapter(src);
      });
  } else {
    // non-debugging mode
    // (a) "hm4ever" logo becomes home-button
    document.getElementById("indexLink").addEventListener("click", () => {
      setState(true);
    });
    // (b) load the course tree and show index first
    fetch("content/synth/tree.json?v=" + Date.now())
      .then((x) => x.json())
      .then((_tree) => {
        tree = _tree;
        setState(true);
      })
      .catch((e) => {
        console.log(e);
      });
  }
}

// trigger actual startup
init();

/**
 * Switches the current stat between index view and content view
 * @param {boolean} showIndex -- true, if index view is active
 */
export function setState(showIndex) {
  document.getElementById("error").innerHTML = "";
  if (showIndex) {
    document.getElementById("content").innerHTML = "";
    welcome.style.display = "block";
    index.style.display = "block";
    navigation.innerHTML = "";
    navigation.style.display = "none";
    createGlobalNavigation();
  } else {
    welcome.style.display = "none";
    index.style.display = "none";
    navigation.style.display = "block";
    if (debug == false) createChapterNavigation();
  }
}

/**
 * Shows chapter by given TeX input source
 * @param {string} src
 */
export function show_chapter(src) {
  document.getElementById("error").innerHTML = "";
  questions = []; // reset question list
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
