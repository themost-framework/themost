/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var LangUtils = require('@themost/common/utils').LangUtils;
var Symbol = require('symbol');
var path = require('path');
var executionPathProperty = Symbol('executionPath');

/**
 * @class
 * @constructor
 * @abstract
 */
function ModuleLoader() {
    if (this.constructor.name === 'ModuleLoader') {
        throw new Error('An abstract class cannot be instantiated.');
    }
}

/**
 * @param {string} modulePath
 * @returns {*}
 * @abstract
 */
// eslint-disable-next-line no-unused-vars
ModuleLoader.prototype.require = function(modulePath) {
    throw new Error('Class does not implement inherited abstract method.');
};

/**
 * @class
 * @param {string} executionPath
 * @constructor
 * @augments ModuleLoader
 * @extends ModuleLoader
 */
function DefaultModuleLoader(executionPath) {
    DefaultModuleLoader.super_.bind(this)();
    this[executionPathProperty] = path.resolve(executionPath) || process.cwd();
}
LangUtils.inherits(DefaultModuleLoader, ModuleLoader);

DefaultModuleLoader.prototype.getExecutionPath = function() {
    return this[executionPathProperty];
};
/**
 * @param {string} modulePath
 * @returns {*}
 */
DefaultModuleLoader.prototype.require = function(modulePath) {
    if (!/^.\//i.test(modulePath)) {
        //load module which is not starting with ./
        if (require.main && typeof require.main.require === 'function') {
            return require.main.require(modulePath)
        }
        return require(modulePath);
    }
    return require(path.join(this.getExecutionPath(),modulePath));
};

if (typeof module !== 'undefined') {
    module.exports.ModuleLoader = ModuleLoader;
    module.exports.DefaultModuleLoader = DefaultModuleLoader;
}
