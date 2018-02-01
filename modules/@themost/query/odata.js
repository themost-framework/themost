/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-02-15
 */
var _ = require("lodash");
var LangUtils = require("@themost/common/utils").LangUtils;
var sprintf = require('sprintf').sprintf;
var expressions = require('./expressions');
/**
 * @class
 * @constructor
 */
function OpenDataParser() {

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
    Object.defineProperty(this,'nextToken', {
        get:function() {
            return (self.offset < self.tokens.length - 1) ? self.tokens[self.offset+1] : null;
        },
        configurable:false, enumerable:false
    });

    Object.defineProperty(this,'previousToken', {
        get:function() {
            return ((self.offset > 0) && (self.tokens.length>0)) ? self.tokens[self.offset-1] : null;
    },
    configurable:false, enumerable:false
    });

    Object.defineProperty(this,'currentToken', {
        get:function() {
            return (self.offset < self.tokens.length) ? self.tokens[self.offset] : null;
    },
    configurable:false, enumerable:false
    });

}

/**
 * Creates a new instance of OpenDataParser class
 * @return {OpenDataParser}
 */
OpenDataParser.create = function() {
    return new OpenDataParser();
};

/**
 * Gets the logical or arithmetic operator of the given token
 * @param token
 */
OpenDataParser.prototype.getOperator = function(token) {
    if (token.type===Token.TokenType.Identifier) {
        switch (token.identifier)
        {
            case "and": return Token.Operator.And;
            case "or": return Token.Operator.Or;
            case "eq": return Token.Operator.Eq;
            case "ne": return Token.Operator.Ne;
            case "lt": return Token.Operator.Lt;
            case "le": return Token.Operator.Le;
            case "gt": return Token.Operator.Gt;
            case "ge": return Token.Operator.Ge;
            case "in": return Token.Operator.In;
            case "nin": return Token.Operator.NotIn;
            case "add": return Token.Operator.Add;
            case "sub": return Token.Operator.Sub;
            case "mul": return Token.Operator.Mul;
            case "div": return Token.Operator.Div;
            case "mod": return Token.Operator.Mod;
            case "not": return Token.Operator.Not;
        }
    }
    return null;
};
OpenDataParser.ArithmeticOperatorRegEx = /^(\$add|\$sub|\$mul|\$div|\$mod)$/g;
OpenDataParser.LogicalOperatorRegEx = /^(\$or|\$nor|\$not|\$and)$/g;

/**
 * Parses an open data filter and returns the equivalent query expression
 * @param {String} str
 * @param {Function} callback
 */
