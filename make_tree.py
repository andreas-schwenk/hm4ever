#!/usr/bin/env python3

"""
This script generates file "content/synth/tree.json"
"""

import glob, os, json


INPUT_PATH = "content/rwth/HM1/"

parts = [
    {
        "title": "Teil 1 &mdash; Grundlagen",
        "file_pattern": "T1*/",
    },
    {
        "title": "Teil 2 &mdash; Folgen, Reihen, stetige Funkionen",
        "file_pattern": "T2*/",
    },
    {
        "title": "Teil 3a &mdash; Differentiation, Integration, Determinante",
        "file_pattern": "T1*/",
    },
    {
        "title": "Teil 3b &mdash; Lineare Gleichungssysteme, Eigenwerte, Eigenvektoren",
        "file_pattern": "T4*/",
    },
    {
        "title": "Teil 4 &mdash; Mehrdimensionale Analysis",
        "file_pattern": "T5*/",
    },
]

output = {"parts": []}

for part in parts:
    print("=====================================")
    print("========== processing part ==========")
    print("=====================================")
    title = part["title"]
    print("TITLE = " + title)
    output["parts"].append({"title": title, "chapters": []})
    dirs = sorted(list(glob.glob(INPUT_PATH + part["file_pattern"])))
    for dir in dirs:
        if not os.path.exists(dir + ".meta.xml"):
            continue
        chapter_title = ""
        print(f"===== processing chapter {dir} =====")
        # read chapter name from overview file
        files = sorted(list(glob.glob(dir + "art_*overview*.tex")))
        if len(files) > 0:
            f = open(files[0], "r", encoding="utf8")
            tex_lines = f.readlines()
            f.close()
            for line in tex_lines:
                if "lang{de}" in line:
                    title = line.replace("\\lang{de}{", "").replace("}", "")
                    chapter_title = title.replace("Überblick:", "").strip()
                    break
        # append chapter to output
        output["parts"][-1]["chapters"].append(
            {
                "title": chapter_title,
                "path": dir,
                "overview": "TODO",
                "lectures": [],
                "examples": [],
                "trainings": [],
            }
        )
        # populate lectures, examples, trainings
        for k in range(0, 3):
            files = []
            if k == 0:  # lectures
                files = sorted(list(glob.glob(dir + "art_*.tex")))
            elif k == 1:  # examples
                files = sorted(list(glob.glob(dir + "exe*/*.tex")))
            elif k == 2:  # trainings
                files = sorted(list(glob.glob(dir + "train*/*.tex")))
            for file in files:
                if "overview" in file:
                    continue
                title = "NA"
                # read title
                f = open(file, "r", encoding="utf8")
                tex_lines = f.readlines()
                f.close()
                for line in tex_lines:
                    if "lang{de}" in line:
                        title = line.replace("\\lang{de}{", "").replace("}", "").strip()
                        break
                # append lecture to output
                key = ["lectures", "examples", "trainings"][k]
                output["parts"][-1]["chapters"][-1][key].append(
                    {"title": title, "path": file}
                )
        # populate examples

        # populate trainings

        bp = 1337


output_json = json.dumps(output, indent=2)

print(output_json)

f = open("content/synth/tree.json", "w")
f.write(output_json)
f.close()
