/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
/**
 * @param {*} grunt
 */

var webFiles = [
    "!node_modules/**/*.es6",
    "angular/*.es6",
    "consumers/*.es6",
    "controllers/*.es6",
    "engines/*.es6",
    "*.es6"
];


module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);
    grunt.initConfig({
        babel: {
            common: {
                files: [{
                    "expand": true,
                    "cwd":"modules/@themost/common",
                    "src": [
                        "!node_modules/**/*.es6",
                        "*.es6"
                    ],
                    "dest": "modules/@themost/common",
                    "ext": ".js"
                }]
            },
            query: {
                files: [{
                    "expand": true,
                    "cwd":"modules/@themost/query",
                    "src": ["**/*.es6","!node_modules/**/*.es6"],
                    "dest": "modules/@themost/query",
                    "ext": ".js"
                }]
            },
            data: {
                files: [{
                    "expand": true,
                    "cwd":"modules/@themost/data",
                    "src": ["**/*.es6","!node_modules/**/*.es6"],
                    "dest": "modules/@themost/data",
                    "ext": ".js"
                }]
            },
            web: {
                files: [{
                    "expand": true,
                    "cwd":"modules/@themost/web",
                    "src": [
                        "!node_modules/**/*.es6",
                        "angular/*.es6",
                        "consumers/*.es6",
                        "controllers/*.es6",
                        "engines/*.es6",
                        "*.es6"
                    ],
                    "dest": "modules/@themost/web",
                    "ext": ".js"
                }]
            },
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
            common: {
                files: [
                    "!node_modules/**/*.es6",
                    "*.es6"
                ],
                tasks: ["newer:babel:common"],
                options: {
                    "cwd":"modules/@themost/common",
                    spawn: false,
                },
            },
            query: {
                files: ["modules/@themost/query/**/*.es6","!modules/@themost/query/node_modules/**/*.es6"],
                tasks: ["newer:babel:query"],
                options: {
                    spawn: false,
                },
            },
            data: {
                files: ["modules/@themost/data/**/*.es6","!modules/@themost/data/node_modules/**/*.es6"],
                tasks: ["newer:babel:data"],
                options: {
                    spawn: false,
                },
            },
            web: {
                files: [
                    "!node_modules/**/*.es6",
                    "angular/*.es6",
                    "consumers/*.es6",
                    "controllers/*.es6",
                    "engines/*.es6",
                    "*.es6"
                ],
                tasks: ["newer:babel:web"],
                options: {
                    "cwd":"modules/@themost/web",
                    spawn: false,
                },
            },
            test: {
                files: ["test/**/*.es6"],
                tasks: ["newer:babel:test"],
                options: {
                    spawn: false,
                },
            }
        }
    });
    grunt.loadNpmTasks('grunt-newer');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', ['babel']);
    grunt.registerTask('build', ['babel']);
    grunt.registerTask('build:test', ['babel','watch']);
};