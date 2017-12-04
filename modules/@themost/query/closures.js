/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2015-03-12
 */
var expressions = require('./expressions'),
    esprima = require('esprima'),
    async = require('async'),
    _ = require('lodash');

var ExpressionTypes = {
    LogicalExpression : 'LogicalExpression',
    BinaryExpression: 'BinaryExpression',
    MemberExpression: 'MemberExpression',
    MethodExpression: 'MethodExpression',
    Identifier: 'Identifier',
    Literal: 'Literal',
    Program: 'Program',
    ExpressionStatement : 'ExpressionStatement',
    UnaryExpression:'UnaryExpression',
    FunctionExpression:'FunctionExpression',
    BlockStatement:'BlockStatement',
    ReturnStatement:'ReturnStatement',
    CallExpression:'CallExpression'
};
/**
 * @class ClosureParser
 * @constructor
 */
function ClosureParser() {
    /**
     * @type Array
     */
    this.namedParams = [];
    /**
     * @type {*}
     */
    this.parsers = { };

}
/**
 * Parses a javascript expression and returns the equivalent QueryExpression instance.
 * @param {function(*)} fn The closure expression to parse
 * @param {function(Error=,*=)} callback
 */
ClosureParser.prototype.parseFilter = function(fn, callback) {
    var self = this;
    if (typeof fn === 'undefined' || fn === null ) {
        callback();
        return;
    }
    try {
        //convert the given function to javascript expression
        var expr = esprima.parse('void(' + fn.toString() + ')');
        //get FunctionExpression
        var fnExpr = expr.body[0].expression.argument;
        if (_.isNil(fnExpr)) {
            callback(new Error('Invalid closure statement. Closure expression cannot be found.'));
            return;
        }
        //get named parameters
        self.namedParams = fnExpr.params;
        //validate expression e.g. return [EXPRESSION];
        if (fnExpr.body.body[0].type!==ExpressionTypes.ReturnStatement) {
            callback(new Error('Invalid closure syntax. A closure expression must return a value.'));
            return;
        }
        var closureExpr =  fnExpr.body.body[0].argument;
        //parse this expression
        this.parseCommon(closureExpr, function(err, result) {
            //and finally return the equivalent query expression
            if (result) {
                if (typeof result.exprOf === 'function') {
                    callback.call(self, err, result.exprOf());
                    return;
                }
            }
            callback.call(self, err, result);
        });
    }
    catch(e) {
        callback(e);
    }

};

ClosureParser.prototype.parseCommon = function(expr, callback) {
    if (expr.type === ExpressionTypes.LogicalExpression) {
        this.parseLogical(expr, callback);
    }
    else if (expr.type === ExpressionTypes.BinaryExpression) {
        this.parseBinary(expr, callback);
    }
    else if (expr.type === ExpressionTypes.Literal) {
        this.parseLiteral(expr, callback);
    }
    else if (expr.type === ExpressionTypes.MemberExpression) {
        this.parseMember(expr, callback);
    }
    else if (expr.type === ExpressionTypes.CallExpression) {
        this.parseMethod(expr, callback);
    }
    else if (expr.type === ExpressionTypes.Identifier) {
        this.parseIdentifier(expr, callback);
    }
    else {
        callback(new Error('The given expression is not yet implemented (' + expr.type + ').'));
    }
};

ClosureParser.prototype.parseLogical = function(expr, callback) {
    var self = this;
    var op = (expr.operator === '||') ? expressions.Operators.Or : expressions.Operators.And;
    //validate operands
    if (_.isNil(expr.left) || _.isNil(expr.right)) {
        callback(new Error('Invalid logical expression. Left or right operand is missig or undefined.'));
    }
    else {
        self.parseCommon(expr.left, function(err, left) {
            if (err) {
                callback(err);
            }
            else {
                self.parseCommon(expr.right, function(err, right) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        //create expression
                        callback(null, expressions.createLogicalExpression(op, [left, right]));
                    }
                });
            }
        });
    }

};
/**
 * @static
 * @param {string} op
 * @returns {*}
 */
