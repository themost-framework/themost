/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-06-10
 */
/**
 * @class NoopHandler
 * @constructor
 * @augments HttpHandler
 */
function NoopHandler() {
    //
}

/**
 * @returns HttpHandler
 * */
NoopHandler.prototype.createInstance = function () {
    return new NoopHandler();
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') module.exports = NoopHandler.prototype.createInstance();