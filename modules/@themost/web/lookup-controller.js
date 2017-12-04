/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2015-02-20
 */
/**
 * @ignore
 */
var HttpDataController = require('./data-controller'), util = require('util');
/**
 * @classdesc HttpLookupController class describes a lookup model data controller.
 * @class
 * @constructor
 * @memberOf module:most-web.controllers
 */
function HttpLookupController() {
    HttpLookupController.super_.call(this);
}

util.inherits(HttpLookupController, HttpDataController);

if (typeof module !== 'undefined') module.exports = HttpLookupController;