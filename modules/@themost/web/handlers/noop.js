/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
/**
 * @class
 * @constructor
 */
function NoopHandler() {
    //
}

/**
 * @returns NoopHandler
 * */
NoopHandler.createInstance = function () {
    return new NoopHandler();
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports.NoopHandler = NoopHandler;
    /**
     * @returns {NoopHandler}
     */
    module.exports.createInstance = function() {
        return NoopHandler.createInstance();
    };
}