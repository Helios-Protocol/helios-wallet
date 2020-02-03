var gulp = require( 'gulp' );
var rename = require( 'gulp-rename' );
const browserify = require("browserify");
const plumber = require("gulp-plumber");
const buffer = require("vinyl-buffer");
const notify = require("gulp-notify");
const source = require("vinyl-source-stream");
var web_main = require("helios-web3");
var styleSRC = './src/scss/style.css';
var styleDIST = './dist/css/';

var jsSRC = './src/js/script.js';
var jsDIST = './dist/js/';

gulp.task('style',function(){
   gulp.src( styleSRC )
   .pipe( rename( { suffix: '.min' } ))
   .pipe( gulp.dest( styleDIST ));
});

let onError = function(err) {
    notify.onError({
      title: "Error: " + err.plugin,
      subtitle: "<%= file.relative %>",
      message: "<%= error.message %>",
      sound: "Beep",
      icon: "images/icons/icon48.png"
    })(err);
    //console.log(err.toString());
    this.emit("end");
  };
function onSuccess(msg) {
    return {
      message: msg + " Complete! ",
      //sound:     "Pop",
      icon: "images/icons/icon48.png",
      onLast: true
    };
  }


let jsFolder = "src/js/";
let js_srcFile = jsFolder + "main.js";
let js_destFolder = "dist/js/";
let js_destFile = "script.js";

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
  return bundle_js(bundler);
});
gulp.task('default',gulp.parallel("style","js"));

// gulp.task('server', ['build'], function(){
//     browser.init({server: './_site', port: port});
// });