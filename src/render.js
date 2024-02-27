/**
 * hm4ever  an open-source based instance of the HM4MINT.nrw course
 * AUTHOR:  Andreas Schwenk <mailto:contact@compiler-construction.com>
 * LICENSE: GPLv3
 */

/**
 * This file recursively translates the TeX-nodes into HTML-Elements, as well
 * adds the behavior and assigns the visual layout.
 *
 * TODO: this file is stell a mess and needs to be cleaned up (+ commented!)...
 */

import { genErrorSpan, genMathSpan, genSpan } from "./dom.js";
import { iconPageUp, iconWarning } from "./icons.js";
import { LANG, activeIndices, debug } from "./index.js";
import { Question } from "./question.js";
import { TexNode } from "./tex_node.js";

export class Renderer {
  /**
   *
   * @param {TexNode} root
   */
  constructor(root) {
    /** @type {TexNode} */
    this.root = root;
    /** @type {string} */
    this.documentClass = "";
    /** @type {HTMLDivElement} */
    this.doc = document.createElement("div");
    /** @type {HTMLDivElement} */
    this.toc = document.createElement("div");
    /** @type {HTMLElement} */
    this.currentAnchor = null;
    /** @type {Object.<string,HTMLElement>} */
    this.labels = {};
    /** @type {number} */
    this.secNo = 1;
    /** @type {number} */
    this.defNo = 1;
    /** @type {number} */
    this.boxDepth = 0;
    /** @type {Question} */
    this.currentQuestion = null;
  }

  render() {
    let documentClassNode = this.root.getChildById("\\documentclass");
    if (documentClassNode.children.length > 0) {
      let tokens = documentClassNode.children[0].getText().split(".");
      this.documentClass = tokens[tokens.length - 1];
    }
    let content = this.root.getChildById("\\content");
    if (content == null) return;
    switch (this.documentClass) {
      case "article": {
        for (let c of content.children) {
          switch (c.id) {
            case "\\visualizationwrapper":
              this.genParagraphs(c, this.doc);
              break;
          }
        }
        break;
      }
      default: {
        this.genParagraphs(content, this.doc);
        break;
      }
    }
  }

  /**
   * @param {TexNode} node
   * @param {HTMLElement} parent
   */
  genParagraphs(node, parent) {
    // generates each a new paragraph, if "\\" occurred,
    // or, if there is at least one more empty lines
    let p = document.createElement("p");
    let lastMaxSrcRow = -1;
    for (let c2 of node.children) {
      let minSrcRow = c2.getMinSrcRow();
      let emptyRow = lastMaxSrcRow >= 0 && minSrcRow - lastMaxSrcRow >= 2;
      if (c2.contains("\\\\") || emptyRow) {
        if (p.innerHTML.length > 0) {
          parent.appendChild(p);
          p = document.createElement("p");
        }
      }
      this.gen(c2, p);
      //if (topLevelCall) {
      //console.log(p.children[p.children.length - 1].tagName);
      //}

      lastMaxSrcRow = c2.getMaxSrcRow();
    }
    if (p.innerHTML.length > 0) parent.appendChild(p);
  }

