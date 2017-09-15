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