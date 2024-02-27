# hm4ever

This project provides an instance of the [https://hm4mint.nrw](https://hm4mint.nrw) course for higher math, with **Free and Open-Source Software (FOSS)**.

- This work is INDEPENDENT from the official course in any way.

- The intention is the LONG-TERM ARCHIVING of the course.

- I would like to secure the investments made possible by taxpayers in the extra long term; independently from current funding of the official website and support (overall development costs of the contents: multi million EUR).

There are limitations, so students should work with the original project instance:

- This implementation does NOT support to save students progress.

- There is NO way to achieve credit points by completing exercises.

- There is NO way to integrate this instance of the course into e-learning management systems (LMS).

- There is NO support and NO liability to the reader.

- There is NO guarantee that the contents from the original course materials is emulated without errors.

# LICENSE OF HM4MINT.NRW CONTENTS

The Contents of directory `content/` and all subdirectories is licensed under CC BY-SA 4.0

Refer to the project websites for more information:

- https://www.orca.nrw/kurse/hm4mint

- https://hm4mint.nrw/hm1/public/impressum.html ("Lizenz")

Read the license text in file LICENSE of this directory.

## Funding of the original project

- This project only provides the contents of the original project, which is explicitly permitted under the license of CC BA-SA 4.0. There is NO endorsement for this project from side of the sponsors of the original project.

- The original project was funded by "Bundesministerium für Bildung in Forschung", "Ministerium für Kultur und Wissenschaft des Landes Nordrhein-Westfalen", "Digitale Hochschule NRW", "Deutscher Akademischer Austauschdienst" (all located in Germany).

## Links to the CC BY-SA 4.0 License:

- https://creativecommons.org/licenses/by-sa/4.0/

- https://creativecommons.org/licenses/by-sa/4.0/legalcode.txt

## Summary of the CC BY-SA 4.0 License:

### You are free to:

- **Share** — copy and redistribute the material in any medium or format for any purpose, even commercially.

- **Adapt** — remix, transform, and build upon the material for any purpose, even commercially.
  The licensor cannot revoke these freedoms as long as you follow the license terms.

### Under the following terms:

- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.

- **ShareAlike** — If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.

- **No additional restrictions** — You may not apply legal terms or technological measures that legally restrict others from doing anything the license permits.

# CHANGES MADE HERE

- All contents and material from `hm4mint` is UNALTERED and presented AS-IS.
  The differences in the representation on the website only result from using free software, instead of the proprietary MUMIE software from integral-learning GmbH.

- Refer to file `README.md` in directory `content/` for more information.

# DEV INFO

Dependencies: `node.js`, `npm` and optionally `pdflatex`+`pdf2svg` in case that the images have to be rebuilt.

- The implementation of `emummy` (lexical blend EMUlator + MUMMY) is located in directory `src/`.

- Run `python3 build.py` to update `index.html`. Do NOT alter `index.html`, since it is automatically created from `index-dev.html`.

- Testing can be done via `python3 -m http.server 8000` (or another port than `8000`). Then visit `localhost:8000/index-dev.html` in your local browser. Any changes in directory `src/` are directly visible, since these JavaScript files are includes as module.

- If variable `debug` in file `src/index.js` is set to `true`, then the contents of file `test/tmp.tex` are rendered (and the index is hidden).

- The following scripts are provided, to populate files in directory `content/synth/`:

  - `make_tree.py` generates `content/synth/tree.js`, using data located in directory `content/rwth/HM1/`

  - `tikz2svg.py` generates vector image files `content/synth/*.svg`, using data located in directory `content/rwth/HM1/`.
