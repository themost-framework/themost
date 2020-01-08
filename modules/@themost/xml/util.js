/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var xmlCommon = require('./common');

// @constructor
function Set() {
    this.keys = [];
}

// noinspection JSUnusedGlobalSymbols
Set.prototype.size = function () {
    return this.keys.length;
};
// Adds the entry to the set, ignoring if it is present.
// noinspection JSUnusedGlobalSymbols
Set.prototype.add = function (key, opt_value) {
    var value = opt_value || 1;
    if (!this.contains(key)) {
        this[':' + key] = value;
        this.keys.push(key);
    }
};

// Sets the entry in the set, adding if it is not yet present.
// noinspection JSUnusedGlobalSymbols
Set.prototype.set = function (key, opt_value) {
    var value = opt_value || 1;
    if (!this.contains(key)) {
        this[':' + key] = value;
        this.keys.push(key);
    } else {
        this[':' + key] = value;
    }
};

// Increments the key's value by 1. This works around the fact that
// numbers are always passed by value, never by reference, so that we
// can't increment the value returned by get(), or the iterator
// argument. Sets the key's value to 1 if it doesn't exist yet.
// noinspection JSUnusedGlobalSymbols
Set.prototype.inc = function (key) {
    if (!this.contains(key)) {
        this[':' + key] = 1;
        this.keys.push(key);
    } else {
        this[':' + key]++;
    }
};
// noinspection JSUnusedGlobalSymbols
Set.prototype.get = function (key) {
    if (this.contains(key)) {
        return this[':' + key];
    } else {
        return null;
    }
};

// Removes the entry from the set.
// noinspection JSUnusedGlobalSymbols
Set.prototype.remove = function (key) {
    if (this.contains(key)) {
        delete this[':' + key];
        removeFromArray(this.keys, key, true);
    }
};

/**
 * Removes value from array. Returns the number of instances of value
 * that were removed from array.
 */
function removeFromArray(array, value, opt_notype) {
    var shift = 0;
    for (var i = 0; i < array.length; ++i) {
        if (array[i] === value || (opt_notype && array[i] === value)) {
            array.splice(i--, 1);
            shift++;
        }
    }
    return shift;
}


// Tests if an entry is in the set.
Set.prototype.contains = function (entry) {
    return typeof this[':' + entry] !== 'undefined';
};

// noinspection JSUnusedGlobalSymbols
Set.prototype.items = function () {
    var list = [];
    for (var i = 0; i < this.keys.length; ++i) {
        var k = this.keys[i];
        var v = this[':' + k];
        list.push(v);
    }
    return list;
};


// Invokes function f for every key value pair in the set as a method
// of the set.
// noinspection JSUnusedGlobalSymbols
Set.prototype.map = function (f) {
    for (var i = 0; i < this.keys.length; ++i) {
        var k = this.keys[i];
        f.call(this, k, this[':' + k]);
    }
};
// noinspection JSUnusedGlobalSymbols
Set.prototype.clear = function () {
    for (var i = 0; i < this.keys.length; ++i) {
        delete this[':' + this.keys[i]];
    }
    this.keys.length = 0;
};

/**
 * @class XmlUtil
 * @constructor
 */
function XmlUtil() {
    //
}

// Splits a string s at all occurrences of character c. This is like
// the split() method of the string object, but IE omits empty
// strings, which violates the invariant (s.split(x).join(x) === s).
// @param {String} s
// @param {String} c
// @returns Array
XmlUtil.prototype.stringSplit = function (s, c) {
    var a = s.indexOf(c);
    if (a === -1) {
        return [s];
    }
    var parts = [];
    parts.push(s.substr(0, a));
    while (a !== -1) {
        var a1 = s.indexOf(c, a + 1);
        if (a1 !== -1) {
            parts.push(s.substr(a + 1, a1 - a - 1));
        } else {
            parts.push(s.substr(a + 1));
        }
        a = a1;
    }
    return parts;
};


// Applies the given function to each element of the array, preserving
// this, and passing the index.
XmlUtil.prototype.mapExec = function (array, func) {
    for (var i = 0; i < array.length; ++i) {
        func.call(this, array[i], i);
    }
};

