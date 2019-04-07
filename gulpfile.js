'use strict';

const gulp = require('gulp');
const path = require('path');
const connect = require('gulp-connect');

// start dev server
gulp.task('connect', function() {
    connect.server({
        root: './docs/',
        livereload: true,
        host: process.env.IP || 'localhost',
        port: process.env.PORT || 3030
    });
    return Promise.resolve();
});
// set live reload
gulp.task('html', function () {
    return gulp.src('./docs/content/**/*')
        .pipe(connect.reload());
});

// watch files for live reload
gulp.task('watch', function() {
    gulp.watch('./docs/content/**/*', gulp.series('html'));
    return Promise.resolve();
});
// serve dev server
gulp.task('serve', gulp.series('connect', 'watch'), function() {
    //
});
