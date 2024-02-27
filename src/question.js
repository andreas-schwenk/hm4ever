/**
 * hm4ever  an open-source based instance of the HM4MINT.nrw course
 * AUTHOR:  Andreas Schwenk <mailto:contact@compiler-construction.com>
 * LICENSE: GPLv3
 */

/**
 * This file implements student questions.
 */

// TODO: use https://github.com/andreas-schwenk/pysell as dependency

import { TexNode } from "./tex_node.js";

export class Question {
  /**
   * @param {HTMLDivElement} box
   */
  constructor(box) {
    /** @type {HTMLDivElement} */
    this.box = null;
    /** @type {Object.<string,number>} */
    this.varsInteger = {};
  }
  /**
   * @param {TexNode} node
   */
  parseAndGenVariables(node) {
    for (let c of node.children) {
      switch (c.id) {
        case "\\randint": {
          let forbidZero = c.params.length > 0 && c.params[0].getText() === "Z";
          if (c.children.length != 3) {
            this.error("\\randint expects 3 args");
            return;
          }
          let varId = c.children[0].getText();
          let lowerBound = parseInt(c.children[1].getText());
          let upperBound = parseInt(c.children[2].getText());
          if (upperBound < lowerBound) {
            this.error("\\randint: lower bound > upper bound");
            return;
          }
          let value = randomInteger(lowerBound, upperBound, forbidZero);
          this.varsInteger[varId] = value;
          break;
        }
        default: {
          this.error("ERROR: unimplemented " + c.id);
          break;
        }
      }
    }
  }

  /**
   *
   * @param {string} msg
   */
  error(msg) {
    this.box.style.color = "red";
    this.box.innerHTML = msg;
  }
}

/**
 *
 * @param {number} min --- inclusive
 * @param {number} max --- inclusive
 * @param {boolean} forbidZero
 * @returns {number}
 */
function randomInteger(min, max, forbidZero) {
  const min2 = Math.ceil(min);
  const max2 = Math.floor(max) + 1;
  let num = 0;
  let iteration = 0;
  do {
    num = Math.floor(Math.random() * (max2 - min2) + min2);
    iteration++;
  } while (forbidZero && num == 0 && iteration < 50);
  return num;
}
