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
exports.SyntaxToken = exports.IdentifierToken = exports.LiteralToken = exports.Token = exports.OpenDataParser = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _sprintf = require('sprintf');

var sprintf = _interopRequireDefault(_sprintf).default;

var _expressions = require('./expressions');

var ArithmeticExpression = _expressions.ArithmeticExpression;
var ComparisonExpression = _expressions.ComparisonExpression;
var LiteralExpression = _expressions.LiteralExpression;
var LogicalExpression = _expressions.LogicalExpression;
var MemberExpression = _expressions.MemberExpression;
var MethodCallExpression = _expressions.MethodCallExpression;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class OpenDataParser
 * @constructor
 */
var OpenDataParser = exports.OpenDataParser = function () {
    function OpenDataParser() {
        _classCallCheck(this, OpenDataParser);

        /**
         * @type {number}
         * @private
         */
        this.current = 0;
        /**
         * @type {number}
         * @private
         */
        this.offset = 0;
        /**
         * @type {string}
         */
        this.source = null;
        /**
         * @type {Array}
         */
        this.tokens = [];
        /**
         * Gets current token
         * @type {Token}
         */
        this.currentToken = undefined;
        /**
         * Gets next token
         * @type {Token}
         */
        this.nextToken = undefined;
        /**
         * Gets previous token
         * @type {Token}
         */
        this.previousToken = undefined;

        var self = this;
        Object.defineProperty(this, 'nextToken', {
            get: function get() {
                return self.offset < self.tokens.length - 1 ? self.tokens[self.offset + 1] : null;
            },
            configurable: false, enumerable: false
        });

        Object.defineProperty(this, 'previousToken', {
            get: function get() {
                return self.offset > 0 && self.tokens.length > 0 ? self.tokens[self.offset - 1] : null;
            },
            configurable: false, enumerable: false
        });

        Object.defineProperty(this, 'currentToken', {
            get: function get() {
                return self.offset < self.tokens.length ? self.tokens[self.offset] : null;
            },
            configurable: false, enumerable: false
        });
    }

    _createClass(OpenDataParser, [{
        key: 'create',
        value: function create() {
            return new OpenDataParser();
        }

        /**
         * Gets the logical or artihmetic operator of the given token
         * @param token
         */

    }, {
        key: 'getOperator',
        value: function getOperator(token) {
            if (token.type === Token.TokenType.Identifier) {
                switch (token.identifier) {
                    case "and":
                        return Token.Operator.And;
                    case "or":
                        return Token.Operator.Or;
                    case "eq":
                        return Token.Operator.Eq;
                    case "ne":
                        return Token.Operator.Ne;
                    case "lt":
                        return Token.Operator.Lt;
                    case "le":
                        return Token.Operator.Le;
                    case "gt":
                        return Token.Operator.Gt;
                    case "ge":
                        return Token.Operator.Ge;
                    case "in":
                        return Token.Operator.In;
                    case "nin":
                        return Token.Operator.NotIn;
                    case "add":
                        return Token.Operator.Add;
                    case "sub":
                        return Token.Operator.Sub;
                    case "mul":
                        return Token.Operator.Mul;
                    case "div":
                        return Token.Operator.Div;
                    case "mod":
                        return Token.Operator.Mod;
                    case "not":
                        return Token.Operator.Not;
                }
            }
            return null;
        }

        /**
         * Parses an open data filter and returns the equivalent query expression
         * @param {string} str
         * @param {Function} callback
         */

    }, {
        key: 'parse',
        value: function parse(str, callback) {
            var self = this;
            //ensure callback
            callback = callback || function () {};
            if (typeof str !== 'string') {
                callback.call(this);
                return;
            }
            /**
             * @private
             * @type {number}
             */
            this.current = 0;
            /**
             * @private
             * @type {number}
             */
            this.offset = 0;
            /**
             * Gets or sets the source expression that is going to be parsed
             * @type {String}
             */
            this.source = str;
            //get tokens
            this.tokens = this.toList();
            //reset offset
            this.offset = 0;this.current = 0;
            //invoke callback
            this.parseCommon(function (err, result) {
                try {
                    if (result) {
                        if (typeof result.exprOf === 'function') {
                            return callback.call(self, err, result.exprOf());
                        }
                    }
                    callback.call(self, err, result);
                } catch (e) {
                    callback.call(self, e);
                }
            });
        }
    }, {
        key: 'moveNext',
        value: function moveNext() {
            this.offset++;
        }

        /**
         * @param {Token} token
         */

    }, {
        key: 'expect',
        value: function expect(token) {
            var self = this;
            if (self.currentToken.valueOf() !== token.valueOf()) throw new Error(sprintf.sprintf('Expected %s.', token.valueOf()));
            this.moveNext();
        }
    }, {
        key: 'expectAny',
        value: function expectAny() {
            if (this.atEnd()) throw new Error('Unexpected end.');
        }
    }, {
        key: 'atEnd',
        value: function atEnd() {
            return this.offset >= this.tokens.length;
        }
    }, {
        key: 'atStart',
        value: function atStart() {
            return this.offset === 0;
        }

        /**
         * Parses OData token
         * @param {Function} callback
         */

    }, {
        key: 'parseCommon',
        value: function parseCommon(callback) {
            var self = this;
            //ensure callback
            callback = callback || function () {};
            if (this.tokens.length === 0) {
                callback.call(self);
                return;
            }
            self.parseCommonItem(function (err, result) {
                if (err) {
                    callback.call(self, err);
                } else {
                    if (this.atEnd()) {
                        callback.call(self, null, result);
                    }
                    //method call exception for [,] or [)] tokens e.g indexOf(Title,'...')
                    else if (this.currentToken.syntax === SyntaxToken.Comma.syntax || this.currentToken.syntax === SyntaxToken.ParenClose.syntax) {
                            callback.call(self, null, result);
                        } else {
                            var op = this.getOperator(self.currentToken);
                            if (op === null) {
                                callback.call(self, new Error('Expected operator.'));
                            } else {
                                this.moveNext();
                                this.parseCommonItem(function (err, right) {
                                    if (err) {
                                        callback.call(self, err);
                                    } else {
                                        //create odata expression
                                        var expr = self.createExpression(result, op, right);
                                        if (!self.atEnd() && LogicalExpression.isLogicalOperator(self.getOperator(self.currentToken))) {
                                            var op2 = self.getOperator(self.currentToken);
                                            self.moveNext();
                                            return self.parseCommon(function (err2, expr2) {
                                                if (err2) {
                                                    callback(err2);
                                                } else {
                                                    callback.call(self, null, self.createExpression(expr, op2, expr2));
                                                }
                                            });
                                        }
                                        callback.call(self, null, expr);
                                    }
                                });
                            }
                        }
                }
            });
        }

        /**
         * @param {*=} left The left operand
         * @param {String=} operator The operator
         * @param {*=} right The right operand
         */

    }, {
        key: 'createExpression',
        value: function createExpression(left, operator, right) {
            var expr = null;
            if (LogicalExpression.isLogicalOperator(operator)) {
                if (left instanceof LogicalExpression) {
                    if (left.operator === operator) {
                        expr = LogicalExpression.create(operator);
                        for (var i = 0; i < left.args.length; i++) {
                            var o = left.args[i];
                            expr.args.push(o);
                        }
                        expr.args.push(right);
                    } else {
                        expr = LogicalExpression.create(operator, [left, right]);
                    }
                } else {
                    expr = LogicalExpression.create(operator, [left, right]);
                }
                return expr;
            } else if (LogicalExpression.isLogicalOperator(operator)) {
                return ArithmeticExpression.create(left, operator, right);
            } else if (left instanceof ArithmeticExpression || left instanceof MethodCallExpression || left instanceof MemberExpression) {
                expr = ComparisonExpression.create(left, operator, right);
                return expr;
            } else if (ComparisonExpression.isComparisonOperator(operator)) {
                return ComparisonExpression.create(left, operator, right);
            } else {
                throw new Error('Invalid or unsupported expression arguments.');
            }
        }

        /**
         * 
         * @param {Function} callback
         */

    }, {
        key: 'parseCommonItem',
        value: function parseCommonItem(callback) {
            var self = this;
            //ensure callback
            callback = callback || function () {};
            if (self.tokens.length === 0) {
                callback.call(self);
                return;
            }
            switch (this.currentToken.type) {
                case Token.TokenType.Identifier:
                    //if next token is an open parenthesis token and the current token is not an operator. current=indexOf, next=(
                    if (self.nextToken.syntax === SyntaxToken.ParenOpen.syntax && self.getOperator(self.currentToken) === null) {
                        //then parse method call
                        self.parseMethodCall(callback);
                    } else if (self.getOperator(self.currentToken) === Token.Operator.Not) {
                        callback.call(self, new Error('Not operator is not yet implemented.'));
                        return;
                    } else {
                        self.parseMember(function (err, result) {
                            if (err) {
                                callback.call(self, err);
                            } else {
                                while (!self.atEnd() && self.currentToken.syntax === SyntaxToken.Slash.syntax) {
                                    //self.moveNext();
                                    //self.parseMembers(callback)
                                    callback.call(self, new Error('Slash syntax is not yet implemented.'));
                                }
                            }
                            self.moveNext();
                            callback.call(self, null, result);
                        });
                    }
                    break;
                case Token.TokenType.Literal:
                    var value = self.currentToken.value;
                    self.moveNext();
                    callback.call(self, null, value);
                    break;
                case Token.TokenType.Syntax:
                    if (self.currentToken.syntax === SyntaxToken.Negative.syntax) {
                        callback.call(self, new Error('Negative syntax is not yet implemented.'));
                        return;
                    }
                    if (self.currentToken.syntax === SyntaxToken.ParenOpen.syntax) {
                        self.moveNext();
                        self.parseCommon(function (err, result) {
                            if (err) {
                                callback.call(self, err);
                            } else {
                                self.expect(SyntaxToken.ParenClose);
                                callback.call(self, null, result);
                            }
                        });
                    } else {
                        callback.call(self, new Error('Expected syntax.'));
                        return;
                    }
                    break;
                default:
                    break;
            }
        }
    }, {
        key: 'parseMethodCall',
        value: function parseMethodCall(callback) {
            var self = this;
            //ensure callback
            callback = callback || function () {};
            if (this.tokens.length === 0) callback.call(this);else {
                //get method name
                var method = self.currentToken.identifier;
                self.moveNext();
                self.expect(SyntaxToken.ParenOpen);
                var args = [];
                self.parseMethodCallArguments(args, function (err, result) {
                    if (err) {
                        callback.call(self, err);
                    } else {
                        self.resolveMethod(method, args, function (err, expr) {
                            if (err) {
                                callback.call(self, err);
                            } else {
                                if (typeof expr === 'undefined' || expr === null) callback.call(self, null, MethodCallExpression.create(method, args));else callback.call(self, null, expr);
                            }
                        });
                    }
                });
            }
        }
    }, {
        key: 'parseMethodCallArguments',
        value: function parseMethodCallArguments(args, callback) {
            var self = this;
            //ensure callback
            callback = callback || function () {};
            args = args || [];
            self.expectAny();
            if (self.currentToken.syntax === SyntaxToken.Comma.syntax) {
                self.moveNext();
                self.expectAny();
                self.parseMethodCallArguments(args, callback);
            } else if (self.currentToken.syntax === SyntaxToken.ParenClose.syntax) {
                self.moveNext();
                callback(null, arguments);
            } else {
                self.parseCommon(function (err, result) {
                    if (err) {
                        callback(err);
                    } else {
                        args.push(result);
                        self.parseMethodCallArguments(args, callback);
                    }
                });
            }
        }
        /**
         *
         * @param {Function} callback
         */

    }, {
        key: 'parseMember',
        value: function parseMember(callback) {
            var self = this;
            //ensure callback
            callback = callback || function () {};
            if (this.tokens.length === 0) {
                callback.call(this);
            } else {
                if (this.currentToken.type !== 'Identifier') {
                    callback.call(self, new Error('Expected identifier.'));
                } else {
                    var identifier = this.currentToken.identifier;
                    while (this.nextToken.syntax === SyntaxToken.Slash.syntax) {
                        //read syntax token
                        this.moveNext();
                        //get next token
                        if (this.nextToken.type !== 'Identifier') callback.call(self, new Error('Expected identifier.'));
                        //read identifier token
                        this.moveNext();
                        //format identifier
                        identifier += '/' + this.currentToken.identifier;
                    }
                    //search for multiple nested member expression (e.g. a/b/c)

                    self.resolveMember(identifier, function (err, member) {
                        callback.call(self, err, new MemberExpression(member));
                    });
                }
            }
        }

        /**
         * Abstract function which resolves entity based on the given member name
         * @param {string} member
         * @param {Function} callback
         */

    }, {
        key: 'resolveMember',
        value: function resolveMember(member, callback) {
            if (typeof callback !== 'function')
                //sync process
                return member;else callback.call(this, null, member);
        }

        /**
         * Resolves a custom method of the given name and arguments and returns an equivalent MethodCallExpression instance.
         * @param method
         * @param args
         * @param {Function} callback
         * @returns {MethodCallExpression}
         */

    }, {
        key: 'resolveMethod',
        value: function resolveMethod(method, args, callback) {
            if (typeof callback !== 'function')
                //sync process
                return null;else callback.call(this);
        }

        ///**
        // * Resolves an equivalent expressiob based on the given OData token
        // * @param {Token} token
        // */
        //OpenDataParser.prototype.resolveVariable = function(token, callback) {
        //    return null;
        //};

        /**
         * Get a collection of tokens by parsing the curent expression
         * @returns {Array}
         */

    }, {
        key: 'toList',
        value: function toList() {
            if (typeof this.source !== 'string') return [];
            this.current = 0;
            this.offset = 0;
            var result = [];
            var token = void 0;
            while ((token = this.getNext()) !== null) {
                result.push(token);
            }
            return result;
        }

        /**
         * @returns Token
         */

    }, {
        key: 'getNext',
        value: function getNext() {
            var _current = this.current;
            var _source = this.source;
            var _offset = this.offset;

            if (_offset >= _source.length) return null;

            while (_offset < _source.length && OpenDataParser.isWhitespace(_source.charAt(_offset))) {
                _offset++;
            }
            if (_offset >= _source.length) return null;
            _current = _offset;
            this.current = _current;
            var c = _source.charAt(_current);
            switch (c) {
                case '-':
                    return this.parseSign();

                case '\'':
                    return this.parseString(0);

                case '(':
                case ')':
                case ',':
                case '/':
                    return this.parseSyntax();
                default:
                    if (OpenDataParser.isDigit(c)) {
                        return this.parseNumeric();
                    } else if (OpenDataParser.isIdentifierStartChar(c)) {
                        return this.parseIdentifier(false);
                    } else {
                        throw new Error(sprintf.sprintf('Unexpecter character "%s" at offset %s.', c, _current));
                    }
            }
        }

        /**
         * @returns {Token}
         */

    }, {
        key: 'parseSyntax',
        value: function parseSyntax() {
            /**
             * @type {Token}
             */
            var token = null;
            switch (this.source.charAt(this.current)) {
                case '(':
                    token = SyntaxToken.ParenOpen;break;
                case ')':
                    token = SyntaxToken.ParenClose;break;
                case '/':
                    token = SyntaxToken.Slash;break;
                case ',':
                    token = SyntaxToken.Comma;break;
                default:
                    throw new Error('Unknown token');
            }
            this.offset = this.current + 1;

            return token;
        }

        /**
         * @returns {Token}
         */

    }, {
        key: 'parseIdentifier',
        value: function parseIdentifier(minus) {
            var _current = this.current;
            var _source = this.source;
            var _offset = this.offset;

            for (_current++; _current < _source.length; _current++) {
                var c = _source.charAt(_current);
                if (OpenDataParser.isIdentifierChar(c) === false) break;
            }

            var name = _source.substr(_offset, _current - _offset).trim();

            var lastOffset = _offset;
            _offset = _current;
            switch (name) {
                case "INF":
                    this.current = _current;this.offset = _offset;
                    return LiteralToken.PositiveInfinity;

                case "-INF":
                    this.current = _current;this.offset = _offset;
                    return LiteralToken.NegativeInfinity;

                case "Nan":
                    this.current = _current;this.offset = _offset;
                    return LiteralToken.NaN;

                case "true":
                    this.current = _current;this.offset = _offset;
                    return LiteralToken.True;

                case "false":
                    this.current = _current;this.offset = _offset;
                    return LiteralToken.False;

                case "null":
                    this.current = _current;this.offset = _offset;
                    return LiteralToken.Null;

                case "-":
                    this.current = _current;this.offset = _offset;
                    return SyntaxToken.Negative;

                default:
                    if (minus) {
                        // Reset the offset.
                        _offset = lastOffset + 1;
                        this.current = _current;this.offset = _offset;
                        return SyntaxToken.Negative;
                    }
                    this.current = _current;this.offset = _offset;
                    break;
            }
            if (_offset < _source.length && _source.charAt(_offset) === '\'') {
                var stringType = void 0;
                switch (name) {
                    case "X":
                        stringType = LiteralToken.StringType.Binary;break;
                    case "binary":
                        stringType = LiteralToken.StringType.Binary;break;
                    case "datetime":
                        stringType = LiteralToken.StringType.DateTime;break;
                    case "guid":
                        stringType = LiteralToken.StringType.Guid;break;
                    case "time":
                        stringType = LiteralToken.StringType.Time;break;
                    case "datetimeoffset":
                        LiteralToken.StringType = StringType.DateTimeOffset;break;
                    default:
                        stringType = LiteralToken.StringType.None;break;
                }

                if (stringType !== LiteralToken.StringType.None && _source.charAt(_offset) == '\'') {
                    var content = this.parseString();
                    return this.parseSpecialString(content.value, stringType);
                }
            }
            return new IdentifierToken(name);
        }

        /**
         * Parses a guid string and returns an open data token.
         * @returns Token
         */

    }, {
        key: 'parseGuidString',
        value: function parseGuidString(value) {
            if (typeof value !== 'string') throw new Error(sprintf.sprintf('Invalid argument at %s.', this.offset));
            if (value.match(OpenDataParser.GuidRegex) !== null) throw new Error(sprintf.sprintf('Guid format is invalid at %s.', this.offset));
            return new LiteralToken(value, LiteralType.Guid);
        }

        /**
         * Parses a time string and returns an open data token.
         * @returns Token
         */

    }, {
        key: 'parseTimeString',
        value: function parseTimeString(value) {
            if (typeof value === 'undefined' || value === null) return null;
            var match = value.match(OpenDataParser.DurationRegex);
            if (match !== null) {
                var negative = match[1] === "-";
                var year = match[2].length > 0 ? parseInt(match[2]) : 0,
                    month = match[3].length > 0 ? parseInt(match[3]) : 0,
                    day = match[4].length > 0 ? parseInt(match[4]) : 0,
                    hour = match[5].length > 0 ? parseInt(match[5]) : 0,
                    minute = match[6].length > 0 ? parseInt(match[6]) : 0,
                    second = match[7].length > 0 ? parseFloat(match[7]) : 0;
                return new LiteralToken(new TimeSpan(!negative, year, month, day, hour, minute, second), LiteralType.Duration);
            } else {
                throw new Error(sprintf.sprintf('Duration format is invalid at %s.', this.offset));
            }
        }

        /**
         * Parses a date time offset string and returns an open data token
         * @param value
         * @returns {LiteralToken}
         */

    }, {
        key: 'parseBinaryString',
        value: function parseBinaryString(value) {
            throw new Error('Not Implemented');
        }

        /**
         * Parses a date time offset string and returns an open data token
         * @param value
         * @returns {LiteralToken}
         */

    }, {
        key: 'parseDateTimeOffsetString',
        value: function parseDateTimeOffsetString(value) {
            return this.parseDateTimeString(value);
        }

        /**
         * Parses a date time string and returns an open data token
         * @param value
         * @returns {LiteralToken}
         */

    }, {
        key: 'parseDateTimeString',
        value: function parseDateTimeString(value) {
            if (typeof value === 'undefined' || value === null) return null;
            var match = value.match(OpenDataParser.DateTimeRegex);
            if (match !== null) {
                var year = parseInt(match[1]),
                    month = parseInt(match[2]),
                    day = parseInt(match[3]),
                    hour = parseInt(match[4]),
                    minute = parseInt(match[5]),
                    second = match[6].length > 0 ? parseInt(match[6]) : 0,
                    nanoSecond = match[7].length > 0 ? parseInt(match[7]) : 0;
                return new LiteralToken(new Date(year, month, day, hour, minute, second), LiteralType.DateTime);
            } else {
                throw new Error(sprintf.sprintf('Datetime format is invalid at %s.', this.offset));
            }
        }

        /**
         * @returns Token
         */

    }, {
        key: 'parseSpecialString',
        value: function parseSpecialString(value, stringType) {
            switch (stringType) {
                case LiteralToken.StringType.Binary:
                    return this.parseBinaryString(value);

                case LiteralToken.StringType.DateTime:
                    return this.parseDateTimeString(value);

                case LiteralToken.StringType.DateTimeOffset:
                    return this.parseDateTimeOffsetString(value);

                case LiteralToken.StringType.Guid:
                    return this.parseGuidString(value);

                case LiteralToken.StringType.Time:
                    return this.parseTimeString(value);

                default:
                    throw new Error('Argument stringType was out of range.');
            }
        }

        /**
         * @returns {Token}
         */

    }, {
        key: 'parseString',
        value: function parseString() {
            var hadEnd = false;
            var _current = this.current;
            var _source = this.source;
            var _offset = this.offset;
            var sb = '';
            for (_current++; _current < _source.length; _current++) {
                var c = this.source.charAt(_current);

                if (c === '\'') {
                    if (_current < _source.length - 1 && _source.charAt(_current + 1) === '\'') {
                        _current++;
                        sb += '\'';
                    } else {
                        hadEnd = true;
                        break;
                    }
                } else {
                    sb += c;
                }
            }

            if (!hadEnd) {
                throw new Error(sprintf.sprintf('Unterminated string starting at %s', _offset));
            }
            this.current = _current;
            this.offset = _current + 1;
            return new LiteralToken(sb, LiteralToken.LiteralType.String);
        }
    }, {
        key: 'skipDigits',
        value: function skipDigits(current) {
            var _source = this.source,
                _offset = this.offset;
            if (!OpenDataParser.isDigit(_source.charAt(current))) return null;
            current++;
            while (current < _source.length && OpenDataParser.isDigit(_source.charAt(current))) {
                current++;
            }
            return current;
        }

        /**
         * @returns {Token}
         */

    }, {
        key: 'parseNumeric',
        value: function parseNumeric() {
            var _current = this.current;
            var _source = this.source;
            var _offset = this.offset;
            var floating = false;
            var c = null;

            for (_current++; _current < _source.length; _current++) {
                c = _source.charAt(_current);
                if (c === OpenDataParser.CHR_POINT) {
                    if (floating) break;
                    floating = true;
                } else if (!OpenDataParser.isDigit(c)) {
                    break;
                }
            }
            var haveExponent = false;
            if (_current < _source.length) {
                c = _source.charAt(_current);
                if (c === 'E' || c === 'e') {
                    _current++;
                    if (_source.charAt(_current) === '-') _current++;
                    var exponentEnd = _current === _source.length ? null : this.skipDigits(_current);
                    if (exponentEnd === null) throw new Error(sprintf.sprintf('Expected digits after exponent at %s.', _offset));
                    _current = exponentEnd;
                    haveExponent = true;

                    if (_current < _source.length) {
                        c = _source.charAt(_current);
                        if (c === 'm' || c === 'M') throw new Error(sprintf.sprintf('Unexpected exponent for decimal literal at %s.', _offset));else if (c === 'l' || c === 'L') throw new Error(sprintf.sprintf('Unexpected exponent for long literal at %s.', _offset));
                    }
                }
            }

            var text = _source.substr(_offset, _current - _offset);
            var value = null;
            var type = null;

            if (_current < _source.length) {
                c = _source.charAt(_current);

                switch (c) {
                    case 'F':
                    case 'f':
                        value = parseFloat(text);
                        type = LiteralToken.LiteralType.Single;
                        _current++;
                        break;

                    case 'D':
                    case 'd':
                        value = parseFloat(text);
                        type = LiteralToken.LiteralType.Double;
                        _current++;
                        break;

                    case 'M':
                    case 'm':
                        value = parseFloat(text);
                        type = LiteralToken.LiteralType.Decimal;
                        _current++;
                        break;

                    case 'L':
                    case 'l':
                        value = parseInt(text);
                        type = LiteralToken.LiteralType.Long;
                        _current++;
                        break;

                    default:
                        if (floating || haveExponent) {
                            value = parseFloat(text);
                            type = LiteralToken.LiteralType.Double;
                        } else {
                            value = parseInt(text);
                            type = LiteralToken.LiteralType.Int;
                        }
                        break;
                }
            } else {
                if (floating || haveExponent) {
                    value = parseFloat(text);
                    type = LiteralToken.LiteralType.Double;
                } else {
                    value = parseInt(text);
                    type = LiteralToken.LiteralType.Int;
                }
            }

            _offset = _current;
            this.offset = _offset;
            this.current = _current;
            return new LiteralToken(value, type);
        }

        /**
         * @returns {Token}
         */

    }, {
        key: 'parseSign',
        value: function parseSign() {
            this.current++;
            if (OpenDataParser.isDigit(this.source.charAt(this.current))) return this.parseNumeric();else return this.parseIdentifier(true);
        }

        /**
         * @param {String} c
         * @returns {boolean}
         */

    }], [{
        key: 'isChar',
        value: function isChar(c) {
            return c.match(OpenDataParser.REGEXP_CHAR) !== null;
        }

        /**
         * @param {String} c
         * @returns {boolean}
         */

    }, {
        key: 'isDigit',
        value: function isDigit(c) {
            return c.match(OpenDataParser.REGEXP_DIGIT) !== null;
        }
    }, {
        key: 'isIdentifierStartChar',
        value: function isIdentifierStartChar(c) {
            return c === OpenDataParser.CHR_UNDERSCORE || c === OpenDataParser.CHR_DOLLARSIGN || OpenDataParser.isChar(c);
        }

        /**
          * @param {String} c
         * @returns {boolean}
         */

    }, {
        key: 'isWhitespace',
        value: function isWhitespace(c) {
            return c === OpenDataParser.CHR_WHITESPACE;
        }
    }, {
        key: 'isIdentifierChar',
        value: function isIdentifierChar(c) {
            return OpenDataParser.isIdentifierStartChar(c) || OpenDataParser.isDigit(c);
        }
    }]);

    return OpenDataParser;
}();

