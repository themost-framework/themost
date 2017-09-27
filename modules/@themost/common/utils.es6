/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import 'source-map-support/register';
import winston from 'winston';
import _ from 'lodash';

const UUID_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const HEX_CHARS = 'abcdef1234567890';
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;


const DateTimeRegex = /^(\d{4})(?:-?W(\d+)(?:-?(\d+)D?)?|(?:-(\d+))?-(\d+))(?:[T ](\d+):(\d+)(?::(\d+)(?:\.(\d+))?)?)?(?:Z(-?\d*))?$/g;
const BooleanTrueRegex = /^true$/ig;
const BooleanFalseRegex = /^false$/ig;
const NullRegex = /^null$/ig;
const UndefinedRegex = /^undefined$/ig;
const IntegerRegex =/^[-+]?\d+$/g;
const FloatRegex =/^[+-]?\d+(\.\d+)?$/g;


const logger = new winston.Logger({
    level: (process.env.NODE_ENV === 'development') ? 'debug' : 'info',
    transports: [
        new (winston.transports.Console)({
            timestamp: function() {
                return (new Date()).toUTCString()
            },
            formatter: function(options) {
                return '[' + options.timestamp() +'] ['+ options.level.toUpperCase() +'] '+ (options.message ? options.message : '') +
                    (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta, null, 4) : '' );
            }
        })
    ]
});


export class Args {
    /**
     * Checks the expression and throws an exception if the condition is not met.
     * @param {*} expr
     * @param {string|Error} err
     */
    static check(expr, err) {
        Args.notNull(expr,"Expression");
        if (typeof expr === 'function') {
            expr.call();
        }
        let res;
        if (typeof expr === 'function') {
            res = !(expr.call());
        }
        else {
            res = (!expr);
        }
        if (res) {
            if (err instanceof Error) {
                throw err;
            }
            const error = new Error(err);
            error.code = "ECHECK";
            throw error;
        }
    }

    /**
     *
     * @param {*} arg
     * @param {string} name
     */
    static notNull(arg, name) {
        if (typeof arg === 'undefined' || arg === null) {
            const err = new Error(name + " may not be null or undefined");
            err.code = "ENULL";
            throw err;
        }
    }

    /**
     * @param {*} arg
     * @param {string} name
     */
    static notString(arg, name) {
        if (typeof arg !== 'string') {
            const err = new Error(name + " must be a string");
            err.code = "EARG";
            throw err;
        }
    }

    /**
     * @param {*} arg
     * @param {string} name
     */
    static notFunction(arg, name) {
        if (typeof arg !== 'function') {
            const err = new Error(name + " must be a function");
            err.code = "EARG";
            throw err;
        }
    }

    /**
     * @param {*} arg
     * @param {string} name
     */
    static notNumber(arg, name) {
        if (typeof arg !== 'number') {
            const err = new Error(name + " must be number");
            err.code = "EARG";
            throw err;
        }
    }

    /**
     * @param {string|*} arg
     * @param {string} name
     */
    static notEmpty(arg, name) {
        Args.notNull(arg,name);
        Args.notString(arg,name);
        if (arg.length === 0) {
            const err = new Error(name + " may not be empty");
            err.code = "EEMPTY";
            return err;
        }
    }

    /**
     * @param {number|*} arg
     * @param {string} name
     */
    static notNegative(arg, name) {
        Args.notNumber(arg,name);
        if (arg<0) {
            const err = new Error(name + " may not be negative");
            err.code = "ENEG";
            return err;
        }
    }

    /**
     * @param {number|*} arg
     * @param {string} name
     */
    static positive(arg, name) {
        Args.notNumber(arg,name);
        if (arg<=0) {
            const err = new Error(name + " may not be negative or zero");
            err.code = "EPOS";
            return err;
        }
    }
}

/**
 * @class
 */
export class NumberUtils {
    //noinspection JSUnusedGlobalSymbols
    /**
     * Converts a base-26 formatted string to the equivalent integer
     * @static
     * @param {string} s A base-26 formatted string e.g. aaaaaaaa for 0, baaaaaaa for 1 etc
     * @return {number} The equivalent integer value
     */
    static fromBase26(s) {
        let num = 0;
        if (!/[a-z]{8}/.test(s)) {
            throw new Error('Invalid base-26 format.');
        }
        const a = 'a'.charCodeAt(0);
        for (let i = 7; i >=0; i--) {
            num = (num * 26) + (s[i].charCodeAt(0) - a);
        }
        return num;
    }

