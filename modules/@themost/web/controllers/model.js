/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var HttpDataController = require('./data');
var LangUtils = require('@themost/common/utils').LangUtils;
var httpGet = require('../decorators').httpGet;
var httpPost = require('../decorators').httpPost;
var httpPut = require('../decorators').httpPut;
var httpDelete = require('../decorators').httpDelete;
var httpAction = require('../decorators').httpAction;
var httpController = require('../decorators').httpController;
var defineDecorator = require('../decorators').defineDecorator;
var Q = require('q');
/**
 * @class
 * @constructor
 * @augments HttpDataController
 */
function HttpDataModelController() {
    HttpDataModelController.super_.bind(this)();
}
LangUtils.inherits(HttpDataModelController, HttpDataController);
defineDecorator(HttpDataModelController, 'constructor', httpController());

HttpDataModelController.prototype.getItems = function() {
    return Q.nbind(HttpDataModelController.super_.prototype.index,this)();
};
//apply descriptors
defineDecorator(HttpDataModelController.prototype, 'getItems', httpGet());
defineDecorator(HttpDataModelController.prototype, 'getItems', httpAction("index"));

HttpDataModelController.prototype.postItems = function() {
    return Q.nbind(HttpDataModelController.super_.prototype.index,this)();
};
//apply descriptors
defineDecorator(HttpDataModelController.prototype, 'postItems', httpPost());
defineDecorator(HttpDataModelController.prototype, 'postItems', httpAction("index"));

HttpDataModelController.prototype.putItems = function() {
    return Q.nbind(HttpDataModelController.super_.prototype.index,this)();
};
//apply descriptors
defineDecorator(HttpDataModelController.prototype, 'putItems', httpPut());
defineDecorator(HttpDataModelController.prototype, 'putItems', httpAction("index"));

HttpDataModelController.prototype.deleteItems = function() {
    return Q.nbind(HttpDataModelController.super_.prototype.index,this)();
};
//apply descriptors
defineDecorator(HttpDataModelController.prototype, 'deleteItems', httpDelete());
defineDecorator(HttpDataModelController.prototype, 'deleteItems', httpAction("index"));


HttpDataModelController.prototype.showItem = function() {
    return Q.nbind(HttpDataModelController.super_.prototype.show,this)();
};
//apply descriptors
defineDecorator(HttpDataModelController.prototype, 'showItem', httpGet());
defineDecorator(HttpDataModelController.prototype, 'showItem', httpAction("show"));

HttpDataModelController.prototype.createItem = function() {
    return {};
};
//apply descriptors
defineDecorator(HttpDataModelController.prototype, 'createItem', httpGet());
defineDecorator(HttpDataModelController.prototype, 'createItem', httpAction("create"));

HttpDataModelController.prototype.getItem = function() {
    return Q.nbind(HttpDataModelController.super_.prototype.edit,this)();
};
//apply descriptors
defineDecorator(HttpDataModelController.prototype, 'getItem', httpGet());
defineDecorator(HttpDataModelController.prototype, 'getItem', httpAction("edit"));

HttpDataModelController.prototype.postItem = function() {
    return Q.nbind(HttpDataModelController.super_.prototype.edit,this)();
};
//apply descriptors
defineDecorator(HttpDataModelController.prototype, 'postItem', httpPost());
defineDecorator(HttpDataModelController.prototype, 'postItem', httpAction("edit"));

HttpDataModelController.prototype.deleteItem = function() {
    return Q.nbind(HttpDataModelController.super_.prototype.edit,this)();
};
//apply descriptors
defineDecorator(HttpDataModelController.prototype, 'deleteItem', httpDelete());
defineDecorator(HttpDataModelController.prototype, 'deleteItem', httpAction("edit"));

if (typeof module !== 'undefined') {
    module.exports = HttpDataModelController;
}