OpenDataParser.ArithmeticOperatorRegEx = /^(\$add|\$sub|\$mul|\$div|\$mod)$/g;
OpenDataParser.LogicalOperatorRegEx = /^(\$or|\$nor|\$not|\$and)$/g;

OpenDataParser.DurationRegex = /^(-)?P(?:(\\d+)Y)?(?:(\\d+)M)?(?:(\\d+)D)?T?(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+(?:\\.\\d*)?)S)?$/g;
OpenDataParser.GuidRegex = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/g;
OpenDataParser.DateTimeRegex = /^(\\d{4})-(\\d{1,2})-(\\d{1,2})T(\\d{1,22}):(\\d{2})(?::(\\d{2})(?:\\.(\\d{7}))?)?$/g;

OpenDataParser.REGEXP_CHAR = /[a-zA-Z]/g;
OpenDataParser.REGEXP_DIGIT = /[0-9]/g;
OpenDataParser.CHR_WHITESPACE = ' ';
OpenDataParser.CHR_UNDERSCORE = '_';
OpenDataParser.CHR_DOLLARSIGN = '$';
OpenDataParser.CHR_POINT = '.';

var TimeSpan = function () {
    function TimeSpan() {
        _classCallCheck(this, TimeSpan);
    }

    _createClass(TimeSpan, [{
        key: 'toString',
        value: function toString() {}
    }]);

    return TimeSpan;
}();