// Returns an array that contains the return value of the given
// function applied to every element of the input array.
XmlUtil.prototype.mapExpr = function (array, func) {
    var ret = [];
    for (var i = 0; i < array.length; ++i) {
        ret.push(func(array[i]));
    }
    return ret;
};


// Returns the representation of a node as XML text.
// noinspection JSUnusedGlobalSymbols
XmlUtil.prototype.xmlText = function (node, opt_cdata) {
    var buf = [];
    this.xmlTextR(node, buf, opt_cdata);
    return buf.join('');
};

XmlUtil.prototype.xmlTextR = function (node, buf, cdata) {
    if (node.nodeType === xmlCommon.DOM_TEXT_NODE) {
        buf.push(this.xmlEscapeText(node.nodeValue));

    } else if (node.nodeType === xmlCommon.DOM_CDATA_SECTION_NODE) {
        if (cdata) {
            buf.push(node.nodeValue);
        } else {
            buf.push('<![CDATA[' + node.nodeValue + ']]>');
        }

    } else if (node.nodeType === xmlCommon.DOM_COMMENT_NODE) {
        buf.push('<!--' + node.nodeValue + '-->');

    } else if (node.nodeType === xmlCommon.DOM_ELEMENT_NODE) {
        var i;
        buf.push('<' + this.xmlFullNodeName(node));
        for (i = 0; i < node.attributes.length; ++i) {
            var a = node.attributes[i];
            if (a && a.nodeName && a.nodeValue) {
                buf.push(' ' + this.xmlFullNodeName(a) + '="' +
                    this.xmlEscapeAttr(a.nodeValue) + '"');
            }
        }
        if (node.childNodes.length === 0) {
            buf.push('/>');
        } else {
            buf.push('>');
            for (i = 0; i < node.childNodes.length; ++i) {
                arguments.callee(node.childNodes[i], buf, cdata);
            }
            buf.push('</' + this.xmlFullNodeName(node) + '>');
        }

    } else if (node.nodeType === xmlCommon.DOM_DOCUMENT_NODE ||
        node.nodeType === xmlCommon.DOM_DOCUMENT_FRAGMENT_NODE) {
        for (i = 0; i < node.childNodes.length; ++i) {
            arguments.callee(node.childNodes[i], buf, cdata);
        }
    }
};

XmlUtil.prototype.xmlFullNodeName = function (n) {
    if (n.prefix && n.nodeName.indexOf(n.prefix + ':') !== 0) {
        return n.prefix + ':' + n.nodeName;
    } else {
        return n.nodeName;
    }
};

XmlUtil.prototype.isArray = function isArray(ar) {
    return Array.isArray(ar) ||
        (typeof ar === 'object' && Object.prototype.toString.call(ar) === '[object Array]');
};
// noinspection JSUnusedGlobalSymbols
/**
 * @deprecated XmlUtl.format() function was deprecated
 * @param {*} f
 */
// eslint-disable-next-line no-unused-vars
XmlUtil.prototype.format = function (f) {
    throw new Error("XmlUtl.format() function was deprecated");
};

XmlUtil.prototype._extend = function (origin, add) {
    // Don't do anything if add isn't an object
    if (!add || typeof add !== 'object') return origin;

    var keys = Object.keys(add);
    var i = keys.length;
    while (i--) {
        origin[keys[i]] = add[keys[i]];
    }
    return origin;
};

// Escape XML special markup characters: tag delimiter < > and entity
// reference start delimiter &. The escaped string can be used in XML
// text portions (i.e. between tags).
XmlUtil.prototype.xmlEscapeText = function (s) {
    return ('' + s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

// Escape XML special markup characters: tag delimiter < > entity
// reference start delimiter & and quotes ". The escaped string can be
// used in double quoted XML attribute value portions (i.e. in
// attributes within start tags).
XmlUtil.prototype.xmlEscapeAttr = function (s) {
    return this.xmlEscapeText(s).replace(/"/g, '&quot;');
};

/**
 * Escape markup in XML text, but don't touch entity references.
 * The escaped string can be used as XML text (i.e. between tags).
 * @param {string} s
 * @returns {XML|string}
 */
// noinspection JSUnusedGlobalSymbols
XmlUtil.prototype.xmlEscapeTags = function (s) {
    return s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

var xmlUtil = new XmlUtil();

if (typeof exports !== 'undefined') {
    module.exports = xmlUtil;
}

