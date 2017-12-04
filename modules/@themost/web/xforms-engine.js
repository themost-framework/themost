/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-05-07
 */
/**
 * @private
 */
var xforms = require('xforms'), xml = require('most-xml'), fs = require('fs');
/**
 * @class XFormsEngine
 * @param {HttpContext=} context
 * @constructor
 * @property {HttpContext} context Gets or sets an instance of HttpContext that represents the current HTTP context.
 */
function XFormsEngine(context) {
    /**
     * @type {HttpContext}
     */
    var ctx = context;
    Object.defineProperty(this,'context', {
        get: function() {
            return ctx;
        },
        set: function(value) {
            ctx = value;
        },
        configurable:false,
        enumerable:false
    });
}
/**
 * Renders the document that exists in the specified path
 * @param {String} path - The path where XFORM file exists
 * @param {Object} options - An object that represents the options provided for this rendering
 */
XFormsEngine.prototype.render = function(path, options, callback) {
    try {

        xforms.loadDocument(path,
            /**
             * @param err
             * @param {FormDocument} doc
             */
            function(err, doc) {
            if (err) {
                callback(err);
            }
            else {
                doc.render(null, function(err, result) {
                    callback(null, result);
                });
            }
        });
    }
    catch (e) {
        callback(e);
    }
}

if (typeof exports !== 'undefined') module.exports.createInstance = function(context) {
    return new XFormsEngine(context);
};


