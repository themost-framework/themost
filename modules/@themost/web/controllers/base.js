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
var HttpController = require('../mvc').HttpController;
/**
 * @classdesc HttpBaseController class describes a base HTTP controller.
 * @class
 * @constructor
 * @param {HttpContext} context - The executing HTTP context.
 * @extends HttpController
 */
function HttpBaseController(context) {
    HttpBaseController.super_.bind(this)(context);
}
LangUtils.inherits(HttpBaseController, HttpController);

if (typeof module !== 'undefined') {
    module.exports = HttpBaseController;
}