/**
 * @class Token
 * @abstract Toke
 * @param {String} tokenType
 * @constructor
 */


var Token = exports.Token = function () {
    function Token(tokenType) {
        _classCallCheck(this, Token);

        this.type = tokenType;
    }

    _createClass(Token, [{
        key: 'isParenOpen',
        value: function isParenOpen() {
            return this.type === 'Syntax' && this.syntax === '(';
        }
    }, {
        key: 'isParenClose',
        value: function isParenClose() {
            return this.type === 'Syntax' && this.syntax === ')';
        }
    }, {
        key: 'isSlash',
        value: function isSlash() {
            return this.type === 'Syntax' && this.syntax === '/';
        }
    }, {
        key: 'isComma',
        value: function isComma() {
            return this.type === 'Syntax' && this.syntax === ',';
        }
    }, {
        key: 'isNegative',
        value: function isNegative() {
            return this.type === 'Syntax' && this.syntax === '-';
        }
    }]);

    return Token;
}();

Token.TokenType = {
    Literal: 'Literal',
    Identifier: 'Identifier',
    Syntax: 'Syntax'
};

Token.Operator = {
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
 * @class LiteralToken
 * @param {*} value
 * @param {String} literalType
 * @constructor
 */

var LiteralToken = exports.LiteralToken = function (_Token) {
    _inherits(LiteralToken, _Token);

    function LiteralToken(value, literalType) {
        _classCallCheck(this, LiteralToken);

        var _this = _possibleConstructorReturn(this, (LiteralToken.__proto__ || Object.getPrototypeOf(LiteralToken)).call(this, Token.TokenType.Literal));

        _this.value = value;
        _this.literalType = literalType;
        return _this;
    }

    return LiteralToken;
}(Token);

LiteralToken.LiteralType = {
    Null: 'Null',
    String: 'String',
    Boolean: 'Boolean',
    Single: 'Single',
    Double: 'Double',
    Decimal: 'Decimal',
    Int: 'Int',
    Long: 'Long',
    Binary: 'Binary',
    DateTime: 'DateTime',
    Guid: 'Guid',
    Duration: 'Duration'
};

LiteralToken.StringType = {
    None: 'None',
    Binary: 'Binary',
    DateTime: 'DateTime',
    Guid: 'Guid',
    Time: 'Time',
    DateTimeOffset: 'DateTimeOffset'
};

LiteralToken.PositiveInfinity = new LiteralToken(NaN, LiteralToken.LiteralType.Double);
LiteralToken.NegativeInfinity = new LiteralToken(NaN, LiteralToken.LiteralType.Double);
LiteralToken.NaN = new LiteralToken(NaN, LiteralToken.LiteralType.Double);
LiteralToken.True = new LiteralToken(true, LiteralToken.LiteralType.Boolean);
LiteralToken.False = new LiteralToken(false, LiteralToken.LiteralType.Boolean);
LiteralToken.Null = new LiteralToken(null, LiteralToken.LiteralType.Null);

/**
 * @class IdentifierToken
 * @param {String} The identifier's name
 * @constructor
 */

var IdentifierToken = exports.IdentifierToken = function (_Token2) {
    _inherits(IdentifierToken, _Token2);

    function IdentifierToken(name) {
        _classCallCheck(this, IdentifierToken);

        var _this2 = _possibleConstructorReturn(this, (IdentifierToken.__proto__ || Object.getPrototypeOf(IdentifierToken)).call(this, Token.TokenType.Identifier));

        _this2.identifier = name;
        return _this2;
    }

    _createClass(IdentifierToken, [{
        key: 'valueOf',
        value: function valueOf() {
            return this.identifier;
        }
    }]);

    return IdentifierToken;
}(Token);

/**
 * @class SyntaxToken
 * @param {String} chr
 * @constructor
 */


var SyntaxToken = exports.SyntaxToken = function (_Token3) {
    _inherits(SyntaxToken, _Token3);

    function SyntaxToken(chr) {
        _classCallCheck(this, SyntaxToken);

        var _this3 = _possibleConstructorReturn(this, (SyntaxToken.__proto__ || Object.getPrototypeOf(SyntaxToken)).call(this, Token.TokenType.Syntax));

        _this3.syntax = chr;
        return _this3;
    }

    _createClass(SyntaxToken, [{
        key: 'valueOf',
        value: function valueOf() {
            return this.syntax;
        }
    }]);

    return SyntaxToken;
}(Token);

SyntaxToken.ParenOpen = new SyntaxToken('(');
SyntaxToken.ParenClose = new SyntaxToken(')');
SyntaxToken.Slash = new SyntaxToken('/');
SyntaxToken.Comma = new SyntaxToken(',');
SyntaxToken.Negative = new SyntaxToken('-');
//# sourceMappingURL=odata.js.map
