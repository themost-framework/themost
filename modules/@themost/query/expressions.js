/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-05-16
 */
'use strict';
var _ = require('lodash');
/**
 * @class ArithmeticExpression
 * @param {*=} p0 The left operand
 * @param {String=} oper The operator
 * @param {*=} p1 The right operand
 * @constructor
 */
function ArithmeticExpression(p0, oper, p1)
{
    this.left = p0;
    this.operator = oper || '$add';
    this.right = p1;
}

ArithmeticExpression.OperatorRegEx = /^(\$add|\$sub|\$mul|\$div|\$mod)$/g;

ArithmeticExpression.prototype.exprOf = function()
{
    var p;
    if (typeof this.left === 'undefined' || this.left==null)
        throw new Error('Expected left operand');
    else if (typeof this.left.exprOf === 'function')
        p = this.left.exprOf();
    else
        p = this.left;
    if (typeof this.operator === 'undefined' || this.operator==null)
        throw new Error('Expected arithmetic operator.');
    if (this.operator.match(ArithmeticExpression.OperatorRegEx)==null)
        throw new Error('Invalid arithmetic operator.');
    //build right operand e.g. { $add:[ 5 ] }
    var r = {};
    if (typeof this.right === 'undefined' || this.right==null) {
        r[this.operator]=[null];
    }
    else if (typeof this.right.exprOf === 'function') {
        if (this.right instanceof MemberExpression) {
            r[this.operator] = [{ "$name": this.right.exprOf() }];
        }
        else {
            r[this.operator] = [this.right.exprOf()];
        }

    }
    else {
        r[this.operator]=[this.right];
    }
    //add left operand e.g { Price: { $add:[ 5 ] } }
    var result = {};
    result[p] = r;
    //return query expression
    return result;
};

/**
 * @class MemberExpression
 * @param {String} name The name of the current member
 * @constructor
 */
function MemberExpression(name) {
    this.name = name;
}
MemberExpression.prototype.exprOf = function() {
    return this.name;
};

/**
 * @param {string} oper
 * @param {*} args
 * @constructor
 */
function LogicalExpression(oper, args) {
    this.operator = oper || '$and' ;
    this.args = args || [];
}

LogicalExpression.OperatorRegEx = /^(\$and|\$or|\$not|\$nor)$/g;

LogicalExpression.prototype.exprOf = function() {
    if (this.operator.match(LogicalExpression.OperatorRegEx)===null)
        throw new Error('Invalid logical operator.');
    if (!_.isArray(this.args))
        throw new Error('Logical expression arguments cannot be null at this context.');
    if (this.args.length===0)
        throw new Error('Logical expression arguments cannot be empty.');
    var p = {};
    p[this.operator] = [];
    for (var i = 0; i < this.args.length; i++) {
        var arg = this.args[i];
        if (typeof arg === 'undefined' || arg===null)
            p[this.operator].push(null);
        else if (typeof arg.exprOf === 'function')
            p[this.operator].push(arg.exprOf());
        else
            p[this.operator].push(arg);
    }
    return p;
};

/**
 * @class LiteralExpression
 * @param {*} value The literal value
 * @constructor
 */
function LiteralExpression(value) {
    this.value = value;
}
LiteralExpression.prototype.exprOf = function() {
    if (typeof this.value === 'undefined')
        return null;
    return this.value;
};

/**
 *
 * @param {*} left
 * @param {String=} op
 * @param {*=} right
 * @constructor
 */
function ComparisonExpression(left, op, right)
{
    this.left = left;
    this.operator = op || '$eq';
    this.right = right;
}

ComparisonExpression.OperatorRegEx = /^(\$eq|\$ne|\$lte|\$lt|\$gte|\$gt|\$in|\$nin)$/g;

