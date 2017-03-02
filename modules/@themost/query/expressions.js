/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MethodCallExpression = exports.ComparisonExpression = exports.LiteralExpression = exports.LogicalExpression = exports.MemberExpression = exports.ArithmeticExpression = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _lodash = require('lodash');

var _ = _lodash._;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Operators = {
    Not: '$not',
    // Multiplicative
    Mul: '$mul',
    Div: '$div',
    Mod: '$mod',
    // Additive
    Add: '$add',
    Sub: '$sub',
    // Relational and type testing
    Lt: '$lt',
    Gt: '$gt',
    Le: '$lte',
    Ge: '$gte',
    // Equality
    Eq: '$eq',
    Ne: '$ne',
    // In Values
    In: '$in',
    NotIn: '$nin',
    // Conditional AND
    And: '$and',
    // Conditional OR
    Or: '$or'
};

/**
 * @class ArithmeticExpression
 * @param {*=} p0 The left operand
 * @param {String=} oper The operator
 * @param {*=} p1 The right operand
 * @constructor
 */

var ArithmeticExpression = exports.ArithmeticExpression = function () {
    function ArithmeticExpression(p0, oper, p1) {
        _classCallCheck(this, ArithmeticExpression);

        this.left = p0;
        this.operator = oper || '$add';
        this.right = p1;
    }

    /**
     * @param {*=} left The left operand
     * @param {String=} operator The operator
     * @param {*=} right The right operand
     * @returns ArithmeticExpression
     */


    _createClass(ArithmeticExpression, [{
        key: 'exprOf',
        value: function exprOf() {
            var p = void 0;
            if (typeof this.left === 'undefined' || this.left == null) throw new Error('Expected left operand');else if (typeof this.left.exprOf === 'function') p = this.left.exprOf();else p = this.left;
            if (typeof this.operator === 'undefined' || this.operator == null) throw new Error('Expected arithmetic operator.');
            if (this.operator.match(ArithmeticExpression.OperatorRegEx) == null) throw new Error('Invalid arithmetic operator.');
            //build right operand e.g. { $add:[ 5 ] }
            var r = {};
            if (typeof this.right === 'undefined' || this.right == null) r[this.operator] = [null];else if (typeof this.right.exprOf === 'function') r[this.operator] = [this.right.exprOf()];else r[this.operator] = [this.right];
            //add left operand e.g { Price: { $add:[ 5 ] } }
            var result = {};
            result[p] = r;
            //return query expression
            return result;
        }
    }], [{
        key: 'create',
        value: function create(left, operator, right) {
            return new ArithmeticExpression(left, operator, right);
        }
        /**
         * Gets a boolean value that indicates whether or not the given operator is an arithmetic operator.
         * @param {String} op
         */

    }, {
        key: 'isArithmeticOperator',
        value: function isArithmeticOperator(op) {
            if (typeof op === 'string') return op.match(ArithmeticExpression.OperatorRegEx) != null;
            return false;
        }
    }]);

    return ArithmeticExpression;
}();

ArithmeticExpression.OperatorRegEx = /^(\$add|\$sub|\$mul|\$div|\$mod)$/g;

/**
 * @class MemberExpression
 * @param {String} name The name of the current member
 * @constructor
 */

var MemberExpression = exports.MemberExpression = function () {
    function MemberExpression(name) {
        _classCallCheck(this, MemberExpression);

        this.name = name;
    }

    _createClass(MemberExpression, [{
        key: 'exprOf',
        value: function exprOf() {
            return this.name;
        }

        /**
         * @param {String=} name A string that represents the member's name
         * @returns MemberExpression
         */

    }], [{
        key: 'create',
        value: function create(name) {
            return new MemberExpression(name);
        }
    }]);

    return MemberExpression;
}();

/**
 * @class LogicalExpression
 * @param {String} name The name of the current member
 * @constructor
 */


var LogicalExpression = exports.LogicalExpression = function () {
    function LogicalExpression(oper, args) {
        _classCallCheck(this, LogicalExpression);

        this.operator = oper || '$and';
        this.args = args || [];
    }

    /**
     * Creates a logical expression
     * @param {String} operator The logical operator
     * @param {Array} args An array that represents the expression's arguments
     * @returns {LogicalExpression}
     */


    _createClass(LogicalExpression, [{
        key: 'exprOf',
        value: function exprOf() {
            if (this.operator.match(LogicalExpression.OperatorRegEx) == null) throw new Error('Invalid logical operator.');
            if (!_.isArray(this.args)) throw new Error('Logical expression arguments cannot be null at this context.');
            if (this.args.length == 0) throw new Error('Logical expression arguments cannot be empty.');
            var p = {};
            p[this.operator] = [];
            for (var i = 0; i < this.args.length; i++) {
                var arg = this.args[i];
                if (typeof arg === 'undefined' || arg == null) p[this.operator].push(null);else if (typeof arg.exprOf === 'function') p[this.operator].push(arg.exprOf());else p[this.operator].push(arg);
            }
            return p;
        }
    }], [{
        key: 'create',
        value: function create(operator, args) {
            return new LogicalExpression(operator, args);
        }

        /**
         * Gets a boolean value that indicates whether or not the given operator is a logical operator.
         * @param {String} op The current operator
         */

    }, {
        key: 'isLogicalOperator',
        value: function isLogicalOperator(op) {
            if (typeof op === 'string') return op.match(LogicalExpression.OperatorRegEx) != null;
            return false;
        }
    }]);

    return LogicalExpression;
}();

LogicalExpression.OperatorRegEx = /^(\$and|\$or|\$not|\$nor)$/g;

