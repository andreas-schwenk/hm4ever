#!/usr/bin/env python3

# TODO: some SVG-files are too large (e.g. when "pattern" is used)

"""

This file translates TikZ-based *.tex files to *.svg files.

Required dependencies:         pdflatex, pdf2svg, imagemagick
Required Python3 dependency:   pillow

macOS: (using Homebrew https://brew.sh)
    brew install texlive pdf2svg imagemagick
    pip3 install pillow

Debian:
    sudo apt install texlive pdf2svg libpng-dev libjpeg-dev libtiff-dev imagemagick
    pip3 install pillow

"""


import json, os, subprocess
from PIL import Image

base_src_path_list = ["content/rwth/HM1/images/", "content/rwth/HM1/images/Icons/"]
base_dst_path = "content/synth/"


if __name__ == "__main__":

    if not os.path.exists(base_dst_path):
        os.mkdir(base_dst_path)

    for base_src_path in base_src_path_list:
        files = []
        for file in os.listdir(base_src_path):
            if file.endswith(".src.tex"):
                files.append(file)
        print(f"NUMBER OF FILES: {len(files)}")

        # process
        for file in files:

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
                    tikZ = tikZ.replace(
                        "\\begin{document}",
                        "\\usetikzlibrary{patterns}\n\\begin{document}",
                    )

                # fix too many samples (reduces file size + prohibits pdflatex crashes..)
                tikZ = tikZ.replace("samples=75", "samples=20")

                # fix syntax errors
                tikZ = tikZ.replace(
                    "\\tkzDrawCircle[R,very thick](M,0.795775 cm)",
                    "\\tkzDrawCircle[very thick](M,P)",
                )
                tikZ = tikZ.replace(
                    "\\tkzLabelXY[orig,step=2]", "%\\tkzLabelXY[orig,step=2]"
                )
                tikZ = tikZ.replace("\\tkzLabelXY[orig,]", "%\\tkzLabelXY[orig,]")

                # write file to base_dst_path
                file = file.replace(".src.tex", ".tex")
                out_path_tex = file
                out_path_pdf = out_path_tex.replace(".tex", ".pdf")
                out_path_svg = out_path_tex.replace(".tex", ".svg")
                out_path_png = out_path_tex.replace(".tex", ".png")  # only temporary
                out_path_base64 = out_path_tex.replace(
                    ".tex", ".base64"
                )  # only temporary
                f = open(os.path.join(base_dst_path, out_path_tex), "w")
                f.write(tikZ)
                f.close()

                # translate *.tex -> *.pdf
                rc = subprocess.run(
                    [
                        "pdflatex",
                        "-interaction=batchmode",
                        "-halt-on-error",
                        out_path_tex,
                    ],
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
                # Template that embeds an PNG raster image into an SVG image.
                # Requirement: In some cases (e.g. when using "pattern" in TikZ) pdf2svg will
                # produce very large output files. Then we try to convert PDF to PNG; if the
                # PNG file demands less space, we use the SVG-PNG-template.
                # (We could also embed PNG files into the course, but then we had to store
                #  somewhere, which HTML <image ...> tags have to load *.svg and which have
                #  to load *.png)
                svg_png_template = """<?xml version="1.0" encoding="UTF-8"?>
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="$WIDTH" height="$HEIGHT" viewBox="0 0 $WIDTH $HEIGHT">
                    <image width="$WIDTH" height="$HEIGHT" xlink:href="data:image/png;base64,$DATA"/>
                </svg>
                """
                # If the generated file is > 150 kb, then convert image with ImageMagick
                # to a *.png file and embed its data into an SVG image (only in case it
                # is smaller...)
                if os.stat(os.path.join(base_dst_path, out_path_svg)).st_size > 150000:
                    subprocess.run(
                        [
                            "convert",
                            "-density",
                            "300",
                            "-quality",
                            "90",
                            out_path_pdf,
                            out_path_png,
                        ],
                        cwd=base_dst_path,
                    )
                    if (
                        os.stat(os.path.join(base_dst_path, out_path_png)).st_size
                        < os.stat(os.path.join(base_dst_path, out_path_svg)).st_size
                    ):
                        subprocess.run(
                            ["base64", "-i", out_path_png, "-o", out_path_base64],
                            cwd=base_dst_path,
                        )
                        f = open(os.path.join(base_dst_path, out_path_base64), "r")
                        base64 = f.read()
                        f.close()
                        # get image size
                        im = Image.open(os.path.join(base_dst_path, out_path_png))
                        width = im.size[0]
                        height = im.size[1]
                        svg = (
                            svg_png_template.replace("$DATA", base64)
                            .replace("$WIDTH", str(width))
                            .replace("$HEIGHT", str(height))
                        )
                        f = open(os.path.join(base_dst_path, out_path_svg), "w")
                        f.write(svg)
                        f.close()

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
        if (
            file.endswith(".log")
            or file.endswith(".aux")
            or file.endswith(".pdf")
            or file.endswith(".base64")
            or file.endswith(".png")
            or file.endswith(".gz")
        ):
            out_path_tex = os.path.join(base_dst_path, file)
            os.remove(out_path_tex)