  /**
   * @param {TexNode} node
   * @param {HTMLElement} parent
   * @returns {void}
   */
  gen(node, parent) {
    switch (node.id) {
      case "!PARAM":
      case "\\problem":
      case "\\text": {
        for (let c of node.children) this.gen(c, parent);
        break;
      }
      case "\\usepackage":
      case "\\embedmathlet": {
        // ignored
        break;
      }
      case "\\\\": {
        // ignored here, since the explicit new line is already
        // considered in this.genParagraphs(..)
        break;
      }
      case "\\title": {
        let no = document.createElement("div");
        no.classList.add("chapterTitleNo");
        if (this.documentClass === "article")
          no.innerHTML =
            (debug ? "[DEBUG] " : "") +
            (activeIndices.chapter + 1) +
            "." +
            (activeIndices.subchapter + 1);
        else no.innerHTML = "" + (activeIndices.subchapter + 1);
        parent.appendChild(no);
        let title = document.createElement("div");
        title.classList.add("chapterTitle");
        this.gen(node.children[0], title);
        //title.appendChild(genSpan(node.children[0].getText()));
        parent.appendChild(title);
        if (this.documentClass !== "article") {
          // remove e.g. "Ü03: "
          title.innerText = title.innerText.split(":").slice(1).join(":");
        }
        break;
      }
      case "\\center": {
        let div = document.createElement("div");
        div.style.textAlign = "center";
        parent.appendChild(div);
        for (let c2 of node.children) {
          this.gen(c2, div);
        }
        break;
      }
      case "\\section": {
        let section = document.createElement("div");
        section.classList.add("section");
        this.currentAnchor = section;
        let secNo = this.secNo++;
        section.appendChild(genSpan("" + secNo + ". "));
        this.gen(node.children[0], section);
        parent.appendChild(section);
        // horizontal line
        parent.appendChild(genSpan("<hr/>"));
        // scroll to toc
        let toTop = document.createElement("div");
        toTop.classList.add("scrollToTop");
        let icon = genSpan(iconPageUp);
        toTop.appendChild(icon);
        parent.appendChild(toTop);
        toTop.addEventListener("click", () => {
          document.getElementById("pageTop").scrollIntoView(true);
        });
        // add to toc
        let tocEntry = document.createElement("div");
        tocEntry.classList.add("tocEntry");
        this.toc.appendChild(tocEntry);
        tocEntry.appendChild(genSpan("" + secNo + ". "));
        this.gen(node.children[0], tocEntry);
        tocEntry.addEventListener("click", () => {
          section.scrollIntoView(true);
        });
        break;
      }
      case "\\question": {
        this.boxDepth++;
        let box = document.createElement("div");
        this.currentQuestion = new Question(box);
        this.currentQuestion.box = box;
        box.classList.add("box");
        parent.appendChild(box);
        let title = document.createElement("div");
        title.classList.add("boxTitle");
        title.appendChild(genSpan("Aufgabe"));
        box.appendChild(title);
        let contents = document.createElement("div");
        contents.classList.add("boxContents");
        box.appendChild(contents);
        this.currentAnchor = box;
        this.genParagraphs(node, contents);
        this.boxDepth--;
        break;
      }
      case "\\variables": {
        if (this.currentQuestion != null)
          this.currentQuestion.parseAndGenVariables(node);
        break;
      }
      case "\\block": {
        if (node.params.length < 1) {
          parent.appendChild(genErrorSpan(" '" + node.id + "' SYNTAX ERROR "));
          return;
        }
        this.boxDepth++;
        let type = node.params[0].getText();
        if (type !== "annotation") {
          let box = document.createElement("div");
          box.classList.add("box");
          parent.appendChild(box);
          let title = document.createElement("div");
          title.classList.add("boxTitle");
          box.appendChild(title);
          let contents = document.createElement("div");
          contents.classList.add("boxContents");
          box.appendChild(contents);
          this.currentAnchor = box;
          switch (type) {
            case "info-box": {
              title.classList.add("infoTitle");
              box.classList.add("infoBox");
              break;
            }
            case "warning": {
              title.classList.add("warningTitle");
              title.style.verticalAlign = "middle";

              title.style.display = "flex";

              let icon = genSpan(iconWarning);
              icon.style.paddingTop = "3px";
              title.appendChild(icon);
              title.appendChild(genSpan("&nbsp;&nbsp;"));
              title.appendChild(genSpan("Achtung!"));
              title.style.paddingBottom = "0px";

              box.classList.add("warningBox");
              break;
            }
            default: {
              break;
            }
          }
          this.genParagraphs(node, contents);
        }
        this.boxDepth--;
        break;
      }
      case "\\definition":
      case "\\example":
      case "\\remark":
      case "\\rule":
      case "\\proof*": {
        this.boxDepth++;
        // outer div
        let box = document.createElement("div");
        box.classList.add("box");
        parent.appendChild(box);
        this.currentAnchor = box;
        // title
        let title = document.createElement("div");
        title.classList.add("boxTitle");
        box.appendChild(title);
        // contents
        let contents = document.createElement("div");
        contents.classList.add("boxContents");
        box.appendChild(contents);
        // set properties depending on type
        let titleText = genSpan("UNKNOWN");
        switch (node.id) {
          case "\\definition":
            titleText = genSpan("Definition " + this.defNo + ": ");
            this.defNo++;
            break;
          case "\\example":
            box.classList.add("exampleBox");
            title.classList.add("exampleTitle");
            box.classList.add("exampleBox");
            titleText = genSpan("Beispiel: ");
            break;
          case "\\remark":
            title.classList.add("remarkTitle");
            box.classList.add("remarkBox");
            titleText = genSpan("Anmerkung: ");
            break;
          case "\\rule":
            // TODO: box.classList.add("definition");
            titleText = genSpan("Rechenregeln: ");
            break;
          case "\\proof*":
            // TODO: box.classList.add("definition");
            titleText = genSpan("");
            break;
          default:
            break;
        }
        title.appendChild(titleText);
        if (node.params.length > 0) {
          let name = genSpan("");
          name.style.fontWeight = "bold";
          title.appendChild(name);
          this.gen(node.params[0], name);
        }
        this.genParagraphs(node, contents);
        this.boxDepth--;
        break;
      }
      case "\\table": {
        let numColumns = [1];
        let cells = [];
        let cell = genSpan("");
        for (let c of node.children) {
          switch (c.id) {
            case "&":
              numColumns[numColumns.length - 1]++;
              cells.push(cell);
              cell = genSpan("");
              break;
            case "\\\\":
              numColumns.push(1);
              cells.push(cell);
              cell = genSpan("");
              break;
            default:
              this.gen(c, cell);
          }
        }
        if (cell.innerHTML.length > 0) cells.push(cell);
        else numColumns.pop();
        let cols = numColumns[0];
        for (let i = 0; i < numColumns.length; i++) {
          if (cols != numColumns[i]) {
            parent.appendChild(
              genErrorSpan(
                " '" +
                  node.id +
                  "' SYNTAX ERROR: table is not well-formed: " +
                  "number of columns per row is " +
                  numColumns.toString()
              )
            );
            return;
          }
        }
        // create HTML table
        let table = document.createElement("table");
        parent.appendChild(table);
        let rows = cells.length / cols;
        for (let i = 0; i < rows; i++) {
          let tr = document.createElement("tr");
          table.appendChild(tr);
          for (let j = 0; j < cols; j++) {
            let td = document.createElement("td");
            tr.appendChild(td);
            td.appendChild(cells[i * cols + j]);
          }
        }
        break;
      }
      case "\\showhide": {
        // container
        let container = document.createElement("div");
        container.classList.add("showHide");
        parent.appendChild(container);
        // title
        let titles = ["ausklappen", "einklappen"];
        let title = document.createElement("div");
        title.classList.add("tabTitle");
        if (node.params.length == 1) {
          this.gen(node.params[0], title);
        } else {
          title.innerHTML = titles[0];
        }
        container.appendChild(title);
        // contents
        let contents = document.createElement("div");
        this.genParagraphs(node, contents);
        contents.style.display = "none";
        container.appendChild(contents);
        // behavior
        let visible = false;
        title.addEventListener("click", () => {
          visible = !visible;
          title.innerHTML = titles[visible ? 1 : 0];
          contents.style.display = visible ? "block" : "none";
        });
        // spacing
        parent.appendChild(genSpan("<br/>"));
        break;
      }
      case "\\tabs*": {
        // TODO: add container around (similar to \\showhide)
        // TODO: add "expandable" icon before title text
        let tabs = [];
        let tab = null;
        for (let c of node.children) {
          if (c.id == "\\tab") {
            tab = new Tab();
            tabs.push(tab);
            if (c.children.length > 0) this.gen(c.children[0], tab.title);
          } else if (tab != null) {
            tab.texNodes.push(c);
          }
        }
        // titles and listeners
        let titlesDiv = document.createElement("div");
        titlesDiv.style.display = "flex";
        parent.appendChild(titlesDiv);
        for (tab of tabs) {
          titlesDiv.appendChild(tab.title);
          tab.createListeners(tabs);
        }
        // contents
        for (tab of tabs) {
          let tn = new TexNode("", -1, -1, false);
          tn.children = tab.texNodes;
          this.genParagraphs(tn, tab.div);
          parent.appendChild(tab.div);
        }
        // spacing
        parent.appendChild(genSpan("<br/>"));
        break;
      }
      case "\\tableofcontents": {
        this.currentAnchor.children[0].innerHTML = "Inhaltsverzeichnis";
        parent.appendChild(this.toc);
        break;
      }
      case "\\lang": {
        let id = node.children[0].getText();
        if (id === LANG) this.gen(node.children[1], parent);
        break;
      }
      case "\\href":
      case "\\link": {
        // TODO: add functionality for \\link
        if (node.children.length < 2) {
          parent.appendChild(genErrorSpan(" '" + node.id + "' SYNTAX ERROR "));
          return;
        }
        let target = node.children[0].getText();
        let text = node.children[1].getText();
        if (node.precedingWhiteSpacing) parent.appendChild(genSpan(" "));
        let span = genSpan(text);
        span.classList.add("link");
        parent.appendChild(span);
        if (node.id === "\\href") {
          span.addEventListener("click", () => {
            window.location.href = target;
          });
        }
        break;
      }
      case "\\lref": {
        // TODO: add functionality
        if (node.children.length < 2) {
          parent.appendChild(genErrorSpan(" '" + node.id + "' SYNTAX ERROR "));
          return;
        }
        let target = node.children[0].getText();
        let text = node.children[1].getText();
        if (node.precedingWhiteSpacing) parent.appendChild(genSpan(" "));
        let span = genSpan(text);
        span.classList.add("link");
        parent.appendChild(span);
        span.addEventListener("click", () => {
          if (target in this.labels) {
            this.labels[target].scrollIntoView(true);
          }
        });
        break;
      }
      case "\\ref": {
        if (node.precedingWhiteSpacing) parent.appendChild(genSpan(" "));
        // TODO: add functionality
        let text = "";
        if (node.children.length == 1) {
          // local ref
          let target = node.children[0].getText();
          text = "TODO";
        } else {
          // global ref
          if (node.params.length < 2 || node.children.length < 1) {
            parent.appendChild(
              genErrorSpan(" '" + node.id + "' SYNTAX ERROR ")
            );
            return;
          }
          let targetChapter = node.params[0].getText();
          text = node.params[1].getText();
          let targetPart = node.children[0].getText();
        }
        let span = genSpan(text);
        span.classList.add("link");
        parent.appendChild(span);
        break;
      }
      case "S$":
      case "$": {
        if (node.id === "S$") parent.appendChild(genSpan(" "));
        let s = node.children.map((c) => this.buildMathStr(c)).join(" ");
        parent.appendChild(genMathSpan(s));
        break;
      }
      case "$$":
      case "\\align":
      case "\\align*":
      case "\\eqnarray":
      case "\\eqnarray*":
      case "\\equation":
      case "\\equation*": {
        // TODO: show equation number, if required
        let s = node.children.map((c) => this.buildMathStr(c)).join(" ");
        if (node.id.startsWith("\\eqnarray"))
          s = "\\begin{darray}{rcl}" + s + "\\end{darray}";
        else if (node.id.startsWith("\\align"))
          s = "\\begin{align}" + s + "\\end{align}";
        parent.appendChild(genMathSpan(s, true));
        break;
      }
      case "\\glqq":
      case "\\grqq": {
        if (node.id === "\\glqq" && node.precedingWhiteSpacing)
          parent.appendChild(genSpan(" "));
        if (node.id === "\\glqq") parent.appendChild(genSpan("&ldquo;"));
        else parent.appendChild(genSpan("&rdquo;"));
        break;
      }
      case "\\emph":
      case "\\textit":
      case "\\textbf":
      case "\\strong":
      case "\\notion": {
        if (node.children.length < 1) {
          parent.appendChild(genErrorSpan(" '" + node.id + "' SYNTAX ERROR "));
          return;
        }
        let span = genSpan("");
        if (
          node.id === "\\textbf" ||
          node.id === "\\notion" ||
          node.id === "\\strong"
        )
          span.style.fontWeight = "bold";
        if (
          node.id === "\\emph" ||
          node.id === "\\textit" ||
          node.id === "\\notion"
        )
          span.style.fontStyle = "italic";
        parent.appendChild(span);
        if (node.precedingWhiteSpacing) span.appendChild(genSpan(" "));
        this.gen(node.children[0], span);
        break;
      }
      case "\\nowrap": {
        // TODO
        this.gen(node.children[0], parent);
        break;
      }
      case "\\floatright": {
        let text = node.children[0].getText();
        if (text.includes("stream24.net") || text.includes("video")) {
          // TODO: video
        } else parent.appendChild(genSpan("TODO:FLOATRIGHT"));
        break;
      }
      case "\\itemize":
      case "\\enumerate": {
        let enumType = "1";
        if (node.params.length > 0) {
          let options = node.params[0].getText(true);
          switch (options) {
            case "(a)":
            case "alph":
              enumType = "a";
              break;
          }
        }
        let kind = node.id === "\\itemize" ? "ul" : "ol";
        let list = null;
        switch (kind) {
          case "ul":
            list = document.createElement("ul");
            break;
          case "ol":
            list = document.createElement("ol");
            list.type = enumType;
            break;
        }
        parent.appendChild(list);
        let p = document.createElement("span");
        for (let c of node.children) {
          if (c.id === "\\item") {
            let li = document.createElement("li");
            if (enumType != "1") {
              // ... deactivate type, since "bullet" is explicitly given in src
              li.style.listStyleType = "none";
            }
            list.appendChild(li);
            p = document.createElement("p");
            li.appendChild(p);
          } else {
            this.gen(c, p);
          }
        }
        break;
      }
      case "\\label": {
        if (node.children.length < 1) {
          parent.appendChild(genErrorSpan(" '" + node.id + "' SYNTAX ERROR "));
          return;
        }
        let id = node.children[0].getText().trim();
        if (this.currentAnchor != null) this.labels[id] = this.currentAnchor;
        break;
      }
      case "\\image": {
        if (node.children.length < 1) {
          parent.appendChild(genErrorSpan(" '" + node.id + "' SYNTAX ERROR "));
          return;
        }
        let id = node.children[0].getText().trim();
        let img = document.createElement("img");
        img.src = "content/synth/tkz_" + id + ".svg";
        img.alt = "Error: IMAGE_NOT_FOUND";
        parent.appendChild(img);
        break;
      }
      default:
        let span = document.createElement("span");
        span.innerHTML = node.id;
        parent.appendChild(span);
        if (this.boxDepth == 0 && parent.nodeName == "P") {
          parent.style.paddingLeft = "3px";
        }
        if (node.id.startsWith("\\")) {
          span.style.color = "red";
          span.style.fontSize = "large";
          span.style.fontWeight = "bold";
        }
    }
  }