ClosureParser.BinaryToExpressionOperator = function(op) {
  switch (op) {
      case '===':
      case '==':
          return expressions.Operators.Eq;
      case '!=':
          return expressions.Operators.Ne;
      case '>':
          return expressions.Operators.Gt;
      case '>=':
          return expressions.Operators.Ge;
      case '<':
          return expressions.Operators.Lt;
      case '<=':
          return expressions.Operators.Le;
      case '-':
          return expressions.Operators.Sub;
      case '+':
          return expressions.Operators.Add;
      case '*':
          return expressions.Operators.Mul;
      case '/':
          return expressions.Operators.Div;
      case '%':
          return expressions.Operators.Mod;
      default:
          return;
  }
};
ClosureParser.prototype.parseBinary = function(expr, callback) {
    var self = this;
    var op = ClosureParser.BinaryToExpressionOperator(expr.operator);
    if (_.isNil(op)) {
        callback(new Error('Invalid binary operator.'));
    }
    else {
        self.parseCommon(expr.left, function(err, left) {
            if (err) {
                callback(err);
            }
            else {
                self.parseCommon(expr.right, function(err, right) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        if (expressions.isArithmeticOperator(op)) {
                            //validate arithmetic arguments
                            if (expressions.isLiteralExpression(left) && expressions.isLiteralExpression(right)) {
                                //evaluate expression
                                switch (op) {
                                    case expressions.Operators.Add:
                                        callback(null, left.value + right.value);
                                        break;
                                    case expressions.Operators.Sub:
                                        callback(null, left.value - right.value);
                                        break;
                                    case expressions.Operators.Div:
                                        callback(null, left.value / right.value);
                                        break;
                                    case expressions.Operators.Mul:
                                        callback(null, left.value * right.value);
                                        break;
                                    case expressions.Operators.Mod:
                                        callback(null, left.value % right.value);
                                        break;
                                    default:
                                        callback(new Error('Invalid arithmetic operator'));
                                }
                            }
                            else {
                                callback(null, expressions.createArithmeticExpression(left, op, right));
                            }

                        }
                        else if (expressions.isComparisonOperator(op)) {
                            callback(null, expressions.createComparisonExpression(left, op, right));
                        }
                        else {
                            callback(new Error('Unsupported binary expression'));
                        }
                    }
                });
            }
        });
    }

};

function memberExpressionToString(expr) {
    if (_.isNil(expr.object.object)) {
        return expr.object.name + '.' + expr.property.name
    }
    else {
        return memberExpressionToString(expr.object) + '.' + expr.property.name;
    }
}

function parentMemberExpressionToString(expr) {
    if (_.isNil(expr.object.object)) {
        return expr.object.name;
    }
    else {
        return memberExpressionToString(expr.object);
    }
}

ClosureParser.prototype.parseMember = function(expr, callback) {
    try {
        var self = this;
        if (expr.property) {
            var namedParam = self.namedParams[0];
            if (_.isNil(namedParam)) {
                callback('Invalid or missing closure parameter');
                return;
            }
            if (expr.object.name===namedParam.name) {
                self.resolveMember(expr.property.name, function(err, member) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    callback(null, expressions.createMemberExpression(member));
                });
            }
            else {
                var value;
                if (_.isNil(expr.object.object)) {
                    //evaluate object member value e.g. item.title or item.status.id
                    value = self.eval(memberExpressionToString(expr));
                    callback(null, expressions.createLiteralExpression(value));
                    return;
                }
                if (expr.object.object.name===namedParam.name) {
                    //get closure parameter expression e.g. x.title.length
                    var property = expr.property.name;
                    self.parseMember(expr.object, function(err, result) {
                        if (err) { callback(err); return; }
                        callback(null, expressions.createMethodCallExpression(property, [result]));
                    });
                }
                else {
                    //evaluate object member value e.g. item.title or item.status.id
                    value = self.eval(memberExpressionToString(expr));
                    callback(null, expressions.createLiteralExpression(value));
                }

            }
        }
        else
            callback(new Error('Invalid member expression.'));
    }
    catch(e) {
        callback(e);
    }
};
/**
 * @private
 * @param {*} expr
 * @param {function(Error=,*=)} callback
 */
