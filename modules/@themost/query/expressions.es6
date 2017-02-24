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
import {_} from 'lodash';

const Operators = {
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
};

/**
 * @class ArithmeticExpression
 * @param {*=} p0 The left operand
 * @param {String=} oper The operator
 * @param {*=} p1 The right operand
 * @constructor
 */
export class ArithmeticExpression {

    constructor(p0, oper, p1) {
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
    static create(left, operator, right) {
        return new ArithmeticExpression(left, operator, right);
    }
    /**
     * Gets a boolean value that indicates whether or not the given operator is an arithmetic operator.
     * @param {String} op
     */
    static isArithmeticOperator(op) {
        if (typeof op === 'string')
            return (op.match(ArithmeticExpression.OperatorRegEx)!=null);
        return false;
    }

    exprOf() {
        let p;
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
        const r = {};
        if (typeof this.right === 'undefined' || this.right==null)
            r[this.operator]=[null];
        else if (typeof this.right.exprOf === 'function')
            r[this.operator] = [this.right.exprOf()];
        else
            r[this.operator]=[this.right];
        //add left operand e.g { Price: { $add:[ 5 ] } }
        const result = {};
        result[p] = r;
        //return query expression
        return result;
    }
}

ArithmeticExpression.OperatorRegEx = /^(\$add|\$sub|\$mul|\$div|\$mod)$/g;

/**
 * @class MemberExpression
 * @param {String} name The name of the current member
 * @constructor
 */
export class MemberExpression {
    constructor(name) {
        this.name = name;
    }

    exprOf() {
        return this.name;
    }

    /**
     * @param {String=} name A string that represents the member's name
     * @returns MemberExpression
     */
    static create(name) {
        return new MemberExpression(name);
    }
}

/**
 * @class LogicalExpression
 * @param {String} name The name of the current member
 * @constructor
 */
export class LogicalExpression {
    constructor(oper, args) {
        this.operator = oper || '$and' ;
        this.args = args || [];
    }

    /**
     * Creates a logical expression
     * @param {String} operator The logical operator
     * @param {Array} args An array that represents the expression's arguments
     * @returns {LogicalExpression}
     */
    static create(operator, args) {
        return new LogicalExpression(operator, args);
    }

    /**
     * Gets a boolean value that indicates whether or not the given operator is a logical operator.
     * @param {String} op The current operator
     */
    static isLogicalOperator(op) {
        if (typeof op === 'string')
            return (op.match(LogicalExpression.OperatorRegEx)!=null);
        return false;
    }

    exprOf() {
        if (this.operator.match(LogicalExpression.OperatorRegEx)==null)
            throw new Error('Invalid logical operator.');
        if (!_.isArray(this.args))
            throw new Error('Logical expression arguments cannot be null at this context.');
        if (this.args.length==0)
            throw new Error('Logical expression arguments cannot be empty.');
        const p = {};
        p[this.operator] = [];
        for (let i = 0; i < this.args.length; i++) {
            const arg = this.args[i];
            if (typeof arg === 'undefined' || arg==null)
                p[this.operator].push(null);
            else if (typeof arg.exprOf === 'function')
                p[this.operator].push(arg.exprOf());
            else
                p[this.operator].push(arg);
        }
        return p;
    }
}

LogicalExpression.OperatorRegEx = /^(\$and|\$or|\$not|\$nor)$/g;

/**
 * @class LiteralExpression
 * @param {*} value The literal value
 * @constructor
 */
export class LiteralExpression {

    constructor(value) {
        this.value = value;
    }

    /**
     * Creates a literal expression
     * @param {*=} value The literal value
     * @returns LiteralExpression
     */
    static create(value) {
        return new LiteralExpression(value);
    }

    exprOf() {
        if (typeof this.value === 'undefined')
            return null;
        return this.value;
    }
}

/**
 *
 * @param {*} left
 * @param {String=} op
 * @param {*=} right
 * @constructor
 */
export class ComparisonExpression {

    constructor(left, op, right) {
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
    static create(left, operator, right) {
        return new ComparisonExpression(left, operator, right);
    }

    /**
     * Gets a boolean value that indicates whether or not the given operator is an arithmetic operator.
     * @param {String} op
     */
    static isComparisonOperator(op) {
        if (typeof op === 'string')
            return (op.match(ComparisonExpression.OperatorRegEx)!=null);
        return false;
    }

    exprOf() {
        let p, name, expr;
        if (typeof this.operator === 'undefined' || this.operator==null)
            throw new Error('Expected comparison operator.');

        if (this.left instanceof MethodCallExpression)
        {
            p = {};
            if (typeof this.right === 'undefined' || this.right==null)
                p[this.operator]=null;
            else if (typeof this.right.exprOf === 'function')
                p[this.operator] = this.right.exprOf();
            else
                p[this.operator]=this.right;

            if (this.operator=='$eq')
                this.left.args.push(p.$eq);
            else
                this.left.args.push(p);
            //return query expression
            return this.left.exprOf();
        }
        else if (this.left instanceof ArithmeticExpression)
        {
            p = {};
            //build comparison expression e.g. { $gt:10 }
            if (typeof this.right === 'undefined' || this.right==null)
                p[this.operator]=null;
            else if (typeof this.right.exprOf === 'function')
                p[this.operator] = this.right.exprOf();
            else
                p[this.operator]=this.right;

            //get left expression
            expr = this.left.exprOf();
            //find argument list
            name = _.keys(expr)[0];
            if (this.operator=='$eq')
                expr[name][this.left.operator].push(p.$eq);
            else
                expr[name][this.left.operator].push(p);
            //return query expression
            return expr;
        }
        else if (this.left instanceof MemberExpression)
        {
            p = {};
            //build comparison expression e.g. { $gt:10 }
            if (typeof this.right === 'undefined' || this.right==null)
                p[this.operator]=null;
            else if (typeof this.right.exprOf === 'function')
                p[this.operator] = this.right.exprOf();
            else
                p[this.operator]=this.right;
            name = this.left.name;
            expr = {};
            if (this.operator=='$eq')
                expr[name]=p.$eq;
            else
                expr[name] = p;
            //return query expression
            return expr;
        }
    }
}

ComparisonExpression.OperatorRegEx = /^(\$eq|\$ne|\$lte|\$lt|\$gte|\$gt|\$in|\$nin)$/g;

/**
 * Creates a method call expression
 * @class MethodCallExpression
 * @constructor
 */
export class MethodCallExpression {
    constructor(name, args) {
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
     * Creates a method call expression of the given name with an array of arguments
     * @param {String} name
     * @param {Array} args
     * @returns {MethodCallExpression}
     */
    static create(name, args) {
        return new MethodCallExpression(name, args);
    }

    /**
     * Converts the current method to the equivalent query expression e.g. { orderDate: { $year: [] } } which is equivalent with year(orderDate)
     * @returns {*}
     */
    exprOf() {
        const method = {};
        const result = {};
        const name = '$'.concat(this.name);
        //set arguments array
        method[name] = [] ;
        if (this.args.length==0)
            throw new Error('Unsupported method expression. Method arguments cannot be empty.');
        //get first argument
        if (this.args[0] instanceof MemberExpression) {
            const member = this.args[0].name;
            for (let i = 1; i < this.args.length; i++)
            {
                const arg = this.args[i];
                if (typeof arg === 'undefined' || arg==null)
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

    }
}