    //noinspection JSUnusedGlobalSymbols
    /**
     * Converts an integer to the equivalent base-26 formatted string
     * @static
     * @param {number} x The integer to be converted
     * @return {string} The equivalent string value
     */
    static toBase26(x) {
        //noinspection ES6ConvertVarToLetConst
        let num = parseInt(x);
        if (num<0) {
            throw new Error('A non-positive integer cannot be converted to base-26 format.');
        }
        if (num>208827064575) {
            throw new Error('A positive integer bigger than 208827064575 cannot be converted to base-26 format.');
        }
        let out = "";
        let length= 1;
        const a = 'a'.charCodeAt(0);
        while(length<=8)
        {
            out += String.fromCharCode(a + (num % 26));
            num = Math.floor(num / 26);
            length += 1;
        }
        return out;
    }


}

/**
 * @class
 */
export class TextUtils {
    /**
     * Converts the given parameter to MD5 hex string
     * @static
     * @param {*} value
     * @returns {string|undefined}
     */
    static toMD5(value) {

        if (typeof value === 'undefined' || value === null) {
            return;
        }
        //browser implementation
        let md5, md5module;
        if (typeof window !== 'undefined') {
            md5module = 'blueimp-md5';
            md5 = require(md5module);
            if (typeof value === 'string') {
                return md5(value);
            }
            else if (value instanceof Date) {
                return md5(value.toUTCString());
            }
            else {
                return md5(JSON.stringify(value));
            }
        }
        //node.js implementation
        md5module = 'crypto';
        const crypto = require(md5module);
        md5 = crypto.createHash('md5');
        if (typeof value === 'string') {
            md5.update(value);
        }
        else if (value instanceof Date) {
            md5.update(value.toUTCString());
        }
        else {
            md5.update(JSON.stringify(value));
        }
        return md5.digest('hex');
    }

    /**
     * Converts the given parameter to SHA1 hex string
     * @static
     * @param {*} value
     * @returns {string|undefined}
     */
    static toSHA1(value) {

        if (typeof window !== 'undefined') {
            throw new Error('This method is not implemented for this environment')
        }

        const crypto = require('crypto');
        if (typeof value === 'undefined' || value === null) {
            return;
        }
        const sha1 = crypto.createHash('sha1');
        if (typeof value === 'string') {
            sha1.update(value);
        }
        else if (value instanceof Date) {
            sha1.update(value.toUTCString());
        }
        else {
            sha1.update(JSON.stringify(value));
        }
        return sha1.digest('hex');
    }

    /**
     * Converts the given parameter to SHA256 hex string
     * @static
     * @param {*} value
     * @returns {string|undefined}
     */
    static toSHA256(value) {

        if (typeof window !== 'undefined') {
            throw new Error('This method is not implemented for this environment')
        }

        const crypto = require('crypto');
        if (typeof value === 'undefined' || value === null) {
            return;
        }
        const sha256 = crypto.createHash('sha256');
        if (typeof value === 'string') {
            sha256.update(value);
        }
        else if (value instanceof Date) {
            sha256.update(value.toUTCString());
        }
        else {
            sha256.update(JSON.stringify(value));
        }
        return sha256.digest('hex');
    }

    /**
     * Returns a random GUID/UUID string
     * @static
     * @returns {string}
     */
    static newUUID() {
        const uuid = [];
        let i;
        // rfc4122, version 4 form
        let r, n;
        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        // Fill in random data.  At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random()*16;
                n = (i === 19) ? (r & 0x3) | 0x8 : r;
                uuid[i] = UUID_CHARS.substring(n,1);
            }
        }
        return uuid.join('');
    }





}

/**
 * @class
 * @constructor
 */
export class TraceUtils {
    /**
     * @static
     * @param {...*} data
     */
    static log(data) {
        const args = Array.prototype.slice.call(arguments);
        if (args.length===0) { return; }
        if (data instanceof Error) {
            return TraceUtils.error.apply(this, args);
        }
        if (_.isObject(data)) {
            return logger.info.call(logger, JSON.stringify(data,null, 2));
        }
        return logger.info.apply(logger, args);
    }

    /**
     * @static
     * @param {...*} data
     */
    static error(data) {
        const args = Array.prototype.slice.call(arguments);
        if (args.length===0) { return; }
        if (data instanceof Error) {
            if (data.stack) {
                return logger.error(data.stack);
            }
            else {
                return logger.error.apply(logger, args);
            }
        }
        return logger.error.apply(logger, args);
    }

    /**
     *
     * @static
     * @param {...*} data
     */
    static info(data) {
        const args = Array.prototype.slice.call(arguments);
        if (args.length===0) { return; }
        return logger.info.apply(logger, args);
    }

