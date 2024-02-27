/**
 * hm4ever  an open-source based instance of the HM4MINT.nrw course
 * AUTHOR:  Andreas Schwenk <mailto:contact@compiler-construction.com>
 * LICENSE: GPLv3
 */

/**
 * This file implements the lexical analysis / scanner / tokenization
 * for TeX input sources.
 */

export class TexLexer {
  /**
   * @param {string} src
   */
  constructor(src) {
    /** @type {string} */
    this.src = src
      .replaceAll('\\"u', "ü")
      .replaceAll('\\"a', "ä")
      .replaceAll('\\"o', "ö")
      .replaceAll('\\"U', "Ü")
      .replaceAll('\\"A', "Ä")
      .replaceAll('\\"O', "Ö")
      .replaceAll("\\,", "~"); // TODO (must update lexer and/or parser)
    // fix typos:
    this.src = this.src
      .replaceAll('"u', "ü")
      .replaceAll('"a', "ä")
      .replaceAll('"o', "ö")
      .replaceAll('"U', "Ü")
      .replaceAll('"A', "Ä")
      .replaceAll('"O', "Ö");
    // fix environments
    // TODO: some fixed can also be done via macros
    this.src = this.src
      .replaceAll("\\begin{mtable}[\\cellaligns{ccl}]", "\\begin{array}{ccl}")
      .replaceAll("\\begin{mtable}[\\class{layout} ]", "\\begin{array}{ccl}")
      .replaceAll("\\begin{mtable}[\\cellaligns{lcl}]", "\\begin{array}{lcl}")
      .replaceAll("\\end{mtable}", "\\end{array}");
    this.src = this.src.replaceAll("[a;\\infty)", "\\lbrack a;\\infty)");

    /** @type {number} -- the current position in the input this.src */
    this.pos = 0;
    /** @type {number} -- the current row number */
    this.row = 1;
    /** @type {number} -- the current column number */
    this.col = 1;
    /** @type {boolean} -- true, iff the current token is preceded by one of
     *                     "\n" or "\t" or " " */
    this.precedingWhiteSpacing = false;
    /** @type {string} -- the current input token  */
    this.token = "";
    /** @type {number} -- the row number of the current token */
    this.token_row = 1;
    /** @type {number} -- the column number of the current token */
    this.token_col = 1;
    // advance in the input to the first token (and consume it)
    this.next();
  }

  /**
   * Reports an error message (normally called by the parser)
   * @param {string} msg
   * @returns {void}
   */
  error(msg) {
    throw Error(
      "Parser Error: " + this.token_row + ":" + this.token_col + ":" + msg
    );
  }

  /**
   * Expect a terminal: advance if it matches the current token, or report an
   * error, otherwise.
   * @param {string} t -- the expected terminal identifier
   */
  terminal(t) {
    if (this.token == t) this.next();
    else this.error("expected '" + t + "'");
  }

  /**
   * Advances in the input and updates the current token, as well as position,
   * row, and column indices.
   * @returns {void}
   */
  next() {
    this.token = "";
    let stop = false;
    let n = this.src.length;
    this.precedingWhiteSpacing = false;
    // skip white spaces and comments
    while (this.pos < n && " \t\n%".includes(this.src[this.pos])) {
      this.precedingWhiteSpacing = true;
      let ch = this.src[this.pos];
      if (this.pos < n && ch == "%") {
        while (this.pos < n && this.src[this.pos] != "\n") {
          this.pos += 1;
          this.col += 1;
        }
      } else {
        this.pos += 1;
        if (ch == "\n") {
          this.row += 1;
          this.col = 1;
        } else this.col += 1;
      }
    }
    // the current token begins here
    this.token_row = this.row;
    this.token_col = this.col;
    while (!stop && this.pos < n) {
      let ch = this.src[this.pos];
      let is_backslash = ch == "\\";
      if (is_backslash && this.token.length > 0 && this.token != "\\") {
        // we must stop, if the next character is "\", and a non-empty token is
        // already present
        return;
      }
      let is_alpha =
        (ch >= "A" && ch <= "Z") ||
        (ch >= "a" && ch <= "z") ||
        "äöüÄÖÜß".includes(ch);
      let is_num = ch >= "0" && ch <= "9";
      if (!(is_backslash || is_alpha || is_num)) {
        if (this.token.length > 0) {
          if ("[]{};".includes(ch) && this.token == "\\") {
            // return "\[", "\{", ... as compound token
            this.token += ch;
            this.pos += 1;
            this.col += 1;
          }
          return;
        }
        stop = true;
      }
      this.token += ch;
      this.pos += 1;
      if (ch == "\n") {
        this.row += 1;
        this.col = 1;
      } else this.col += 1;
    }
  }

  /**
   * Test function to display the sequence of tokens in the standard output.
   */
  test() {
    while (this.token.length > 0) {
      let tk = this.token.replace("\n", "\\n");
      console.log("" + this.token_row + ":" + this.token_col + ":" + tk);
      this.next();
    }
  }
}
