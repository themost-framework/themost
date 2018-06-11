/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var moment = require('moment');
var numeral = require('numeral');
var ClientDataQueryable = require('@themost/client').ClientDataQueryable;
/**
 * @class
 * @param {HttpContext} context
 * @constructor
 */
function HtmlViewHelper(context) {
    /**
     * @name HtmlViewHelper#context
     * @type HttpContext
     */
    Object.defineProperty(this, 'context', {
        get: function() {
            return context;
        }
    });


    Object.defineProperty(this, 'document', {
        get: function() {
            if (typeof document !== 'undefined') {
                return document;
            }
            var document = null;
            return document;
        } , configurable:false, enumerable:false
    });

}

/**
 *
 * @param {HttpContext} context
 */
HtmlViewHelper.create = function(context) {
    return new HtmlViewHelper(context);
};

/**
 * Returns an anti-forgery hidden input element
 * @returns {String}
 */
HtmlViewHelper.prototype.antiforgery = function() {
    var $view = this.parent;
    //create token
    var context = $view.context,  value = context.getApplication().getEncryptionStrategy().encrypt(JSON.stringify({ id: Math.floor(Math.random() * 1000000), url:context.request.url, date:new Date() }));
    //try to set cookie
    context.response.setHeader('Set-Cookie','.CSRF='.concat(value));
    return $view.writer.writeAttribute('type', 'hidden')
        .writeAttribute('id', '_CSRFToken')
        .writeAttribute('name', '_CSRFToken')
        .writeAttribute('value', value)
        .writeFullBeginTag('input')
        .toString();
};

HtmlViewHelper.prototype.element = function(obj) {
    return this.document.parentWindow.angular.element(obj);
};
/**
 * Returns a two-letter string which represents the current culture e.g. en, fr etc
 * @returns {string}
 */
HtmlViewHelper.prototype.lang = function() {
    var c= this.context.culture();
    if (typeof c === 'string') {
        if (c.length>=2) {
            return c.toLowerCase().substring(0,2);
        }
    }
    //in all cases return default culture
    return 'en';
};
/**
 * Returns a an instance of moment.js formatter
 * @param {*} value
 * @returns {*|moment.Moment}
 */
HtmlViewHelper.prototype.moment = function(value) {
    return moment(value);
};
/**
 * Returns an instance of numeral.js formatter
 * @param {*} value
 * @returns {*}
 */
HtmlViewHelper.prototype.numeral = function(value) {
    return numeral(value);
};
/**
 * @returns {ClientDataQueryable}
 */
HtmlViewHelper.prototype.getRequestLink = function() {
    return ClientDataQueryable.parse(this.context.request.url);
};

/**
 * @param {string} appRelativeUrl
 * @returns {string}
 */
HtmlViewHelper.prototype.resolveUrl = function(appRelativeUrl) {
    return this.context.getApplication().resolveUrl(appRelativeUrl);
};

if (typeof exports !== 'undefined')
{
    module.exports.HtmlViewHelper = HtmlViewHelper;
}