    /**
     *
     * @static
     * @param {*} data
     */
    static warn(data) {
        const args = Array.prototype.slice.call(arguments);
        if (args.length===0) { return; }
        return logger.warn.apply(logger, args);
    }

    /**
     *
     * @static
     * @param {...*} data
     */
    static debug(data) {
        const args = Array.prototype.slice.call(arguments);
        if (args.length===0) { return; }
        return logger.debug.apply(logger, args);
    }
}
/**
 * @class
 */
export class RandomUtils {
    /**
     * Returns a random string based on the length specified
     * @param {Number} length
     */
    static randomChars(length) {
        length = length || 8;
        const chars = "abcdefghkmnopqursuvwxz2456789ABCDEFHJKLMNPQURSTUVWXYZ";
        let str = "";
        for(let i = 0; i < length; i++) {
            str += chars.substr(this.randomInt(0, chars.length-1),1);
        }
        return str;
    }

    /**
     * Returns a random integer between a minimum and a maximum value
     * @param {number} min
     * @param {number} max
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Returns a random string based on the length specified
     * @static
     * @param {number} length
     * @returns {string}
     */
    static randomHex(length) {
        length = (length || 8)*2;
        let str = "";
        for(let i = 0; i < length; i++) {
            str += HEX_CHARS.substr(this.randomInt(0, HEX_CHARS.length-1),1);
        }
        return str;
    }
}

/**
 * @class
 */
export class LangUtils {
    /**
     * Returns an array of strings which represents the arguments' names of the given function
     * @param {Function} fn
     * @returns {Array}
     */
    static getFunctionParams(fn) {
        if (!_.isFunction(fn))
            return [];
        const fnStr = fn.toString().replace(STRIP_COMMENTS, '');
        let result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(/([^\s,]+)/g);
        if(result === null)
            result = [];
        return result;
    }
    /**
     * @param {string} value
     */
    static convert(value) {
        let result;
        if ((typeof value === 'string'))
        {
            if (value.length===0) {
                result = value
            }
            if (value.match(BooleanTrueRegex)) {
                result = true;
            }
            else if (value.match(BooleanFalseRegex)) {
                result = false;
            }
            else if (value.match(NullRegex) || value.match(UndefinedRegex)) {
                result = null;
            }
            else if (value.match(IntegerRegex)) {
                result = parseInt(value);
            }
            else if (value.match(FloatRegex)) {
                result = parseFloat(value);
            }
            else if (value.match(DateTimeRegex)) {
                result = new Date(Date.parse(value));
            }
            else {
                result = value;
            }
        }
        else {
            result = value;
        }
        return result;
    }

