/**
 * hm4ever  an open-source based instance of the HM4MINT.nrw course
 * AUTHOR:  Andreas Schwenk <mailto:contact@compiler-construction.com>
 * LICENSE: GPLv3
 */

/**
 * This file implements the TeX parser.
 */

import { TexLexer } from "./lexer.js";
import { TexNode } from "./tex_node.js";

export class TexParser {
  /**
   * @param {string} src
   */
  constructor(src) {
    /** @type {TexLexer} */
    this.lex = new TexLexer(src);
    /** @type {TexNode} */
    this.root = new TexNode("root", 0, 0, false);
  }

  /**
   * parse all input
   */
  parse() {
    while (this.lex.token.length > 0) this.root.children.push(this.parseNode());
    this.postProcess(this.root);
  }

  /**
   * TODO: this must be rewritten
   * @param {TexNode} node
   */
  postProcess(node) {
    let n = node.children.length;
    for (let i = 0; i < n; i++) {
      if (node.children[i].id === "\\glqq" && i + 1 < n)
        node.children[i + 1].id = node.children[i + 1].id.trimStart();
      if (i + 1 < n && node.children[i + 1].id === "\\grqq")
        node.children[i].id = node.children[i].id.trimEnd();
      this.postProcess(node.children[i]);
    }
  }

  /**
   * Parses a TeX-node recursively. This is non-trivial in some cases. Trust me,
   * this is not my first hand written LL(1)-Parser :-)
   *
   * GRAMMAR
   *   node = "\begin"  "{" ID ["*"] "}" "[" { node } "]" { node }
   *          "\end"    "{" ID ["*"] "}"
   *        | "$" { node } "$"
   *        | "\[" { node } "\]"
   *        | "\" ID { "[" { node } "]" }  { "{" { node } "}" }
   *        | { TOKEN };
   * @returns {TexNode}
   */
  parseNode() {
    if (this.lex.token === "\\begin") {
      let tn = new TexNode(
        "",
        this.lex.token_row,
        this.lex.token_col,
        this.lex.precedingWhiteSpacing
      );
      tn.explicitBeginEnd = true;
      this.lex.next();
      this.lex.terminal("{");
      let id = this.lex.token;
      this.lex.next();
      this.lex.token += ""; // linter hack...
      if (this.lex.token === "*") {
        id += "*";
        this.lex.next();
      }
      this.lex.terminal("}");
      tn.id = "\\" + id;
      if (this.lex.token === "[") {
        this.lex.next();
        this.lex.token += ""; // linter hack...
        while (this.lex.token.length > 0 && this.lex.token != "]")
          tn.params.push(this.parseNode());
        this.lex.terminal("]");
      }
      while (this.lex.token.length > 0 && this.lex.token != "\\end")
        tn.children.push(this.parseNode());
      this.lex.terminal("\\end");
      this.lex.terminal("{");
      let id2 = this.lex.token;
      this.lex.next();
      if (this.lex.token === "*") {
        id2 += "*";
        this.lex.next();
      }
      if (id != id2)
        this.lex.error(
          "'\\end{" + id2 + "}' does not match \\begin{" + id + "}"
        );
      this.lex.terminal("}");
      return tn;
    } else if (this.lex.token === "$") {
      let type = this.lex.precedingWhiteSpacing ? "S$" : "$";
      let tn = new TexNode(
        type,
        this.lex.token_row,
        this.lex.token_col,
        this.lex.precedingWhiteSpacing
      );
      this.lex.next();
      while (this.lex.token.length > 0 && this.lex.token != "$")
        tn.children.push(this.parseNode());
      this.lex.terminal("$");
      return tn;
    } else if (this.lex.token === "\\[") {
      let tn = new TexNode(
        "$$",
        this.lex.token_row,
        this.lex.token_col,
        this.lex.precedingWhiteSpacing
      );
      this.lex.next();
      this.lex.token += ""; // linter hack...
      while (this.lex.token.length > 0 && this.lex.token != "\\]")
        tn.children.push(this.parseNode());
      this.lex.terminal("\\]");
      return tn;
    } else if (this.lex.token.startsWith("\\")) {
      let tn = new TexNode(
        this.lex.token,
        this.lex.token_row,
        this.lex.token_col,
        this.lex.precedingWhiteSpacing
      );
      this.lex.next();
      if (["\\left", "\\right", "\\big"].includes(tn.id)) {
        if (this.lex.token === "[" || this.lex.token === "]") {
          tn.id += this.lex.token;
          this.lex.next();
          return tn;
        }
      }
      while (this.lex.token === "[") {
        this.lex.next();
        this.lex.token += ""; // linter hack...
        while (this.lex.token.length > 0 && this.lex.token != "]")
          tn.params.push(this.parseNode());
        this.lex.terminal("]");
      }
      while (this.lex.token === "{") {
        let tn2 = new TexNode(
          "!PARAM",
          this.lex.token_row,
          this.lex.token_col,
          this.lex.precedingWhiteSpacing
        );
        tn.children.push(tn2);
        this.lex.next();
        this.lex.token += ""; // linter hack...
        while (this.lex.token.length > 0 && this.lex.token != "}")
          tn2.children.push(this.parseNode());
        this.lex.terminal("}");
      }
      return tn;
    } else {
      let tn = new TexNode("", this.lex.token_row, this.lex.token_col, false);
      do {
        if (this.lex.token_row != tn.row) break;
        if ("\\$}]&".includes(this.lex.token[0])) {
          if (tn.id.length == 0) {
            tn.id = this.lex.token;
            this.lex.next();
          }
          break;
        }
        tn.id += (this.lex.precedingWhiteSpacing ? " " : "") + this.lex.token;
        this.lex.next();
      } while (this.lex.token.length > 0);
      return tn;
    }
  }
}
