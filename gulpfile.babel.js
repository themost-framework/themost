/*eslint no-var: "off"*/
var gulp = require('gulp');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var duration = require('gulp-duration');
var eslint = require('gulp-eslint');

var commonModule = [
  'modules/@themost/common/**/*.es6',
  '!modules/@themost/common/node_modules/**/*.es6'
];
var queryModule = [
  'modules/@themost/query/**/*.es6',
  '!modules/@themost/query/node_modules/**/*.es6'
];
var dataModule = [
  'modules/@themost/data/**/*.es6',
  '!modules/@themost/data/node_modules/**/*.es6'
];
var webModule = [
  'modules/@themost/web/**/*.es6',
  '!modules/@themost/web/node_modules/**/*.es6'
];
var testModule = [
  'test/**/*.es6'
];

function lint(files, options) {
  return function() {
    return gulp.src(files)
      .pipe(eslint(options))
      .pipe(eslint.format())
  };
}

function build(files) {
  return function () {

      var bundleTimer = duration('bundle time');

    return gulp.src(files)
       // .once('data', bundleTimer.start)
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(sourcemaps.init())
      .pipe(babel())
      .pipe(sourcemaps.write('.'))
      //  .pipe(bundleTimer)
      .pipe(gulp.dest(function (file) {
        return file.base;
      }));
  }
}

// @themost/common
gulp.task('build:common',build(commonModule));

// @themost/query
gulp.task('build:query',build(queryModule));

// @themost/data
gulp.task('build:data',build(dataModule));

// @themost/web
gulp.task('build:web',build(webModule));

// test
gulp.task('build:test',build(testModule));

//lint @themost/common
gulp.task('lint:common', lint(commonModule));

//lint @themost/query
gulp.task('lint:query', lint(queryModule));

//lint @themost/data
gulp.task('lint:data', lint(dataModule));

//lint @themost/web
gulp.task('lint:web', lint(webModule));

// lint @themost
gulp.task('lint', ['lint:common','lint:query', 'lint:data', 'lint:web']);

gulp.task('build', ['build:common','build:query','build:data','build:web']);

gulp.task('debug', ['build'], function () {
  var files = commonModule.concat(queryModule,dataModule,webModule,testModule);
  gulp.watch(files, function(file) {
    gutil.log(gutil.colors.green('Compiling ' + file.path));
    return build(file.path)();
  });
});

gulp.task('default', ['clean'], function() {
  gulp.start('build');
});