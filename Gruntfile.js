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
            common: {
                files: [{
                    "expand": true,
                    "cwd":"modules/@themost/common",
                    "src": ["**/*.es6","!node_modules/**/*.es6"],
                    "dest": "modules/@themost/common",
                    "ext": ".js"
                }]
            },
            web: {
                files: [{
                    "expand": true,
                    "cwd":"modules/@themost/web",
                    "src": ["lib/*.es6","index.es6"],
                    "dest": "modules/@themost/web",
                    "ext": ".js"
                }]
            },
            test: {
                files: [{
                    "expand": true,
                    "cwd":"",
                    "src": ["test/**/*.es6", "test-app/**/*.es6"],
                    "dest": "",
                    "ext": ".js"
                }]
            }
        },
        watch: {
            common: {
                files: ["modules/@themost/common/*.es6"],
                tasks: ["babel:common"],
                options: {
                    spawn: false,
                },
            },
            web: {
                files: ["modules/@themost/web/lib/*.es6","modules/@themost/web/index.es6"],
                tasks: ["newer:babel:web"],
                options: {
                    spawn: false,
                },
            },
        },
    });
    grunt.loadNpmTasks('grunt-newer');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', ['babel']);
};