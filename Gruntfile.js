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
            compile: {
                options: {
                    sourceMap: true,
                    presets: [ "env" ],
                    plugins: [
                        "transform-async-functions",
                        "transform-decorators-legacy",
                        ["babel-plugin-transform-builtin-extend", {
                            globals: ["Error", "Array"]
                        }]
                    ]
                },
                files: [{
                    expand: true,
                    cwd:'',
                    src: ['test/**/*.es6','test-app/**/*.es6','modules/@themost/**/*.es6'],
                    dest: '',
                    ext: '.js'
                }]
            }
        }
    });
    grunt.registerTask('default', ['babel']);
};