/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import 'source-map-support/register';
import _ from 'lodash';

/**
 * @private
 */
const HTML_END_CHAR = '>';
const HTML_FULL_END_STRING = ' />';
const HTML_SPACE_CHAR = ' ';
const HTML_ATTR_STRING = '%0="%1"';
const HTML_START_TAG_STRING = '<%0';
const HTML_END_TAG_STRING = '</%0>';

/**
 * @classdesc HtmlWriter class represents a helper class for rendering HTML content.
 * @class
 */
export class HtmlWriter {
    constructor() {
        /**
         * @private
         * @type {Array}
         */
        this.bufferedAttributes=[];
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
    writeAttribute(name, value) {
        this.bufferedAttributes.push({name:name, value:value});
        return this;
    }

    /**
     * Writes an array of attributes to the output buffer. This attributes are going to be rendered after writeBeginTag or WriteFullBeginTag function call.
     * @param {Array|Object} obj - An array of attributes or an object that represents an array of attributes
     * @returns {HtmlWriter}
     */
    writeAttributes(obj) {
        if (_.isNil(obj))
            return this;
        if (_.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                this.bufferedAttributes.push( { name:obj[i].name, value:obj[i].value } );
            }
        }
        else {
            for (const prop in obj)
            {
                if (obj.hasOwnProperty(prop)) {
                    if (obj[prop]!==null) {
                        this.bufferedAttributes.push( { name:prop, value:obj[prop] } );
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
    writeBeginTag(tag) {
        //write <TAG
        if (this.indent)
        {
            //this.buffer += '\n';
            this.buffer +=_.repeat('\t',this.bufferedTags.length);
        }
        this.buffer += HTML_START_TAG_STRING.replace(/%0/, tag);
        this.bufferedTags.push(tag);
        if (this.bufferedAttributes.length>0)
        {
            let s = '';
            _.forEach(this.bufferedAttributes, function(attr) {
                //write attribute='value'
                s += HTML_SPACE_CHAR;
                s += HTML_ATTR_STRING.replace(/%0/,attr.name).replace(/%1/, _.escape(attr.value));
            });
            this.buffer += s;
        }
        this.bufferedAttributes.splice(0,this.bufferedAttributes.length);
        this.buffer += HTML_END_CHAR;
        return this;
    }

    /**
     * Writes a full begin HTML tag (e.g <div/>).
     * @param {String} tag
     * @returns {HtmlWriter}
     */
    writeFullBeginTag(tag) {
        //write <TAG
        if (this.indent)
        {
            this.buffer += '\n';
            this.buffer +=_.repeat('\t',this.bufferedTags.length);
        }
        this.buffer += HTML_START_TAG_STRING.replace(/%0/, tag);
        if (this.bufferedAttributes.length>0)
        {
            let s = '';
            _.forEach(this.bufferedAttributes, function(attr) {
                //write attribute='value'
                s += HTML_SPACE_CHAR;
                s += HTML_ATTR_STRING.replace(/%0/,attr.name).replace(/%1/, _.escape(attr.value));
            });
            this.buffer += s;
        }
        this.bufferedAttributes.splice(0,this.bufferedAttributes.length);
        this.buffer += HTML_FULL_END_STRING;
        return this;
    }

    /**
     * Writes an end HTML tag (e.g </div>) based on the current buffered tags.
     * @returns {HtmlWriter}
     */
    writeEndTag() {
        const tagsLength = this.bufferedTags ? this.bufferedTags.length : 0;
        if (tagsLength===0)
            return this;
        if (this.indent)
        {
            this.buffer += '\n';
            this.buffer +=_.repeat('\t',tagsLength-1);
        }
        this.buffer += HTML_END_TAG_STRING.replace(/%0/,this.bufferedTags[tagsLength-1]);
        this.bufferedTags.splice(tagsLength-1,1);
        return this;
    }

    /**
     *
     * @param {String} s
     * @returns {HtmlWriter}
     */
    writeText(s) {
        if (!s)
            return this;
        if (this.indent)
        {
            this.buffer += '\n';
            this.buffer +=_.repeat('\t',this.bufferedTags.length);
        }
        this.buffer += _.escape(s);
        return this;
    }

    /**
     *
     * @param {String} s
     * @returns {HtmlWriter}
     */
    write(s) {
        this.buffer += s;
        return this;
    }

    /**
     * @returns {String}
     */
    toString() {
        return this.buffer;
    }

    /**
     * @param {function} fn
     */
    writeTo(fn) {
        if (typeof fn === 'function') {
            //call function
            fn(this.buffer);
            //and clear buffer
            this.buffer='';
            //and clear buffered tags
            this.bufferedTags.splice(0,this.bufferedTags.length);
        }
    }
}