    /**
     *
     * @param {*} origin
     * @param {string} expr
     * @param {string} value
     * @param {*=} options
     * @returns {*}
     */
    static extend(origin, expr, value, options) {

        options = options || { convertValues:false };
        //find base notation
        let match = /(^\w+)\[/.exec(expr), name, descriptor, expr1;
        if (match) {
            //get property name
            name = match[1];
            //validate array property
            if (/^\d+$/g.test(name)) {
                //property is an array
                if (!_.isArray(origin.value))
                    origin.value = [];
                // get new expression
                expr1 = expr.substr(match.index + match[1].length);
                LangUtils.extend(origin, expr1, value);
            }
            else {
                //set property value (unknown)
                origin[name] = origin[name] || new LangUtils();
                descriptor = new UnknownPropertyDescriptor(origin, name);
                // get new expression
                expr1 = expr.substr(match.index + match[1].length);
                LangUtils.extend(descriptor, expr1, value);
            }
        }
        else if (expr.indexOf('[')===0) {
            //get property
            const re = /\[(.*?)\]/g;
            match = re.exec(expr);
            if (match) {
                name = match[1];
                // get new expression
                expr1 = expr.substr(match.index + match[0].length);
                if (/^\d+$/g.test(name)) {
                    //property is an array
                    if (!_.isArray(origin.value))
                        origin.value = [];
                }
                if (expr1.length===0) {
                    if (origin.value instanceof LangUtils) {
                        origin.value = {};
                    }
                    let typedValue;
                    //convert string value
                    if ((typeof value === 'string') && options.convertValues) {
                        typedValue = LangUtils.convert(value);
                    }
                    else {
                        typedValue = value;
                    }
                    if (_.isArray(origin.value))
                        origin.value.push(typedValue);
                    else
                        origin.value[name] = typedValue;
                }
                else {
                    if (origin.value instanceof LangUtils) {
                        origin.value = { };
                    }
                    origin.value[name] = origin.value[name] || new LangUtils();
                    descriptor = new UnknownPropertyDescriptor(origin.value, name);
                    LangUtils.extend(descriptor, expr1, value);
                }
            }
            else {
                throw new Error('Invalid object property notation. Expected [name]');
            }
        }
        else if (/^\w+$/.test(expr)) {
            if (options.convertValues)
                origin[expr] = LangUtils.convert(value);
            else
                origin[expr] = value;
        }
        else {
            throw new Error('Invalid object property notation. Expected property[name] or [name]');
        }
        return origin;
    }


    /**
     *
     * @param {*} form
     * @returns {*}
     */
    static parseForm (form) {
        const result = {};
        if (typeof form === 'undefined' || form===null)
            return result;
        const keys = Object.keys(form);
        keys.forEach(function(key) {
            if (form.hasOwnProperty(key))
            {
                LangUtils.extend(result, key, form[key])
            }
        });
        return result;
    }
    /**
     * Parses any value or string and returns the resulted object.
     * @param {*} any
     * @returns {*}
     */
    static parseValue(any) {
        return LangUtils.convert(any);
    }
    /**
     * Parses any value and returns the equivalent integer.
     * @param {*} any
     * @returns {*}
     */
    static parseInt(any) {
        return parseInt(any) || 0;
    }
    /**
     * Parses any value and returns the equivalent float number.
     * @param {*} any
     * @returns {*}
     */
    static parseFloat(any) {
        return parseFloat(any) || 0;
    }
    /**
     * Parses any value and returns the equivalent boolean.
     * @param {*} any
     * @returns {*}
     */
    static parseBoolean(any) {
        if (typeof any === 'undefined' || any === null)
            return false;
        else if (typeof any === 'number')
            return any !== 0;
        else if (typeof any === 'string') {
            if (any.match(LangUtils.IntegerRegex) || any.match(LangUtils.FloatRegex)) {
                return parseInt(any, 10) !== 0;
            }
            else if (any.match(LangUtils.BooleanTrueRegex))
                return true;
            else if (any.match(LangUtils.BooleanFalseRegex))
                return false;
            else if (/^yes$|^on$|^y$|^valid$/i.test(any))
                return true;
            else if (/^no$|^off$|^n$|^invalid$/i.test(any))
                return false;
            else
                return false;
        }
        else if (typeof any === 'boolean')
            return any;
        else {
            return (parseInt(any) || 0) !== 0;
        }
    }

}

LangUtils.DateTimeRegex = /^(\d{4})(?:-?W(\d+)(?:-?(\d+)D?)?|(?:-(\d+))?-(\d+))(?:[T ](\d+):(\d+)(?::(\d+)(?:\.(\d+))?)?)?(?:Z(-?\d*))?$/g;
LangUtils.BooleanTrueRegex = /^true$/ig;
LangUtils.BooleanFalseRegex = /^false$/ig;
LangUtils.NullRegex = /^null$/ig;
LangUtils.UndefinedRegex = /^undefined$/ig;
LangUtils.IntegerRegex =/^[-+]?\d+$/g;
LangUtils.FloatRegex =/^[+-]?\d+(\.\d+)?$/g;
/**
 * @class
 * @constructor
 */
function UnknownPropertyDescriptor(obj, name) {
    Object.defineProperty(this, 'value', { configurable:false, enumerable:true, get: function() { return obj[name]; }, set: function(value) { obj[name]=value; } });
    Object.defineProperty(this, 'name', { configurable:false, enumerable:true, get: function() { return name; } });
}

export class PathUtils {
    /**
     *
     * @param {...string} part
     * @returns {string}
     */
    static join(...part) {
        // Split the inputs into a list of path commands.
        let parts = [], i, l;
        for (i = 0, l = arguments.length; i < l; i++) {
            parts = parts.concat(arguments[i].replace(/\\/g,"/").split("/"));
        }
        // Interpret the path commands to get the new resolved path.
        let newParts = [];
        for (i = 0, l = parts.length; i < l; i++) {
            let part_ = parts[i];
            // Remove leading and trailing slashes
            // Also remove "." segments
            if (!part_ || part_ === ".") continue;
            // Interpret ".." to pop the last segment
            if (part_ === "..") newParts.pop();
            // Push new path segments.
            else newParts.push(part_);
        }
        // Preserve the initial slash if there was one.
        if (parts[0] === "") newParts.unshift("");
        // Turn back into a single string path.
        return newParts.join("/") || (newParts.length ? "/" : ".");
    }
}
