const gulp = require("gulp");
const fileinclude = require("gulp-file-include");
const browserify = require("browserify");
const buffer = require("vinyl-buffer");
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const notify = require("gulp-notify");
const source = require("vinyl-source-stream");

const app = "./app/";
const dist = "./dist/";

// Error / Success Handling
let onError = function(err) {
  notify.onError({
    title: "Error: " + err.plugin,
    subtitle: "<%= file.relative %>",
    message: "<%= error.message %>",
    sound: "Beep",
    icon: app + "images/icons/icon48.png"
  })(err);
  console.log(err.toString());
  this.emit("end");
};

function onSuccess(msg) {
  return {
    message: msg + " Complete! ",
    //sound:     "Pop",
    icon: app + "images/icons/icon48.png",
    onLast: true
  };
}

// HTML / TPL Pages
let htmlFiles = app + "layouts/*.html";
let includeFiles = app + "includes/*.html";

gulp.task("html", function(done) {
  return gulp
    .src(htmlFiles)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(fileinclude({ prefix: "@@", basepath: "@file" }))
    .pipe(gulp.dest(dist))
    .pipe(notify(onSuccess("HTML")));
});


// js: Browserify
let js_folder = "scripts/";
let js_srcFile = app + js_folder + "main.js";
let js_destFolder = dist + "js/";
let js_destFile = "helios-wallet-master.js";

function bundle_js(bundler) {
  return bundler
    .bundle()
    .pipe(plumber({ errorHandler: onError }))
    .pipe(source("main.js"))
    .pipe(buffer())
    .pipe(rename(js_destFile))
    .pipe(gulp.dest(js_destFolder))
    .pipe(notify(onSuccess("JS")));
}


gulp.task("js", function() {
  let bundler = browserify(js_srcFile)
  bundle_js(bundler);
});


// Copy
let imgSrcFolder = app + "images/**/*";
let jsonFile = app + "*.json";
let jsStaticFolder = app + js_folder + "static/*";
let cssFolder = app + "css/*";
let readMe = "./README.rst";

gulp.task("copy", function() {
  gulp
    .src(imgSrcFolder)
    .pipe(gulp.dest(dist + "images"))

  gulp
    .src(jsStaticFolder)
    .pipe(gulp.dest(dist + "js"))

  gulp
    .src(cssFolder)
    .pipe(gulp.dest(dist + "css"))

  gulp
    .src(jsonFile)
    .pipe(gulp.dest(dist))

  return gulp
      .src(readMe)
      .pipe(gulp.dest(dist))
      .pipe(notify(onSuccess(" Copy ")));
});


gulp.task("watchJS", function() {
  gulp.watch(js_srcFile, gulp.series("js"));
});
gulp.task("watchHtml", function() {
  gulp.watch(htmlFiles, gulp.series("html"));
});
gulp.task("watchIncludes", function() {
  gulp.watch(includeFiles, gulp.series("html"));
});
gulp.task("watchImages", function() {
  gulp.watch(imgSrcFolder, gulp.series("copy"));
});
gulp.task("watchCss", function() {
  gulp.watch(cssFolder, gulp.series("copy"));
});
gulp.task("watchStaticJS", function() {
  gulp.watch(jsStaticFolder, gulp.series("copy"));
});

gulp.task("watch", gulp.parallel(
  "watchJS",
  "watchHtml",
  "watchIncludes",
  "watchImages",
  "watchCss",
  "watchStaticJS"
));

// gulp.task("build", ["js", "html"]);
//
gulp.task('default',gulp.parallel("html", "js", "copy"));