ComparisonExpression.prototype.exprOf = function()
{
    if (typeof this.operator === 'undefined' || this.operator===null)
        throw new Error('Expected comparison operator.');

    if (this.left instanceof MethodCallExpression)
    {
        var p = {};
        if (typeof this.right === 'undefined' || this.right===null)
            p[this.operator]=null;
        else if (typeof this.right.exprOf === 'function')
            p[this.operator] = this.right.exprOf();
        else
            p[this.operator]=this.right;

        if (this.operator==='$eq')
            this.left.args.push(p.$eq);
        else
            this.left.args.push(p);
        //return query expression
        return this.left.exprOf();
    }
    else if (this.left instanceof ArithmeticExpression)
    {
        var p = {};
        //build comparison expression e.g. { $gt:10 }
        if (typeof this.right === 'undefined' || this.right===null)
            p[this.operator]=null;
        else if (typeof this.right.exprOf === 'function')
            p[this.operator] = this.right.exprOf();
        else
            p[this.operator]=this.right;

        //get left expression
        var expr = this.left.exprOf();
        //find argument list
        var name = Object.keys(expr)[0];
        if (this.operator==='$eq')
            expr[name][this.left.operator].push(p.$eq);
        else
            expr[name][this.left.operator].push(p);
        //return query expression
        return expr;
    }
    else if (this.left instanceof MemberExpression)
    {
        var p = {};
        //build comparison expression e.g. { $gt:10 }
        if (typeof this.right === 'undefined' || this.right===null)
            p[this.operator]=null;
        else if (typeof this.right.exprOf === 'function')
            p[this.operator] = this.right.exprOf();
        else
            p[this.operator]=this.right;
        var name = this.left.name;
        var expr = {};
        if (this.operator==='$eq')
            expr[name]=p.$eq;
        else
            expr[name] = p;
        //return query expression
        return expr;
    }
};

/**
 * Creates a method call expression
 * @class MethodCallExpression
 * @constructor
 */
function MethodCallExpression(name, args) {
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
    if (_.isArray(args))
        this.args = args;
}
/**
 * Converts the current method to the equivalent query expression e.g. { orderDate: { $year: [] } } which is equivalent with year(orderDate)
 * @returns {*}
 */
MethodCallExpression.prototype.exprOf = function() {
    var method = {};
    var result = {};
    var name = '$'.concat(this.name);
    //set arguments array
    method[name] = [] ;
    if (this.args.length===0)
        throw new Error('Unsupported method expression. Method arguments cannot be empty.');
    //get first argument
    if (this.args[0] instanceof MemberExpression) {
        var member = this.args[0].name;
        for (var i = 1; i < this.args.length; i++)
        {
            var arg = this.args[i];
            if (typeof arg === 'undefined' || arg===null)
                method[name].push(null);
            else if (typeof arg.exprOf === 'function')
                method[name].push(arg.exprOf());
            else
                method[name].push(arg);
        }
        result[member] = method;
        return result;
    }
    else {
        throw new Error('Unsupported method expression. The first argument of a method expression must be always a MemberExpression.');
    }

};

