'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.HtmlWriter = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * MOST Web Framework 2.0 Codename Blueshift
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright (c) 2017, THEMOST LP All rights reserved
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Use of this source code is governed by an BSD-3-Clause license that can be
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * found in the LICENSE file at https://themost.io/license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


require('source-map-support/register');

var _lodash = require('lodash');

var _ = _interopRequireDefault(_lodash).default;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @private
 */
var HTML_END_CHAR = '>';
var HTML_FULL_END_STRING = ' />';
var HTML_SPACE_CHAR = ' ';
var HTML_ATTR_STRING = '%0="%1"';
var HTML_START_TAG_STRING = '<%0';
var HTML_END_TAG_STRING = '</%0>';

/**
 * @classdesc HtmlWriter class represents a helper class for rendering HTML content.
 * @class
 */

var HtmlWriter = exports.HtmlWriter = function () {
    function HtmlWriter() {
        _classCallCheck(this, HtmlWriter);

        /**
         * @private
         * @type {Array}
         */
        this.bufferedAttributes = [];
        /**
         * @private
         * @type {Array}
         */
        this.bufferedTags = [];
        /**
         * @private
         * @type {String}
         */
        this.buffer = '';
        /**
         * @private
         * @type {Integer}
         */
        this.indent = true;
    }

    /**
     * Writes an attribute to an array of attributes that is going to be used in writeBeginTag function
     * @param {String} name - The name of the HTML attribute
     * @param {String} value - The value of the HTML attribute
     * @returns {HtmlWriter}
     */


    _createClass(HtmlWriter, [{
        key: 'writeAttribute',
        value: function writeAttribute(name, value) {
            this.bufferedAttributes.push({ name: name, value: value });
            return this;
        }

        /**
         * Writes an array of attributes to the output buffer. This attributes are going to be rendered after writeBeginTag or WriteFullBeginTag function call.
         * @param {Array|Object} obj - An array of attributes or an object that represents an array of attributes
         * @returns {HtmlWriter}
         */

    }, {
        key: 'writeAttributes',
        value: function writeAttributes(obj) {
            if (_.isNil(obj)) return this;
            if (_.isArray(obj)) {
                for (var i = 0; i < obj.length; i++) {
                    this.bufferedAttributes.push({ name: obj[i].name, value: obj[i].value });
                }
            } else {
                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        if (obj[prop] !== null) {
                            this.bufferedAttributes.push({ name: prop, value: obj[prop] });
                        }
                    }
                }
            }
            return this;
        }

        /**
         * @param {String} tag
         * @returns {HtmlWriter}
         */

    }, {
        key: 'writeBeginTag',
        value: function writeBeginTag(tag) {
            //write <TAG
            if (this.indent) {
                //this.buffer += '\n';
                this.buffer += _.repeat('\t', this.bufferedTags.length);
            }
            this.buffer += HTML_START_TAG_STRING.replace(/%0/, tag);
            this.bufferedTags.push(tag);
            if (this.bufferedAttributes.length > 0) {
                var s = '';
                _.forEach(this.bufferedAttributes, function (attr) {
                    //write attribute='value'
                    s += HTML_SPACE_CHAR;
                    s += HTML_ATTR_STRING.replace(/%0/, attr.name).replace(/%1/, _.escape(attr.value));
                });
                this.buffer += s;
            }
            this.bufferedAttributes.splice(0, this.bufferedAttributes.length);
            this.buffer += HTML_END_CHAR;
            return this;
        }

        /**
         * Writes a full begin HTML tag (e.g <div/>).
         * @param {String} tag
         * @returns {HtmlWriter}
         */

    }, {
        key: 'writeFullBeginTag',
        value: function writeFullBeginTag(tag) {
            //write <TAG
            if (this.indent) {
                this.buffer += '\n';
                this.buffer += _.repeat('\t', this.bufferedTags.length);
            }
            this.buffer += HTML_START_TAG_STRING.replace(/%0/, tag);
            if (this.bufferedAttributes.length > 0) {
                var s = '';
                _.forEach(this.bufferedAttributes, function (attr) {
                    //write attribute='value'
                    s += HTML_SPACE_CHAR;
                    s += HTML_ATTR_STRING.replace(/%0/, attr.name).replace(/%1/, _.escape(attr.value));
                });
                this.buffer += s;
            }
            this.bufferedAttributes.splice(0, this.bufferedAttributes.length);
            this.buffer += HTML_FULL_END_STRING;
            return this;
        }

        /**
         * Writes an end HTML tag (e.g </div>) based on the current buffered tags.
         * @returns {HtmlWriter}
         */

    }, {
        key: 'writeEndTag',
        value: function writeEndTag() {
            var tagsLength = this.bufferedTags ? this.bufferedTags.length : 0;
            if (tagsLength === 0) return this;
            if (this.indent) {
                this.buffer += '\n';
                this.buffer += _.repeat('\t', tagsLength - 1);
            }
            this.buffer += HTML_END_TAG_STRING.replace(/%0/, this.bufferedTags[tagsLength - 1]);
            this.bufferedTags.splice(tagsLength - 1, 1);
            return this;
        }

        /**
         *
         * @param {String} s
         * @returns {HtmlWriter}
         */

    }, {
        key: 'writeText',
        value: function writeText(s) {
            if (!s) return this;
            if (this.indent) {
                this.buffer += '\n';
                this.buffer += _.repeat('\t', this.bufferedTags.length);
            }
            this.buffer += _.escape(s);
            return this;
        }

        /**
         *
         * @param {String} s
         * @returns {HtmlWriter}
         */

    }, {
        key: 'write',
        value: function write(s) {
            this.buffer += s;
            return this;
        }

        /**
         * @returns {String}
         */

    }, {
        key: 'toString',
        value: function toString() {
            return this.buffer;
        }

        /**
         * @param {function} fn
         */

    }, {
        key: 'writeTo',
        value: function writeTo(fn) {
            if (typeof fn === 'function') {
                //call function
                fn(this.buffer);
                //and clear buffer
                this.buffer = '';
                //and clear buffered tags
                this.bufferedTags.splice(0, this.bufferedTags.length);
            }
        }
    }]);

    return HtmlWriter;
}();
//# sourceMappingURL=html.js.map
