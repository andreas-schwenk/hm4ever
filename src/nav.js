/**
 * hm4ever  an open-source based instance of the HM4MINT.nrw course
 * AUTHOR:  Andreas Schwenk <mailto:contact@compiler-construction.com>
 * LICENSE: GPLv3
 */

/**
 * This file implements the navigation views (index and for current chapter)
 */

import { activeIndices, setState, show_chapter, tree } from "./index.js";

/**
 * shows the global navigation, i.e. parts and course selection
 */
export function createGlobalNavigation() {
  let index = document.getElementById("index");
  for (let partIdx = 0; partIdx < tree.parts.length; partIdx++) {
    let part = tree.parts[partIdx];
    let partContainer = document.createElement("div");
    index.appendChild(partContainer);
    partContainer.classList.add("indexPartContainer");
    partContainer.innerHTML = part.title;
    let chaptersContainer = document.createElement("div");
    index.appendChild(chaptersContainer);
    chaptersContainer.classList.add("indexContainer");
    for (let chapterIdx = 0; chapterIdx < part.chapters.length; chapterIdx++) {
      let chapter = part.chapters[chapterIdx];
      let box = document.createElement("div");
      chaptersContainer.appendChild(box);
      box.classList.add("indexChapterBox");
      let title = document.createElement("div");
      box.appendChild(title);
      title.classList.add("indexChapterTitle");
      title.innerHTML = "" + (chapterIdx + 1) + ". " + chapter.title;
      let img = document.createElement("img");
      box.appendChild(img);
      img.classList.add("indexChapterIcon");
      let path = chapter.path
        .substring("content/rwth/HM1/".length)
        .substring(0, 4);
      path = "content/synth/tkz_Icon_" + path + ".svg";
      img.src = path;
      box.addEventListener("click", () => {
        activeIndices.part = partIdx;
        activeIndices.chapter = chapterIdx;
        setState(false);
      });
    }
  }
}

// active visibility:  0 := lectures,  1 := exercises,  2 := trainings
let unfoldedSectionIdx = 0;

/**
 * shows the navigation of the current active chapter
 */
export function createChapterNavigation() {
  let part = tree.parts[activeIndices.part];
  let chapter = part.chapters[activeIndices.chapter];

  let navigation = document.getElementById("navigation");
  navigation.innerHTML = "";

  let partDiv = document.createElement("div");
  navigation.appendChild(partDiv);
  partDiv.classList.add("navPart");
  partDiv.innerHTML = part.title;

  let chapterDiv = document.createElement("div");
  navigation.appendChild(chapterDiv);
  chapterDiv.classList.add("navChapter");
  chapterDiv.innerHTML =
    "" + (activeIndices.chapter + 1) + "&nbsp" + chapter.title;

  let linkDivs = [];
  let listDivs = [];

  let sectionIDs = ["Vorlesung", "Beispiele", "Trainingsaufgaben"];
  for (let k = 0; k < sectionIDs.length; k++) {
    let sectionID = sectionIDs[k];
    let sectionTitleDiv = document.createElement("div");
    sectionTitleDiv.classList.add("navSectionTitle");
    navigation.appendChild(sectionTitleDiv);
    sectionTitleDiv.innerHTML = sectionID;

    let listDiv = document.createElement("div");
    navigation.appendChild(listDiv);
    listDivs.push(listDiv);
    listDiv.style.display = k == unfoldedSectionIdx ? "block" : "none";

    let sectionLinkDivs = [];

    sectionTitleDiv.addEventListener("click", () => {
      if (unfoldedSectionIdx != k) sectionLinkDivs[0].click();
      unfoldedSectionIdx = k;
      for (let l = 0; l < sectionIDs.length; l++)
        listDivs[l].style.display = l == unfoldedSectionIdx ? "block" : "none";
    });

    let items = [];
    switch (k) {
      case 0:
        items = chapter.lectures;
        break;
      case 1:
        items = chapter.examples;
        break;
      case 2:
        items = chapter.trainings;
        break;
    }
    if (items == undefined) continue;
    for (let i = 0; i < items.length; i++) {
      let lecture = items[i];
      let lectureDiv = document.createElement("div");
      linkDivs.push(lectureDiv);
      sectionLinkDivs.push(lectureDiv);
      listDiv.appendChild(lectureDiv);
      lectureDiv.classList.add("navLecture");
      let html =
        '<div style="min-width: 30px">' +
        (k == 0 ? activeIndices.chapter + 1 + "." : "") +
        (i + 1) +
        " &nbsp;</div>";
      html += lecture.title;
      lectureDiv.innerHTML = html;

      lectureDiv.addEventListener("click", () => {
        activeIndices.subchapter = i;
        for (let ld of linkDivs) ld.classList.remove("navLectureSelected");
        lectureDiv.classList.add("navLectureSelected");
        let path = lecture.path;
        fetch(path + "?v=" + Date.now())
          .then((x) => x.text())
          .then((src) => {
            show_chapter(src);
          });
      });
    }
  }
  // show first lecture
  linkDivs[0].click();
}
