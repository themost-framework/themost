/*eslint no-var: "off"*/
var gulp = require('gulp');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var eslint = require('gulp-eslint');
var typedoc = require('gulp-typedoc');
const child_process = require('child_process');


var testModule = [
  'test/**/*.es6'
];

var libModule = [
  'modules/@themost/common/**/*.js',
    '!modules/@themost/common/node_modules/**/*.js',
    'modules/@themost/data/**/*.js',
    '!modules/@themost/data/node_modules/**/*.js',
    'modules/@themost/query/**/*.js',
    '!modules/@themost/query/node_modules/**/*.js',
    'modules/@themost/xml/**/*.js',
    '!modules/@themost/xml/node_modules/**/*.js',
    'modules/@themost/web/**/*.js',
    '!modules/@themost/web/node_modules/**/*.js'
];

var testServerScript = 'test/app/server.js';

function lint(files, options) {
  return function() {
    return gulp.src(files)
      .pipe(eslint(options))
      .pipe(eslint.format())
  };
}

function build(files) {
  return function () {
    return gulp.src(files)
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

// test
gulp.task('build:test',build(testModule));
//lint test
gulp.task('lint:test', lint(testModule));

gulp.task('watch:test', ['build:test'], function () {
  var files = [].concat(testModule);
    //watch for server module changes
  gulp.watch(files, function(file) {
    gutil.log(gutil.colors.green('Compiling ' + file.path));
    return build(file.path)();
  });
});

gulp.task('serve:test', ['build:test'], function() {
    var server, options, execArgv = [];
    //get debug argument
    const debug = process.execArgv.filter(function(x) { return /^--debug(-brk)?=\d+$/.test(x); })[0];
    //if process is running in debug mode (--debug or --debug-brk arguments)
    if (debug) {
        //find debug port
        const debugPort = parseInt(/^--debug(-brk)?=(\d+)$/.exec(debug)[2]);
        //get execution arguments except --debug or --debug-brk
        execArgv = process.execArgv.filter(function(x) { return !/^--debug(-brk)?=\d+$/.test(x); }).splice(0);
        //push debug argument (while increasing debug port by 1)
        execArgv.push(debug.substr(0,debug.indexOf('=')+1)+(debugPort+1));
    }
    else {
        //otherwise get execution arguments
        execArgv = process.execArgv.splice(0);
    }
    //build child process options
    options = {
        //get parent process env variables
        env:process.env,
        //get execution arguments
        execArgv:execArgv
    };
    //start child process (an express application)
    server = child_process.fork(testServerScript,options);
    //watch for server module changes
    var watchFiles = [].concat(testModule,libModule);
    return gulp.watch(watchFiles, function() {

        function buildTestAndStartProcess() {
            return gulp.run('build:test', function() {
                //start child process (express application)
                try {
                    server = child_process.fork(testServerScript,options);
                }
                catch(err) {
                    gutil.log('An error occurred while starting child process');
                    gutil.log(err);
                    server = null;
                }
            });
        }

        //wait for process to exit
        if (typeof server === 'undefined' || server == null) {
            return buildTestAndStartProcess();
        }
        server.on('exit', function() {
            //build server
            return buildTestAndStartProcess();
        });
        //kill child process and wait to build server again
        server.kill("SIGINT");
    });
});

gulp.task("typedoc", function() {
    return gulp
        .src(["modules/@themost/common/*.ts"])
        .pipe(typedoc({
            module: "commonjs",
            theme: "node_modules/typedoc-clarity-theme/bin",
            target: "es5",
            out: "docs/",
            name: "MOST Web Framework",
            includeDeclarations: true,
            excludeExternals: true,
            hideGenerator: true
        }))
        ;
});

gulp.task('default', function() {
  gulp.start('build:test');
});