ClosureParser.prototype.parseMethodCall = function(expr, callback) {
    var self = this;
    if (_.isNil(expr.callee.object)) {
        callback(new Error('Invalid or unsupported method expression.'));
        return;
    }
    var method = expr.callee.property.name;
    self.parseMember(expr.callee.object, function(err, result) {
        if (err) { callback(err); return; }
        var args = [result];
        async.eachSeries(expr.arguments, function(arg, cb) {
            self.parseCommon(arg, function(err, result) {
                if (err) { cb(err); return; }
                args.push(result);
                cb();
            });
        }, function(err) {
            if (err) {
                callback(err);
                return;
            }
            try {
                if (typeof self.parsers[method] === 'function') {
                    self.parsers[method](method, args, callback);
                }
                else {
                    switch (method) {
                        case 'getDate': method='day';break;
                        case 'getMonth': method='month';break;
                        case 'getYear':
                        case 'getFullYear':
                            method='date';break;
                        case 'getMinutes': method='minute';break;
                        case 'getSeconds': method='second';break;
                        case 'getHours': method='hour';break;
                        case 'startsWith': method='startswith';break;
                        case 'endsWith': method='endswith';break;
                        case 'trim': method='trim';break;
                        case 'toUpperCase': method='toupper';break;
                        case 'toLowerCase': method='tolower';break;
                        case 'floor': method='floor';break;
                        case 'ceiling': method='ceiling';break;
                        case 'indexOf': method='indexof';break;
                        case 'substring':
                        case 'substr':
                            method='substring';break;
                        default:
                            callback(new Error('The specified method ('+ method +') is unsupported or is not yet implemented.'));
                            return;
                    }
                    callback(null, expressions.createMethodCallExpression(method, args));
                }

            }
            catch(e) {
                callback(e);
            }

        })

    });

};

ClosureParser.prototype.parseMethod = function(expr, callback) {

    var self = this;
    try {
        //get method name
        var name = expr.callee.name, args = [], needsEvaluation = true, thisName;
        if (_.isNil(name)) {
            if (!_.isNil(expr.callee.object)) {
                if (!_.isNil(expr.callee.object.object)) {
                    if (expr.callee.object.object.name===self.namedParams[0].name) {
                        self.parseMethodCall(expr, callback);
                        return;
                    }
                }
            }
            name = memberExpressionToString(expr.callee);
            thisName = parentMemberExpressionToString(expr.callee);
        }
        //get arguments
        async.eachSeries(expr.arguments, function(arg, cb) {
            self.parseCommon(arg, function(err, result) {
                if (err) {
                    cb(err);
                }
                else {
                    args.push(result);
                    if (!expressions.isLiteralExpression(result))
                        needsEvaluation = false;
                    cb();
                }
            });
        }, function(err) {
            try {
                if (err) { callback(err); return; }
                if (needsEvaluation) {
                    var fn = self.eval(name), thisArg;
                    if (thisName)
                        thisArg = self.eval(thisName);
                    callback(null, expressions.createLiteralExpression(fn.apply(thisArg, args.map(function(x) { return x.value; }))));
                }
                else {
                    callback(null, expressions.createMethodCallExpression(name, args));
                }
            }
            catch(e) {
                callback(e);
            }
        });
    }
    catch(e) {
        callback(e);
    }
};

/**
 * @param {*} str
 * @returns {*}
 */
ClosureParser.prototype.eval = function(str) {
    return eval.call(undefined,str);
};

ClosureParser.prototype.parseIdentifier = function(expr, callback) {
    try {
        var value = this.eval(expr.name);
        callback(null, expressions.createLiteralExpression(value));
    }
    catch (e) {
        callback(e);
    }

};

ClosureParser.prototype.parseLiteral = function(expr, callback) {
    callback(null, expressions.createLiteralExpression(expr.value));
};

/**
 * Abstract function which resolves entity based on the given member name
 * @param {string} member
 * @param {Function} callback
 */
ClosureParser.prototype.resolveMember = function(member, callback)
{
    if (typeof callback !== 'function')
    //sync process
        return member;
    else
        callback.call(this, null, member);
};

/**
 * Resolves a custom method of the given name and arguments and returns an equivalent MethodCallExpression instance.
 * @param method
 * @param args
 * @param callback
 * @returns {MethodCallExpression}
 */
ClosureParser.prototype.resolveMethod = function(method, args, callback)
{
    if (typeof callback !== 'function')
    //sync process
        return null;
    else
        callback.call(this);
};

var closures = {
    /**
     * @param {function(*)} fn The closure expression to parse
     * @param {function(Error=,*=)} callback A callback function which is going to return the equivalent QueryExpression
     */
    parseFilter: function(fn, callback) {
        var p = new ClosureParser();
        return p.parseFilter(fn, callback);
    },
    /**
     * Creates a new instance of closure parser
     * @returns {ClosureParser}
     */
    createParser: function() {
        var parser = new ClosureParser();
        parser.eval = function(o) { return eval(o); };
        return parser;
    }
};

if (typeof exports !== 'undefined')
{
    /**
     * @see closures
     */
    module.exports = closures;
}