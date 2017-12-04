/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 * Created by Kyriakos Barbounakis<k.barbounakis@gmail.com> on 2017-11-26.
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 Anthi Oikonomou anthioikonomou@gmail.com
 All rights reserved.
 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.
 * Neither the name of MOST Web Framework nor the names of its
 contributors may be used to endorse or promote products derived from
 this software without specific prior written permission.
 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var Symbol = require('symbol');
var path = require('path');
var util = require('util');
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
util.inherits(DefaultModuleLoader, ModuleLoader);

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
        return require(modulePath);
    }
    return require(path.join(this.getExecutionPath(),modulePath));
};

if (typeof module !== 'undefined') {
    module.exports.ModuleLoader = ModuleLoader;
    module.exports.DefaultModuleLoader = DefaultModuleLoader;
}
