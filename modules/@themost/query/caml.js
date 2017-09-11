/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-04-13
 */
'use strict';
var LangUtils = require('@themost/common/utils').LangUtils;
/**
 * Represents an xml serializable object
 * @class XmlSerializable
 * @constructor
 */
function XmlSerializable() {
    //
}

XmlSerializable.prototype.getSchema = function() {
    return null;
};

XmlSerializable.prototype.writeXml = function() {
    return null;
};

XmlSerializable.prototype.readXml = function() {
    return null;
};

/**
 * @class FieldRef
 * @constructor
 */
function FieldRef() {
    /**
     * @type {String}
     */
    this.name = undefined;
    /**
     * @type {Boolean}
     */
    this.ascending = true;
}

LangUtils.inherits(FieldRef, XmlSerializable);

FieldRef.prototype.getSchema = function() {
    return {
        element: { name: 'FieldRef', namespace: null },
        properties: {
            name: { attribute: 'Name', type: 'String' },
            ascending: { attribute: 'Ascending', value: true, type: 'Boolean' }
        }
    };
};

if (typeof exports !== 'undefined')
{
    module.exports.FieldRef = FieldRef;
}