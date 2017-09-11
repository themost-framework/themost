/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-09-06
 */
/**
 * @ignore
 */
var util = require('util'),
    mvc = require('./http-mvc'),
    common = require('./common');
/**
 * @classdesc HttpBaseController class describes a base controller.
 * @class
 * @constructor
 * @memberOf module:most-web.controllers
 */
function HttpBaseController() {
    //
}
util.inherits(HttpBaseController, mvc.HttpController);

if (typeof module !== 'undefined') module.exports = HttpBaseController;