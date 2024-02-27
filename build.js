import esbuild from "esbuild";

// build minified javascript file dist/hm4mint.min.js
esbuild.buildSync({
  platform: "browser",
  globalName: "hm4ever",
  minify: true,
  target: "",
  entryPoints: ["src/index.js"],
  bundle: true,
  outfile: "dist/hm4ever.min.js",
});
