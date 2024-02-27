/**
 * hm4ever  an open-source based instance of the HM4MINT.nrw course
 * AUTHOR:  Andreas Schwenk <mailto:contact@compiler-construction.com>
 * LICENSE: GPLv3
 */

/**
 * This file implements a single "node" of TeX. Its kind of the AST for TeX...
 */

export class TexNode {
  /**
   * @param {string} id
   * @param {number} row
   * @param {number} col
   * @param {boolean} precedingWhiteSpacing
   */
  constructor(id, row, col, precedingWhiteSpacing) {
    /** @type {string} */
    this.id = id;
    /**
     * @type {TexNode[]} -- parameters, as given in brackets,
     * e.g "\includegraphics[scale=1.5]" has home parameter node for the scaling
     */
    this.params = [];
    /**
     * @type {TexNode[]} -- the children nodes; e.g. "\frac{x}{x+y}" has two
     * children {x} and {x+y}. These kind of children have node.id "!PARAM",
     * to be distinguished from all other kinds of children. An example for the
     * latter is "\textbf{abc}", with node.id="abc" as child node.
     */
    this.children = [];
    /**
     * @type {boolean} -- true for e.g. "\begin{x} ... \end{x}"; then node.id
     * = "x".
     */
    this.explicitBeginEnd = false;
    /**
     * @type {boolean} -- true, iff the current node was preceded (on the same
     * hierarchy level) by one  or more of characters "\n", "\t", " ".
     */
    this.precedingWhiteSpacing = precedingWhiteSpacing;
    /** @type {number} -- the row number in the input file */
    this.row = row;
    /** @type {number} -- the column number in the input file */
    this.col = col;
  }

  /**
   * @param {string} id
   * @returns {TexNode}
   */
  getChildById(id) {
    for (let c of this.children) if (c.id === id) return c;
    throw new Error("" + this.row + ":" + this.col + ": no child '" + id + "'");
  }

  /**
   * @param {string} id
   * @returns {boolean}
   */
  contains(id) {
    for (let c of this.children) {
      let ci = c.contains(id);
      if (ci) return true;
    }
    return this.id.includes(id);
  }

  /**
   * Recursively gets the maximum row number.
   * @returns {number}
   */
  getMaxSrcRow() {
    let m = -Infinity;
    for (let c of this.children) {
      let mi = c.getMaxSrcRow();
      if (mi > m) m = mi;
    }
    return this.row > m ? this.row : m;
  }

  /**
   * Recursively gets the minimum row number.
   * @returns {number}
   */
  getMinSrcRow() {
    let m = Infinity;
    for (let c of this.children) {
      let mi = c.getMaxSrcRow();
      if (mi < m) m = mi;
    }
    return this.row < m ? this.row : m;
  }

  /**
   * Concatenates children node.ids to a single string.
   * @param {boolean} trim
   * @returns {string}
   */
  getText(trim = true) {
    let t = "";
    if (this.children.length == 0) t = this.id;
    else t = this.children.map((x) => x.getText()).join("");
    return trim ? t.trim() : t;
  }

  /**
   * @param {number} indents
   * @returns {string}
   */
  toString(indents = 0) {
    let s = " ".repeat(indents);
    s += this.id + "  (" + this.row + "," + this.col + ")\n";
    if (this.params.length > 0) {
      s += "[";
      for (let p of this.params) s += p.toString(indents + 2);
      s += "]";
    }
    for (let c of this.children) s += c.toString(indents + 2);
    return s;
  }
}
