/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var QueryExpression = require('./query').QueryExpression;

/**
 * @param {string} tz
 */
function convertTimezone(tz) {
    if (tz === "Z") return 0;
    var m = tz.match(/([+\-\s])(\d\d):?(\d\d)?/);
    if (m) {
        return (m[1] === '-' ? -1 : 1) * (parseInt(m[2], 10) + ((m[3] ? parseInt(m[3], 10) : 0) / 60)) * 60;
    }
    return false;
}

function zeroPad(number, length) {
    number = number.toString();
    while (number.length < length) {
        number = '0' + number;
    }
    return number;
}

function dateToString(date, timeZone) {
    var dt = new Date(date);

    if (timeZone !== 'local') {
        var tz = convertTimezone(timeZone);

        dt.setTime(dt.getTime() + (dt.getTimezoneOffset() * 60000));
        if (tz !== false) {
            dt.setTime(dt.getTime() + (tz * 60000));
        }
    }

    var year   = dt.getFullYear();
    var month  = zeroPad(dt.getMonth() + 1, 2);
    var day    = zeroPad(dt.getDate(), 2);
    var hour   = zeroPad(dt.getHours(), 2);
    var minute = zeroPad(dt.getMinutes(), 2);
    var second = zeroPad(dt.getSeconds(), 2);
    var millisecond = zeroPad(dt.getMilliseconds(), 3);

    return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + '.' + millisecond;
}

/**
 * @param {Buffer} buffer
 * @returns {string}
 */
function bufferToString(buffer) {
    var hex = '';
    try {
        hex = buffer.toString('hex');
    } catch (err) {
        // node v0.4.x does not support hex / throws unknown encoding error
        for (var i = 0; i < buffer.length; i++) {
            var byte = buffer[i];
            hex += zeroPad(byte.toString(16));
        }
    }

    return "X'" + hex+ "'";
}

function objectToValues(object, timeZone) {
    var values = [];
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            var value = object[key];
            if(typeof value === 'function') {
                continue;
            }
            values.push(escapeId(key) + ' = ' + escape(value, true, timeZone));
        }
    }
    return values.join(', ');
}

function arrayToList(array, timeZone) {
    return array.map(function(v) {
        if (Array.isArray(v)) return '(' + arrayToList(v, timeZone) + ')';
        return escape(v, true, timeZone);
    }).join(', ');
}

function escapeId(val, forbidQualified) {
    if (Array.isArray(val)) {
        return val.map(function(v) {
            return escapeId(v, forbidQualified);
        }).join(', ');
    }

    if (forbidQualified) {
        return '`' + val.replace(/`/g, '``') + '`';
    }
    return '`' + val.replace(/`/g, '``').replace(/\./g, '`.`') + '`';
}
// eslint-disable-next-line no-control-regex
var STR_ESCAPE_REGEXP = /[\0\n\r\b\t\\'"\x1a]/g;

function escape(val, stringifyObjects, timeZone) {
    if (typeof val === 'undefined' || val === null) {
        return 'NULL';
    }

    switch (typeof val) {
        case 'boolean': return (val) ? 'true' : 'false';
        case 'number': return val+'';
    }

    if (val instanceof Date) {
        val = dateToString(val, timeZone || 'local');
    }

    if (Buffer.isBuffer(val)) {
        return bufferToString(val);
    }

    if (Array.isArray(val)) {
        return arrayToList(val, timeZone);
    }

    if (typeof val === 'object') {
        if (stringifyObjects) {
            val = val.toString();
        } else {
            return objectToValues(val, timeZone);
        }
    }
    val = val.replace(STR_ESCAPE_REGEXP, function(s) {
        switch(s) {
            case "\0": return "\\0";
            case "\n": return "\\n";
            case "\r": return "\\r";
            case "\b": return "\\b";
            case "\t": return "\\t";
            case "\x1a": return "\\Z";
            default: return "\\"+s;
        }
    });
    return "'"+val+"'";
}

function format(sql, values, stringifyObjects, timeZone) {
    values = (typeof values === 'undefined' || values === null) ? [] : [].concat(values);
    var index = 0;
    return sql.replace(/\?\??/g, function(match) {
        if (index === values.length) {
            return match;
        }
        var value = values[index++];
        return match === '??'
            ? escapeId(value)
            : escape(value, stringifyObjects, timeZone);
    });
}

/**
 * @class
 * @constructor
 */
function QueryUtils() {

}

/**
 * Initializes a select query expression by specifying the entity name
 * @param {string|*} entity - The name of the entity
 */
QueryUtils.query = function(entity) {
    var q = new QueryExpression();
    return q.from(entity);
};
/**
 * Initializes a select query expression
 * @param {...*} fields
 */
QueryUtils.select = function(fields) {
    var q = new QueryExpression();
    return q.select.apply(q,fields);
};
/**
 * Initializes an insert query expression
 * @param {*} obj - The object to insert
 */
QueryUtils.insert = function(obj) {
    var q = new QueryExpression();
    return q.insert(obj);
};

/**
 * Initializes an update query expression
 * @param {string|*} entity - The name of the entity
 */
QueryUtils.update = function(entity) {
    var q = new QueryExpression();
    return q.update(entity);
};

/**
 * Initializes a delete query expression
 * @param {string} entity - The name of the entity
 */
QueryUtils.delete = function(entity) {
    var q = new QueryExpression();
    return q.delete(entity);
};

/**
 * Initializes a QueryExpression instance.
 * @returns {QueryExpression}
 * @param  {*} obj
 */
QueryUtils.where = function(obj) {
    var q = new QueryExpression();
    return q.where(obj);
};

/**
 * @class
 * @constructor
 */
function SqlUtils() {

}
/**
 * Escapes the given value and returns an equivalent string which is going to be used in SQL expressions.
 * @param {*} val
 * @returns {*}
 */
SqlUtils.escape = function(val) {
    return escape(val);
};

/**
 * Formats the given SQL expression string and replaces parameters with the given parameters, if any.
 * e.g. * SELECT * FROM User where username=? with values: ['user1'] etc.
 * @param {string} sql
 * @param {*=} values
 * @returns {*}
 */
SqlUtils.format = function(sql, values) {
    return format(sql, values);
};


if (typeof exports !== 'undefined') {
    module.exports.QueryUtils = QueryUtils;
    module.exports.SqlUtils = SqlUtils;
}