/**
 * @class LiteralExpression
 * @param {*} value The literal value
 * @constructor
 */

var LiteralExpression = exports.LiteralExpression = function () {
    function LiteralExpression(value) {
        _classCallCheck(this, LiteralExpression);

        this.value = value;
    }

    /**
     * Creates a literal expression
     * @param {*=} value The literal value
     * @returns LiteralExpression
     */


    _createClass(LiteralExpression, [{
        key: 'exprOf',
        value: function exprOf() {
            if (typeof this.value === 'undefined') return null;
            return this.value;
        }
    }], [{
        key: 'create',
        value: function create(value) {
            return new LiteralExpression(value);
        }
    }]);

    return LiteralExpression;
}();

/**
 *
 * @param {*} left
 * @param {String=} op
 * @param {*=} right
 * @constructor
 */


var ComparisonExpression = exports.ComparisonExpression = function () {
    function ComparisonExpression(left, op, right) {
        _classCallCheck(this, ComparisonExpression);

        this.left = left;
        this.operator = op || '$eq';
        this.right = right;
    }

    /**
     * Creates a comparison expression
     * @param {*=} left The left operand
     * @param {String=} operator The operator
     * @param {*=} right The right operand
     * @returns ComparisonExpression
     */


    _createClass(ComparisonExpression, [{
        key: 'exprOf',
        value: function exprOf() {
            var p = void 0,
                name = void 0,
                expr = void 0;
            if (typeof this.operator === 'undefined' || this.operator == null) throw new Error('Expected comparison operator.');

            if (this.left instanceof MethodCallExpression) {
                p = {};
                if (typeof this.right === 'undefined' || this.right == null) p[this.operator] = null;else if (typeof this.right.exprOf === 'function') p[this.operator] = this.right.exprOf();else p[this.operator] = this.right;

                if (this.operator == '$eq') this.left.args.push(p.$eq);else this.left.args.push(p);
                //return query expression
                return this.left.exprOf();
            } else if (this.left instanceof ArithmeticExpression) {
                p = {};
                //build comparison expression e.g. { $gt:10 }
                if (typeof this.right === 'undefined' || this.right == null) p[this.operator] = null;else if (typeof this.right.exprOf === 'function') p[this.operator] = this.right.exprOf();else p[this.operator] = this.right;

                //get left expression
                expr = this.left.exprOf();
                //find argument list
                name = _.keys(expr)[0];
                if (this.operator == '$eq') expr[name][this.left.operator].push(p.$eq);else expr[name][this.left.operator].push(p);
                //return query expression
                return expr;
            } else if (this.left instanceof MemberExpression) {
                p = {};
                //build comparison expression e.g. { $gt:10 }
                if (typeof this.right === 'undefined' || this.right == null) p[this.operator] = null;else if (typeof this.right.exprOf === 'function') p[this.operator] = this.right.exprOf();else p[this.operator] = this.right;
                name = this.left.name;
                expr = {};
                if (this.operator == '$eq') expr[name] = p.$eq;else expr[name] = p;
                //return query expression
                return expr;
            }
        }
    }], [{
        key: 'create',
        value: function create(left, operator, right) {
            return new ComparisonExpression(left, operator, right);
        }

        /**
         * Gets a boolean value that indicates whether or not the given operator is an arithmetic operator.
         * @param {String} op
         */

    }, {
        key: 'isComparisonOperator',
        value: function isComparisonOperator(op) {
            if (typeof op === 'string') return op.match(ComparisonExpression.OperatorRegEx) != null;
            return false;
        }
    }]);

    return ComparisonExpression;
}();

ComparisonExpression.OperatorRegEx = /^(\$eq|\$ne|\$lte|\$lt|\$gte|\$gt|\$in|\$nin)$/g;

/**
 * Creates a method call expression
 * @class MethodCallExpression
 * @constructor
 */

var MethodCallExpression = exports.MethodCallExpression = function () {
    function MethodCallExpression(name, args) {
        _classCallCheck(this, MethodCallExpression);

        /**
         * Gets or sets the name of this method
         * @type {String}
         */
        this.name = name;
        /**
         * Gets or sets an array that represents the method arguments
         * @type {Array}
         */
        this.args = [];
        if (_.isArray(args)) this.args = args;
    }

    /**
     * Creates a method call expression of the given name with an array of arguments
     * @param {String} name
     * @param {Array} args
     * @returns {MethodCallExpression}
     */


    _createClass(MethodCallExpression, [{
        key: 'exprOf',


        /**
         * Converts the current method to the equivalent query expression e.g. { orderDate: { $year: [] } } which is equivalent with year(orderDate)
         * @returns {*}
         */
        value: function exprOf() {
            var method = {};
            var result = {};
            var name = '$'.concat(this.name);
            //set arguments array
            method[name] = [];
            if (this.args.length == 0) throw new Error('Unsupported method expression. Method arguments cannot be empty.');
            //get first argument
            if (this.args[0] instanceof MemberExpression) {
                var member = this.args[0].name;
                for (var i = 1; i < this.args.length; i++) {
                    var arg = this.args[i];
                    if (typeof arg === 'undefined' || arg == null) method[name].push(null);else if (typeof arg.exprOf === 'function') method[name].push(arg.exprOf());else method[name].push(arg);
                }
                result[member] = method;
                return result;
            } else {
                throw new Error('Unsupported method expression. The first argument of a method expression must be always a MemberExpression.');
            }
        }
    }], [{
        key: 'create',
        value: function create(name, args) {
            return new MethodCallExpression(name, args);
        }
    }]);

    return MethodCallExpression;
}();
//# sourceMappingURL=expressions.js.map
