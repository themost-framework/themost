/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2016-06-07
 */

var HttpController = require("./../http-mvc").HttpController;
var util = require("util");
/**
 * @ignore
 * @constructor
 */
function HttpHiddenController()
{
    //do nothing
}
util.inherits(HttpHiddenController, HttpController);