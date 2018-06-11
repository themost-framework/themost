/*eslint no-var: "off"*/
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var eslint = require('gulp-eslint');
var child_process = require('child_process');
var options = require('./.themost-cli.json');
var path = require('path');

//server source directory
var buildDir = options.out;
//server source directory
var serverDir = options.base;
//server startup script
var serverScript = path.resolve(serverDir, "server.js");

// lint server modules
gulp.task('lint', () => {
    return gulp.src(`${serverDir}/**/*.js`)
        .pipe(eslint())
        .pipe(eslint.format());
});
// copy server files
gulp.task('copy', ()=> {
    return gulp.src([`${serverDir}/**/*`, `!${serverDir}/**/*.js`])
        .pipe(gulp.dest(buildDir))
});

// build server modules
gulp.task('build', ['lint', 'copy'], () => {
    return gulp.src(`${serverDir}/**/*.js`)
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(buildDir));
});

// serve app
gulp.task('serve', [], function() {
    let server, options, execArgv = [];
    //get debug argument
    const debug = process.execArgv.filter(function(x) { return /^--inspect(-brk)?=\d+$/.test(x); })[0];
    //if process is running in debug mode (--debug or --debug-brk arguments)
    if (debug) {
        //find debug port
        const debugPort = parseInt(/^--inspect(-brk)?=(\d+)$/.exec(debug)[2]);
        //get execution arguments except --debug or --debug-brk
        execArgv = process.execArgv.filter(function(x) { return !/^--inspect(-brk)?=\d+$/.test(x); }).splice(0);
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
    //push babel-core/register arguments
    if (execArgv.indexOf('babel-core/register')<0) {
        execArgv.push('--require');
        execArgv.push('babel-core/register');
    }
    //start child process (an express application)
    server = child_process.fork(serverScript,options);
    //watch for server module changes
    return gulp.watch(`${serverDir}/**/*`, function() {
        //wait for process to exit
        server.on('exit', function() {
            server = child_process.fork(serverScript,options);
        });
        //kill child process and wait to build server again
        server.kill("SIGINT");
    });
});