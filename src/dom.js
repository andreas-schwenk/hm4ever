/**
 * hm4ever  an open-source based instance of the HM4MINT.nrw course
 * AUTHOR:  Andreas Schwenk <mailto:contact@compiler-construction.com>
 * LICENSE: GPLv3
 */

/**
 * This file provides helper functions for generating DOM elements, including
 * mathematical equations, rendered by "katex".
 */

/**
 * Generates a HTMLSpanElement.
 * @param {string} innerHTML
 * @param {HTMLElement[]} [children=[]]
 * @returns {HTMLSpanElement}
 */
export function genSpan(innerHTML, children = []) {
  let span = document.createElement("span");
  if (children.length > 0) span.append(...children);
  else span.innerHTML = innerHTML;
  return span;
}

/**
 * Generates a HTMLSpanElement with red color.
 * @param {string} innerHTML
 * @param {HTMLElement[]} [children=[]]
 * @returns {HTMLSpanElement}
 */
export function genErrorSpan(innerHTML, children = []) {
  let span = genSpan(innerHTML, children);
  span.style.color = "red";
  return span;
}

/**
 * Renders a TeX-bases equation to an existing HTML element using "katex".
 * @param {HTMLElement} element
 * @param {string} tex
 * @param {boolean} [displayStyle=false]
 */
export function updateMathElement(element, tex, displayStyle = false) {
  // @ts-ignore
  katex.render(tex, element, {
    throwOnError: false,
    displayMode: displayStyle,
    macros: {
      "\\R": "\\mathbb{R}",
      "\\Rzero": "\\mathbb{R}_0 ",
      "\\N": "\\mathbb{N}",
      "\\Nzero": "\\mathbb{N}_0 ",
      "\\Q": "\\mathbb{Q}",
      "\\Qzero": "\\mathbb{Q}_0 ",
      "\\Z": "\\mathbb{Z}",
      "\\Zzero": "\\mathbb{Z}_0 ",
      "\\C": "\\mathbb{C}",
      "\\K": "\\mathbb{K}",
      "\\abs": "\\left|#1\\right|",
    },
  });
}

/**
 * Renders a TeX-bases equation to a new HTML element using "katex".
 * @param {string} tex
 * @param {boolean} [displayStyle=false]
 * @returns {HTMLSpanElement}
 */
export function genMathSpan(tex, displayStyle = false) {
  let span = document.createElement("span");
  updateMathElement(span, tex, displayStyle);
  return span;
}