OpenDataParser.prototype.parse = function(str, callback) {
    var self = this;
    //ensure callback
    callback = callback || function() {};
    if (typeof str !== 'string')
    {
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
    this.offset=0; this.current=0;
    //invoke callback
    this.parseCommon(function(err, result)
    {
        try {
            if (result) {
                if (typeof result.exprOf === 'function') {
                    return callback.call(self, err, result.exprOf());
                }
            }
            callback.call(self, err, result);
        }
        catch(e) {
            callback.call(self, e);
        }
    });

};

OpenDataParser.prototype.moveNext = function() {
   this.offset++;
};
/**
 * @param {Token} token
 */
OpenDataParser.prototype.expect = function(token) {
    var self = this;
    if (self.currentToken.valueOf()!==token.valueOf())
        throw new Error(sprintf('Expected %s.', token.valueOf()));
    this.moveNext();
};

OpenDataParser.prototype.expectAny = function() {
    if (this.atEnd())
        throw new Error('Unexpected end.');
};


OpenDataParser.prototype.atEnd = function() {
    return this.offset >= this.tokens.length;
};
//noinspection JSUnusedGlobalSymbols
OpenDataParser.prototype.atStart = function() {
    return this.offset === 0;
};

/**
 * Parses OData token
 * @param {Function} callback
 */
OpenDataParser.prototype.parseCommon = function(callback) {
    var self = this;
    //ensure callback
    callback = callback || function() {};
    if (self.tokens.length===0) {
        return callback.call(self);
    }
    self.parseCommonItem(function(err, result) {
        if (err) {
            callback.call(self, err);
        }
        else {
            if (self.atEnd()) {
                callback.call(self, null, result);
            }
            //method call exception for [,] or [)] tokens e.g indexOf(Title,'...')
            else if ((self.currentToken.syntax===SyntaxToken.Comma.syntax) ||
                (self.currentToken.syntax===SyntaxToken.ParenClose.syntax)) {
                callback.call(self, null, result);
            }
            else {
                var op = self.getOperator(self.currentToken);
                if (op===null) {
                    callback.call(self, new Error('Expected operator.'));
                }
                else {
                    self.moveNext();
                    self.parseCommonItem(function(err, right) {
                        if (err) {
                            callback.call(self, err);
                        }
                        else {
                            //create odata expression
                            var expr = self.createExpression(result, op, right);
                            if (!self.atEnd() && (expressions.isLogicalOperator(self.getOperator(self.currentToken)))) {
                                var op2 = self.getOperator(self.currentToken);
                                self.moveNext();
                                return self.parseCommon(function(err, result) {
                                    if (err) {
                                        return callback(err);
                                    }
                                    else {
                                        return callback.call(self, null, self.createExpression(expr, op2, result));
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
};
/**
 * @param {*=} left The left operand
 * @param {String=} operator The operator
 * @param {*=} right The right operand
 */
OpenDataParser.prototype.createExpression = function(left, operator, right) {

    if (expressions.isLogicalOperator(operator))
    {
        var expr = null;
        if (expressions.isLogicalExpression(left))
        {
            if (left.operator===operator) {
                expr = expressions.createLogicalExpression(operator);
                for (var i = 0; i < left.args.length; i++) {
                    var o = left.args[i];
                    expr.args.push(o);
                }
                expr.args.push(right);
            }
            else {
                expr = expressions.createLogicalExpression(operator, [left, right]);
            }
        }
        else
        {
            expr = expressions.createLogicalExpression(operator, [left, right]);
        }
        return expr;
    }
    else if (expressions.isArithmeticOperator(operator)) {
        return expressions.createArithmeticExpression(left, operator, right);
    }
    else if (expressions.isArithmeticExpression(left) || expressions.isMethodCallExpression(left) || expressions.isMemberExpression(left))  {
            return expressions.createComparisonExpression(left, operator, right);
    }
    else if (expressions.isComparisonOperator(operator)) {
        return expressions.createComparisonExpression(left,operator, right);
    }
    else {
        throw new Error('Invalid or unsupported expression arguments.');
    }
};

OpenDataParser.prototype.parseCommonItem = function(callback) {
    var self = this;
    //ensure callback
    callback = callback || function() {};
    if (self.tokens.length===0) {
        return callback.call(self);
    }
    switch (this.currentToken.type) {
        case Token.TokenType.Identifier:
            //if next token is an open parenthesis token and the current token is not an operator. current=indexOf, next=(
            if ((self.nextToken.syntax===SyntaxToken.ParenOpen.syntax) && (_.isNil(self.getOperator(self.currentToken))))
            {
                //then parse method call
                self.parseMethodCall(callback);
            }
            else if (self.getOperator(self.currentToken) === Token.Operator.Not)
            {
                callback.call(self,new Error('Not operator is not yet implemented.'));
                return;
            }
            else
            {
                self.parseMember(function(err, result) {
                    if (err) {
                        callback.call(self,err);
                    }
                    else {
                        while (!self.atEnd() && self.currentToken.syntax===SyntaxToken.Slash.syntax) {
                            //self.moveNext();
                            //self.parseMembers(callback)
                            callback.call(self,new Error('Slash syntax is not yet implemented.'));
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
                callback.call(self,new Error('Negative syntax is not yet implemented.'));
                return;
            }
            if (self.currentToken.syntax === SyntaxToken.ParenOpen.syntax) {
                self.moveNext();
                self.parseCommon(function(err, result) {
                    if (err) {
                        callback.call(self, err);
                    }
                    else {
                        self.expect(SyntaxToken.ParenClose);
                        callback.call(self, null, result);
                    }
                });
            }
            else {
                return callback.call(self,new Error('Expected syntax.'));
            }
            break;
        default:break;
    }

};

OpenDataParser.prototype.parseMethodCall = function(callback) {
    var self = this;
    //ensure callback
    callback = callback || function() {};
    if (this.tokens.length===0)
        callback.call(this);
    else
    {
        //get method name
        var method = self.currentToken.identifier;
        self.moveNext();
        self.expect(SyntaxToken.ParenOpen);
        var args = [];
        self.parseMethodCallArguments(args, function(err, result) {
            if (err) {
                callback.call(self, err);
            }
            else {
                self.resolveMethod(method, args, function(err, expr) {
                   if (err) {
                       callback.call(self, err);
                   }
                   else {
                       if (_.isNil(expr))
                           callback.call(self, null, expressions.createMethodCallExpression(method, args));
                       else
                           callback.call(self, null, expr);
                   }
                });

            }
        });
    }
};

OpenDataParser.prototype.parseMethodCallArguments = function(args, callback) {
    var self = this;
    //ensure callback
    callback = callback || function() {};
    args = args || [];
    self.expectAny();
    if (self.currentToken.syntax===SyntaxToken.Comma.syntax) {
        self.moveNext();
        self.expectAny();
        self.parseMethodCallArguments(args, callback);
    }
    else if (self.currentToken.syntax===SyntaxToken.ParenClose.syntax) {
        self.moveNext();
        callback(null, arguments);
    }
    else {
        self.parseCommon(function(err, result) {
            if (err) {
                callback(err);
            }
            else {
                args.push(result);
                self.parseMethodCallArguments(args, callback);
            }
        });
    }

};

OpenDataParser.prototype.parseMember = function(callback) {
    var self = this;
    //ensure callback
    callback = callback || function() {};
    if (this.tokens.length===0) {
        callback.call(this);
    }
    else {
        if (this.currentToken.type!=='Identifier') {
            callback.call(self, new Error('Expected identifier.'));
        }
        else {
            var identifier = this.currentToken.identifier;
            while (this.nextToken && this.nextToken.syntax===SyntaxToken.Slash.syntax) {
                //read syntax token
                this.moveNext();
                //get next token
                if (this.nextToken.type !== 'Identifier')
                    callback.call(self, new Error('Expected identifier.'));
                //read identifier token
                this.moveNext();
                //format identifier
                identifier += '/' + this.currentToken.identifier;
            }
            //support member to member comparison (with $it identifier e.g. $it/address/city or $it/category etc)
            if (/^\$it\//.test(identifier)) {
                identifier= identifier.replace(/^\$it\//,'');
            }
            //search for multiple nested member expression (e.g. a/b/c)
            self.resolveMember(identifier, function(err, member) {
                callback.call(self, err,expressions.createMemberExpression(member));
            });
        }
    }
};

/**
 * Abstract function which resolves entity based on the given member name
 * @param {string} member
 * @param {Function} callback
 */
OpenDataParser.prototype.resolveMember = function(member, callback)
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
OpenDataParser.prototype.resolveMethod = function(method, args, callback)
{
    if (typeof callback !== 'function')
        //sync process
        return null;
    else
        callback.call(this);
};
///**
// * Resolves an equivalent expression based on the given OData token
// * @param {Token} token
// */
//OpenDataParser.prototype.resolveVariable = function(token, callback) {
//    return null;
//};

/**
 * Get a collection of tokens by parsing the current expression
 * @returns {Array}
 */
OpenDataParser.prototype.toList = function() {
    if (typeof this.source !== 'string')
        return [];
    this.current = 0;
    this.offset = 0;
    var result = [];
    var token = this.getNext();
    while (token)
    {
        result.push(token);
        token = this.getNext();
    }
    return result;
};

/**
 * @returns Token
 */
OpenDataParser.prototype.getNext = function() {

    var _current = this.current, _source = this.source, _offset = this.offset;

    if (_offset >= _source.length)
        return null;

    while (_offset < _source.length && OpenDataParser.isWhitespace(_source.charAt(_offset)))
    {
        _offset++;
    }
    if (_offset >= _source.length)
        return null;
    _current = _offset;
    this.current = _current;
    var c = _source.charAt(_current);
    switch (c)
    {
        case '-':
            return this.parseSign();

        case '\'':
            return this.parseString();

        case '(':
        case ')':
        case ',':
        case '/':
            return this.parseSyntax();
        default:
            if (OpenDataParser.isDigit(c))
            {
                return this.parseNumeric();
            }
            else if (OpenDataParser.isIdentifierStartChar(c))
            {
                return this.parseIdentifier(false);
            }
            else
            {
                throw new Error(sprintf('Unexpected character "%s" at offset %s.', c , _current));
            }
    }
};

/**
 * @returns {Token}
 */
OpenDataParser.prototype.parseSyntax = function()
{
    /**
     * @type {Token}
     */
    var token = null;
    switch (this.source.charAt(this.current))
    {
        case '(': token = SyntaxToken.ParenOpen; break;
        case ')': token = SyntaxToken.ParenClose; break;
        case '/': token = SyntaxToken.Slash; break;
        case ',': token = SyntaxToken.Comma; break;
        default : throw new Error('Unknown token');
    }
    this.offset = this.current + 1;

    return token;
};


/**
 * @returns {Token}
 */
OpenDataParser.prototype.parseIdentifier = function(minus)
{
    var _current = this.current, _source = this.source, _offset = this.offset;

    for (_current++; _current < _source.length; _current++)
    {
        var c = _source.charAt(_current);
        if (OpenDataParser.isIdentifierChar(c)===false)
            break;
    }

    var name = _source.substr(_offset, _current - _offset).trim();

    var lastOffset = _offset;
    _offset = _current;
    switch (name)
    {
        case "INF":
            this.current = _current;this.offset=_offset;
            return LiteralToken.PositiveInfinity;

        case "-INF":
            this.current = _current;this.offset=_offset;
            return LiteralToken.NegativeInfinity;

        case "Nan":
            this.current = _current;this.offset=_offset;
            return LiteralToken.NaN;

        case "true":
            this.current = _current;this.offset=_offset;
            return LiteralToken.True;

        case "false":
            this.current = _current;this.offset=_offset;
            return LiteralToken.False;

        case "null":
            this.current = _current;this.offset=_offset;
            return LiteralToken.Null;

        case "-":
            this.current = _current;this.offset=_offset;
            return SyntaxToken.Negative;

        default:
            if (minus) {
                // Reset the offset.
                _offset = lastOffset + 1;
                this.current = _current;this.offset=_offset;
                return SyntaxToken.Negative;
            }
            this.current = _current;this.offset=_offset;
            break;
    }
    if (_offset < _source.length && _source.charAt(_offset) === '\'')
    {
        var stringType;
        switch (name)
        {
            case "X": stringType = LiteralToken.StringType.Binary; break;
            case "binary": stringType = LiteralToken.StringType.Binary; break;
            case "datetime": stringType = LiteralToken.StringType.DateTime; break;
            case "guid": stringType = LiteralToken.StringType.Guid; break;
            case "time": stringType = LiteralToken.StringType.Time; break;
            case "datetimeoffset": stringType = LiteralToken.StringType.DateTimeOffset; break;
            default: stringType = LiteralToken.StringType.None; break;
        }

        if (stringType !== LiteralToken.StringType.None && _source.charAt(_offset) === '\'')
        {
            var content = this.parseString();
            return this.parseSpecialString(content.value, stringType);
        }
    }
    return new IdentifierToken(name);
};

OpenDataParser.DurationRegex = /^(-)?P(?:(\\d+)Y)?(?:(\\d+)M)?(?:(\\d+)D)?T?(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+(?:\\.\\d*)?)S)?$/g;
OpenDataParser.GuidRegex = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/g;
OpenDataParser.DateTimeRegex = /^(\d{4})(?:-?W(\d+)(?:-?(\d+)D?)?|(?:-(\d+))?-(\d+))(?:[T ](\d+):(\d+)(?::(\d+)(?:\.(\d+))?)?)?(?:Z(-?\d*))?$/;

/**
 * Parses a guid string and returns an open data token.
 * @returns Token
 */
OpenDataParser.prototype.parseGuidString = function(value)
{
    if (typeof value !== 'string')
        throw new Error(sprintf('Invalid argument at %s.', this.offset));
    if (_.isNil(value.match(OpenDataParser.GuidRegex)))
        throw new Error(sprintf('Guid format is invalid at %s.', this.offset));
    return new LiteralToken(value, LiteralToken.LiteralType.Guid);
};

/**
 * Parses a time string and returns an open data token.
 * @returns Token
 */
OpenDataParser.prototype.parseTimeString = function(value) {
    if (typeof value === 'undefined' || value===null)
        return null;
    var match = value.match(OpenDataParser.DurationRegex);
    if (match)
    {
        var negative = (match[1] === "-");
        var year = match[2].length > 0 ? parseInt(match[2]) : 0,
            month = match[3].length > 0 ? parseInt(match[3]) : 0,
            day = match[4].length > 0 ? parseInt(match[4]) : 0,
            hour = match[5].length > 0 ? parseInt(match[5]) : 0,
            minute = match[6].length > 0 ? parseInt(match[6]) : 0,
            second = match[7].length > 0 ? parseFloat(match[7]) : 0;
        return new LiteralToken(new TimeSpan(!negative, year, month, day, hour, minute, second), LiteralToken.LiteralType.Duration);
    }
    else
    {
        throw new Error(sprintf('Duration format is invalid at %s.', this.offset))
    }
};

/**
 * Parses a date time offset string and returns an open data token
 * @param value
 * @returns {LiteralToken}
 */
// eslint-disable-next-line no-unused-vars
OpenDataParser.prototype.parseBinaryString = function(value) {
    throw new Error('Not Implemented');
};

/**
 * Parses a date time offset string and returns an open data token
 * @param value
 * @returns {LiteralToken}
 */
OpenDataParser.prototype.parseDateTimeOffsetString = function(value) {
    return this.parseDateTimeString(value);
};

/**
 * Parses a date time string and returns an open data token
 * @param value
 * @returns {LiteralToken}
 */
OpenDataParser.prototype.parseDateTimeString = function(value) {
    if (_.isNil(value))
        return null;
    var match = value.match(OpenDataParser.DateTimeRegex);
    if (match)
    {
        return new LiteralToken(new Date(value), LiteralToken.LiteralType.DateTime);
    }
    else
    {
        throw new Error(sprintf('Datetime format is invalid at %s.', this.offset))
    }
};

/**
 * @returns Token
 */
OpenDataParser.prototype.parseSpecialString = function(value, stringType)
{
    switch (stringType)
    {
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
};

/**
 * @returns {Token}
 */
OpenDataParser.prototype.parseString = function()
{
    var hadEnd = false;
    var _current = this.current, _source = this.source, _offset = this.offset;
    var sb = '';
    for (_current++; _current < _source.length; _current++)
    {
        var c = this.source.charAt(_current);

        if (c === '\'')
        {
            if ((_current < _source.length - 1) && (_source.charAt(_current+1) === '\'')) {
                _current++;
                sb += '\'';
            }
            else
            {
                hadEnd = true;
                break;
            }
        }
        else
        {
            sb +=c;
        }
    }

    if (!hadEnd)
    {
        throw new Error(sprintf('Unterminated string starting at %s', _offset));
    }
    this.current = _current;
    this.offset = _current + 1;
    return new LiteralToken(sb, LiteralToken.LiteralType.String);
};

OpenDataParser.prototype.skipDigits = function(current)
{
    var _source = this.source, _offset = this.offset;
    if (!OpenDataParser.isDigit(_source.charAt(current)))
        return null;
    current++;
    while (current < _source.length && OpenDataParser.isDigit(_source.charAt(current))) {
        current++;
    }
    return current;
};

/**
 * @returns {Token}
 */
OpenDataParser.prototype.parseNumeric = function()
{
    var _current = this.current, _source = this.source, _offset = this.offset;
    var floating = false;
    var c = null;

    for (_current++; _current < _source.length; _current++)
    {
        c = _source.charAt(_current);
        if (c === OpenDataParser.CHR_POINT)
        {
            if (floating)
                break;
            floating = true;
        }
        else if (!OpenDataParser.isDigit(c))
        {
            break;
        }
    }
    var haveExponent = false;
    if (_current < _source.length)
    {
        c = _source.charAt(_current);
        if (c === 'E' || c === 'e')
        {
            _current++;
            if (_source.charAt(_current) === '-')
                _current++;
            var exponentEnd = (_current === _source.length) ? null : this.skipDigits(_current);
            if (_.isNil(exponentEnd))
                throw new Error(sprintf('Expected digits after exponent at %s.', _offset));
            _current = exponentEnd;
            haveExponent = true;

            if (_current < _source.length) {
                c = _source.charAt(_current);
                if (c === 'm' || c === 'M')
                    throw new Error(sprintf('Unexpected exponent for decimal literal at %s.', _offset));
                else if (c === 'l' || c === 'L')
                    throw new Error(sprintf('Unexpected exponent for long literal at %s.', _offset));
            }
        }
    }

    var text = _source.substr(_offset, _current - _offset);
    var value = null;
    var type = null;

    if (_current < _source.length)
    {
        c = _source.charAt(_current);

        switch (c)
        {
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
                if (floating || haveExponent)
                {
                    value = parseFloat(text);
                    type = LiteralToken.LiteralType.Double;
                }
                else
                {
                    value = parseInt(text);
                    type = LiteralToken.LiteralType.Int;
                }
                break;
        }
    }
    else
    {
        if (floating || haveExponent)
        {
            value = parseFloat(text);
            type = LiteralToken.LiteralType.Double;
        }
        else
        {
            value = parseInt(text);
            type = LiteralToken.LiteralType.Int;
        }
    }

    _offset = _current;
    this.offset = _offset;
    this.current = _current;
    return new LiteralToken(value, type);
};

/**
 * @returns {Token}
 */
OpenDataParser.prototype.parseSign = function()
{
    this.current++;
    if (OpenDataParser.isDigit(this.source.charAt(this.current)))
        return this.parseNumeric();
    else
        return this.parseIdentifier(true);
};

OpenDataParser.REGEXP_CHAR = /[a-zA-Z]/g;
OpenDataParser.REGEXP_DIGIT = /[0-9]/g;
OpenDataParser.CHR_WHITESPACE = ' ';
OpenDataParser.CHR_UNDERSCORE = '_';
OpenDataParser.CHR_DOLLARSIGN = '$';
OpenDataParser.CHR_POINT = '.';
/**
 * @param {String} c
 * @returns {boolean}
 */
OpenDataParser.isChar = function(c)
{
    return !!c.match(OpenDataParser.REGEXP_CHAR);
};

/**
 * @param {String} c
 * @returns {boolean}
 */
OpenDataParser.isDigit = function(c)
{
    return !!c.match(OpenDataParser.REGEXP_DIGIT);
};

OpenDataParser.isIdentifierStartChar = function(c)
{
    return (c === OpenDataParser.CHR_UNDERSCORE) || (c === OpenDataParser.CHR_DOLLARSIGN) || OpenDataParser.isChar(c);
};
/**
  * @param {String} c
 * @returns {boolean}
 */
OpenDataParser.isWhitespace = function(c)
{
    return (c === OpenDataParser.CHR_WHITESPACE);
};

OpenDataParser.isIdentifierChar = function(c)
{
    return OpenDataParser.isIdentifierStartChar(c) || OpenDataParser.isDigit(c);
};

function TimeSpan(positive, years, months, days, hours, minutes, seconds) {

}

TimeSpan.prototype.toString = function() {

};

/**
 * @class Token
 * @abstract Toke
 * @param {String} tokenType
 * @constructor
 */
function Token(tokenType)
{
    this.type = tokenType;
}

/**
 *
 * @returns {boolean}
 */
//noinspection JSUnusedGlobalSymbols
Token.prototype.isParenOpen = function() {
    return (this.type==='Syntax') && (this.syntax==='(');
};
/**
 *
 * @returns {boolean}
 */
//noinspection JSUnusedGlobalSymbols
Token.prototype.isParenClose = function() {
    return (this.type==='Syntax') && (this.syntax===')');
};
/**
 *
 * @returns {boolean}
 */
//noinspection JSUnusedGlobalSymbols
Token.prototype.isSlash = function() {
    return (this.type==='Syntax') && (this.syntax==='/');
};
/**
 *
 * @returns {boolean}
 */
//noinspection JSUnusedGlobalSymbols
Token.prototype.isComma = function() {
    return (this.type==='Syntax') && (this.syntax===',');
};
/**
 *
 * @returns {boolean}
 */
//noinspection JSUnusedGlobalSymbols
Token.prototype.isNegative = function() {
    return (this.type==='Syntax') && (this.syntax==='-');
};

Token.TokenType = {
    Literal : 'Literal',
    Identifier: 'Identifier',
    Syntax: 'Syntax'
};

Token.Operator ={
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
 * @class LiteralToken
 * @param {*} value
 * @param {String} literalType
 * @constructor
 */
function LiteralToken(value, literalType)
{
    LiteralToken.super_.call(this, Token.TokenType.Literal);
    this.value = value;
    this.literalType = literalType;
}
LangUtils.inherits(LiteralToken, Token);

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
    Duration:'Duration'
};

LiteralToken.StringType =
{
    None:'None',
    Binary:'Binary',
    DateTime:'DateTime',
    Guid:'Guid',
    Time:'Time',
    DateTimeOffset:'DateTimeOffset'
};

LiteralToken.PositiveInfinity = new LiteralToken(NaN, LiteralToken.LiteralType.Double);
LiteralToken.NegativeInfinity = new LiteralToken(NaN, LiteralToken.LiteralType.Double);
LiteralToken.NaN = new LiteralToken(NaN, LiteralToken.LiteralType.Double);
LiteralToken.True = new LiteralToken(true, LiteralToken.LiteralType.Boolean);
LiteralToken.False = new LiteralToken(false, LiteralToken.LiteralType.Boolean);
LiteralToken.Null = new LiteralToken(null, LiteralToken.LiteralType.Null);


/**
 * @class IdentifierToken
 * @param {string} name The identifier's name
 * @constructor
 */
function IdentifierToken(name)
{
    IdentifierToken.super_.call(this, Token.TokenType.Identifier);
    this.identifier = name;
}
LangUtils.inherits(IdentifierToken, Token);

IdentifierToken.prototype.valueOf = function() {
    return this.identifier;
};

/**
 * @class SyntaxToken
 * @param {String} chr
 * @constructor
 */
function SyntaxToken(chr)
{
    SyntaxToken.super_.call(this, Token.TokenType.Syntax);
    this.syntax = chr;
}

LangUtils.inherits(SyntaxToken, Token);

SyntaxToken.prototype.valueOf = function() {
    return this.syntax;
};

SyntaxToken.ParenOpen = new SyntaxToken('(');
SyntaxToken.ParenClose = new SyntaxToken(')');
SyntaxToken.Slash = new SyntaxToken('/');
SyntaxToken.Comma = new SyntaxToken(',');
SyntaxToken.Negative = new SyntaxToken('-');

if (typeof exports !== 'undefined')
{
    /**
     * @param {string} str The open data filter expression
     * @param {Function} callback
     * @returns {*} The equivalent query expression
     */
    module.exports.parse = function(str, callback) {
        var p = new OpenDataParser();
        return p.parse(str, callback);
    };
    /**
     * Creates a new instance of OData parser
     * @returns {OpenDataParser}
     */
    module.exports.createParser = function() {
        return OpenDataParser.create();
    };
    module.exports.OpenDataParser = OpenDataParser;
}
