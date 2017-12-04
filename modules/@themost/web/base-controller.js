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
    HttpController = require('./http-mvc').HttpController;
/**
 * @classdesc HttpBaseController class describes a base controller.
 * @class
 * @constructor
 * @param {HttpContext} context
 */
function HttpBaseController(context) {
    HttpBaseController.super_.bind(this)(context);
}
util.inherits(HttpBaseController, HttpController);

if (typeof module !== 'undefined') {
    module.exports = HttpBaseController;
}