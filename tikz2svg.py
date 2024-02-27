#!/usr/bin/env python3

# TODO: some SVG-files are too large (e.g. when "pattern" is used)

"""

This file translates TikZ-based *.tex files to *.svg files.

Required dependencies: pdflatex and pdf2svg

macOS: (using Homebrew https://brew.sh)
    brew install texlive pdf2svg

Debian:
    sudo apt install texlive pdf2svg

"""


import json, os, subprocess


base_src_paths = ["content/rwth/HM1/images/", "content/rwth/HM1/images/Icons/"]
base_src_path = ""
base_dst_path = "content/synth/"


def process(file: str):
    global base_src_path
    global base_dst_path

    in_path = os.path.join(base_src_path, file)

    f = open(in_path, "r")
    f_contents = f.read()
    f.close()

    f_contents = f_contents.replace("\n", "\\n")
    data = json.loads(f_contents)

    if "zxx" in data:
        print(f"===============================================")
        print(f"========== processing file {in_path} ==========")
        print(f"===============================================")

        tikZ = data["zxx"]

        # fix unimported libraries...
        if "pattern=" in tikZ and "\\usetikzlibrary{patterns}" not in tikZ:
            print(tikZ)
            tikZ = tikZ.replace(
                "\\begin{document}", "\\usetikzlibrary{patterns}\n\\begin{document}"
            )
            print(tikZ)

        # fix too many samples (reduces file size + prohibits pdflatex crashes..)
        tikZ = tikZ.replace("samples=75", "samples=20")

        # fix syntax errors
        tikZ = tikZ.replace(
            "\\tkzDrawCircle[R,very thick](M,0.795775 cm)",
            "\\tkzDrawCircle[very thick](M,P)",
        )
        tikZ = tikZ.replace("\\tkzLabelXY[orig,step=2]", "%\\tkzLabelXY[orig,step=2]")
        tikZ = tikZ.replace("\\tkzLabelXY[orig,]", "%\\tkzLabelXY[orig,]")

        # write file to base_dst_path
        file = file.replace(".src.tex", ".tex")
        out_path_tex = file
        out_path_pdf = out_path_tex.replace(".tex", ".pdf")
        out_path_svg = out_path_tex.replace(".tex", ".svg")
        f = open(os.path.join(base_dst_path, out_path_tex), "w")
        f.write(tikZ)
        f.close()

        # translate *.tex -> *.pdf
        rc = subprocess.run(
            ["pdflatex", "-interaction=batchmode", "-halt-on-error", out_path_tex],
            cwd=base_dst_path,
        ).returncode
        if rc < 0:
            print("ERROR running pdflatex with file " + out_path_tex)

        # translate *.pdf -> *.svg (try this, even if pdflatex returns a failure...)
        subprocess.run(
            [
                "pdf2svg",
                out_path_pdf,
                out_path_svg,
            ],
            cwd=base_dst_path,
        )


if __name__ == "__main__":

    if not os.path.exists(base_dst_path):
        os.mkdir(base_dst_path)

    for p in base_src_paths:
        base_src_path = p

        files = []
        for file in os.listdir(base_src_path):
            if file.endswith(".src.tex"):
                files.append(file)
        print(f"NUMBER OF FILES: {len(files)}")

        # process
        for file in files:
            process(file)

        # gather failed files
        cnt = 0
        for file in files:
            path = os.path.join(base_dst_path, file.replace(".src.tex", ".svg"))
            if os.path.exists(path):
                cnt += 1
            else:
                print("FILE " + file + " FAILED TO PROCESS!")
        print(f"SUCCESS: {cnt} out of {len(files)} files")

        # delete everything but *.tex and *.svg
        for file in os.listdir(base_dst_path):
            if file.endswith(".log") or file.endswith(".aux") or file.endswith(".pdf"):
                out_path_tex = os.path.join(base_dst_path, file)
                os.remove(out_path_tex)
