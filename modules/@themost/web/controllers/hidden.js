/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';
var HttpController = require("../mvc").HttpController;
var LangUtils = require('@themost/common/utils').LangUtils;
/**
 * @class
 * @ignore
 * @param {HttpContext} context - The executing HTTP context.
 * @constructor
 */
function HttpHiddenController(context)
{
    HttpHiddenController.super_.bind(this)(context);
}
LangUtils.inherits(HttpHiddenController, HttpController);