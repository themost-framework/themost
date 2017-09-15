/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';
var LangUtils = require('@themost/common/utils').LangUtils;
var AbstractClassError = require('@themost/common/errors').AbstractClassError;
var AbstractMethodError = require('@themost/common/errors').AbstractMethodError;
var HttpApplicationStrategy = require('../common').HttpApplicationStrategy;
var Args = require('@themost/common/utils').Args;
var Symbol = require('symbol');
var _ = require('lodash');
var crypto = require('crypto');
var cryptoProperty = Symbol('crypto');
/**
 * @class
 * @constructor
 * @param {HttpApplication} app
 * @extends HttpApplicationStrategy
 * @abstract
 * @memberOf module:@themost/web/strategies/encryption
 */
function EncryptionStrategy(app) {
    EncryptionStrategy.super_.bind(this)(app);
    Args.check((this.constructor.name !== 'EncryptionStrategy'), new AbstractClassError());
}
LangUtils.inherits(EncryptionStrategy, HttpApplicationStrategy);

/**
 * Encrypts the given data
 * @param {*} data
 * @abstract
 * */
EncryptionStrategy.prototype.encrypt = function(data) {
    throw new AbstractMethodError();
};

/**
 * Decrypts the given data
 * @param {string} data
 * @abstract
 * */
EncryptionStrategy.prototype.decrypt = function(data) {
    throw new AbstractMethodError();
};

/**
 * @class
 * @constructor
 * @param {HttpApplication} app
 * @extends EncryptionStrategy
 * @memberOf module:@themost/web/strategies/encryption
 */
function DefaultEncryptionStrategy(app) {
    DefaultEncryptionStrategy.super_.bind(this)(app);
    this[cryptoProperty] = { };
    _.assign(this[cryptoProperty], this.getApplication().getConfiguration().getSourceAt('settings/crypto'));
}
LangUtils.inherits(DefaultEncryptionStrategy, EncryptionStrategy);

DefaultEncryptionStrategy.prototype.getOptions = function() {
    return this[cryptoProperty];
};
/**
 * Encrypts the given data
 * @param data
 * @returns {string|undefined}
 */
DefaultEncryptionStrategy.prototype.encrypt = function (data) {
    if (_.isNil(data))
        return;
    var options = this.getOptions();
    //validate options
    Args.check(!_.isNil(options.algorithm), 'Data encryption algorithm is missing. The operation cannot be completed');
    Args.check(!_.isNil(options.key), 'Data encryption key is missing. The operation cannot be completed');
    //encrypt
    var cipher = crypto.createCipher(options.algorithm, options.key);
    return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
};
/**
 * Decrypts the given data
 * @param data
 * @returns {string|undefined}
 */
DefaultEncryptionStrategy.prototype.decrypt = function (data) {
    if (_.isNil(data))
        return;
    //validate settings
    var options = this.getOptions();
    //validate settings
    Args.check(!_.isNil(options.algorithm), 'Data encryption algorithm is missing. The operation cannot be completed');
    Args.check(!_.isNil(options.key), 'Data encryption key is missing. The operation cannot be completed');
    //decrypt
    var decipher = crypto.createDecipher(options.algorithm, options.key);
    return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
};

if (typeof exports !== 'undefined') {
    /** @module @themost/web/strategies/encryption */
    module.exports.EncryptionStrategy = EncryptionStrategy;
    module.exports.DefaultEncryptionStrategy = DefaultEncryptionStrategy;
}