var expressions = {

    Operators : {
        Not:'$not',
        // Multiplicative
        Mul:'$mul',
        Div:'$div',
        Mod:'$mod',
        // Additive
        Add:'$add',
        Sub:'$sub',
        // Relational and type testing
        Lt:'$lt',
        Gt:'$gt',
        Le:'$lte',
        Ge:'$gte',
        // Equality
        Eq:'$eq',
        Ne:'$ne',
        // In Values
        In:'$in',
        NotIn:'$nin',
        // Conditional AND
        And:'$and',
        // Conditional OR
        Or:'$or'
    },
    /**
     * @class ArithmeticExpression
     */
    ArithmeticExpression:ArithmeticExpression,
    /**
     * @class MemberExpression
     */
    MemberExpression:MemberExpression,
    /**
     * @class MethodCallExpression
     */
    MethodCallExpression:MethodCallExpression,
    /**
     * @class ComparisonExpression
     */
    ComparisonExpression:ComparisonExpression,
    /**
     * @class LiteralExpression
     */
    LiteralExpression:LiteralExpression,
    /**
     * @class LiteralExpression
     */
    LogicalExpression:LogicalExpression,
    /**
     * @param {*=} left The left operand
     * @param {String=} operator The operator
     * @param {*=} right The right operand
     * @returns ArithmeticExpression
     */
    createArithmeticExpression : function(left, operator, right) {
        return new ArithmeticExpression(left, operator, right);
    },
    /**
     * @param {*=} left The left operand
     * @param {String=} operator The operator
     * @param {*=} right The right operand
     * @returns ComparisonExpression
     */
    createComparisonExpression : function(left, operator, right) {
        return new ComparisonExpression(left, operator, right);
    },
    /**
     * @param {String=} name A string that represents the member's name
     * @returns MemberExpression
     */
    createMemberExpression : function(name) {
        return new MemberExpression(name);
    },
    /**
     * @param {*=} value The literal value
     * @returns LiteralExpression
     */
    createLiteralExpression : function(value) {
        return new LiteralExpression(value);
    },
    /**
     * Creates a method call expression of the given name with an array of arguments
     * @param {String} name
     * @param {Array} args
     * @returns {MethodCallExpression}
     */
    createMethodCallExpression : function(name, args) {
        return new MethodCallExpression(name, args);
    },
    /**
     * Creates a logical expression
     * @param {String} operator The logical operator
     * @param {Array} args An array that represents the expression's arguments
     * @returns {LogicalExpression}
     */
    createLogicalExpression : function(operator, args) {
        return new LogicalExpression(operator, args);
    },
    /**
     * Gets a boolean value that indicates whether or not the given object is an ArithmeticExpression instance.
     * @param obj
     */
    isArithmeticExpression: function(obj) {
        return obj instanceof ArithmeticExpression;
    },
    /**
     * Gets a boolean value that indicates whether or not the given operator is an arithmetic operator.
     * @param {String} op
     */
    isArithmeticOperator: function(op) {
        if (typeof op === 'string')
            return (op.match(ArithmeticExpression.OperatorRegEx)!==null);
        return false;
    },
    /**
     * Gets a boolean value that indicates whether or not the given operator is an arithmetic operator.
     * @param {String} op
     */
    isComparisonOperator: function(op) {
        if (typeof op === 'string')
            return (op.match(ComparisonExpression.OperatorRegEx)!==null);
        return false;
    },
    /**
     * Gets a boolean value that indicates whether or not the given operator is a logical operator.
     * @param {String} op The current operator
     */
    isLogicalOperator: function(op) {
        if (typeof op === 'string')
            return (op.match(LogicalExpression.OperatorRegEx)!==null);
        return false;
    },
    /**
     * Gets a boolean value that indicates whether or not the given object is an LogicalExpression instance.
     * @param obj
     * @returns Boolean
     */
    isLogicalExpression: function(obj) {
        return obj instanceof LogicalExpression;
    },
    /**
     * Gets a boolean value that indicates whether or not the given object is an ComparisonExpression instance.
     * @param obj
     */
    isComparisonExpression: function(obj) {
        return obj instanceof ComparisonExpression;
    },
    /**
     * Gets a boolean value that indicates whether or not the given object is an MemberExpression instance.
     * @param obj
     */
    isMemberExpression: function(obj) {
        return obj instanceof MemberExpression;
    },
    /**
     * Gets a boolean value that indicates whether or not the given object is an LiteralExpression instance.
     * @param obj
     */
    isLiteralExpression: function(obj) {
        return obj instanceof LiteralExpression;
    },
    /**
     * Gets a boolean value that indicates whether or not the given object is an MemberExpression instance.
     * @param obj
     */
    isMethodCallExpression: function(obj) {
        return obj instanceof MethodCallExpression;
    }
};

if (typeof exports !== 'undefined')
{
    module.exports =  expressions;
}
