#!/usr/bin/env python3

"""
hm4ever  an open-source based instance of the HM4MINT.nrw course
AUTHOR:  Andreas Schwenk <mailto:contact@compiler-construction.com>
LICENSE: GPLv3

This script is only intended for development. 
"""


import subprocess


if __name__ == "__main__":
    print("hm4ever builder - 2024 by Andreas Schwenk")
    # build web
    try:
        # install web dependencies
        res = subprocess.run(["npm", "install"], cwd=".")
        # build web
        res = subprocess.run(["node", "build.js"], cwd=".")
    except Exception as e:
        print(e)
        print("hm4ever dependencies: npm+nodejs")
        print("          https://www.npmjs.com, https://nodejs.org/")
        print("          https://nodejs.org/en/download/package-manager")
        print("[Debian]  sudo apt install nodejs npm")
        print("[macOS]   brew install node")
    # build "index.html" using "index-dev.html"
    f = open("index-dev.html", "r")
    index_html_lines = f.readlines()
    f.close()
    f = open("dist/hm4ever.min.js", "r")
    js = f.read().strip()
    f.close()
    # remove code between @begin(test) and @end(test)
    html = ""
    skip = False
    for line in index_html_lines:
        if "@begin(test)" in line:
            skip = True
        elif "@end(test)" in line:
            skip = False
        elif skip is False:
            html += line
    # remove white spaces
    html = html.replace("  ", "").replace("\n", " ")
    # insert javascript code
    html = html.replace(
        "</body>",
        "<script>" + js + "</script></body>",
    )
    # write new version of sell.py
    f = open("index.html", "w")
    f.write(html.strip() + "\n")