  /**
   * @param {TexNode} node
   * @returns {string}
   */
  buildMathStr(node) {
    // TODO: resolve \lang{..}{..}
    let param = node.id === "!PARAM";
    let s = "";
    if (node.explicitBeginEnd) s = "\\begin{" + node.id.substring(1) + "}";
    else s = param ? "{" : node.id;
    for (let c of node.children) s += this.buildMathStr(c);
    if (node.explicitBeginEnd) s += "\\end{" + node.id.substring(1) + "}";
    else if (node.id === "$") s += "$";
    else if (param) s += "}";
    return s;
  }
}

class Tab {
  constructor() {
    /** @type {TexNode[]} */
    this.texNodes = [];
    /** @type {HTMLDivElement} */
    this.title = document.createElement("div");
    this.title.classList.add("tabTitle");
    /** @type {HTMLDivElement} */
    this.div = document.createElement("div");
    this.div.style.overflowX = "scroll";
    this.div.style.display = "none";
    this.opened = false;
  }
  /**
   * @param {Tab[]} allTabs
   */
  createListeners(allTabs) {
    this.title.addEventListener("click", () => {
      for (let tab of allTabs) {
        if (tab != this) tab.opened = false;
        tab.div.style.display = "none";
        tab.title.classList.remove("tabTitleActive");
      }
      if (this.opened == false) {
        this.opened = true;
        this.div.style.display = "block";
        this.title.classList.add("tabTitleActive");
      } else {
        this.opened = false;
      }
    });
  }
}
