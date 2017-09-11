/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
/**
 * @param {*} grunt
 */
module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);
    grunt.initConfig({
        babel: {
            test: {
                files: [{
                    "expand": true,
                    "cwd":"",
                    "src": ["test/**/*.es6"],
                    "dest": "",
                    "ext": ".js"
                }]
            }
        },
        watch: {
            test: {
                files: ["test/**/*.es6"],
                tasks: ["newer:babel:test"],
                options: {
                    spawn: false
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-newer');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', ['babel']);
    grunt.registerTask('build', ['babel']);
    grunt.registerTask('build:test', ['babel','watch']);
};