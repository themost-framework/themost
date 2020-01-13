/**
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var xmlCommon = require('./common'),
    xmlUtil = require('./util');

/**
 * Shallow-copies an array to the end of another array
 * Basically Array.concat, but works with other non-array collections
 * @param {Array} dst
 * @param {Array} src
 * */
function copyArray(dst, src) {
    if (!src) return;
    var dstLength = dst.length;
    for (var i = src.length - 1; i >= 0; --i) {
        dst[i + dstLength] = src[i];
    }
}

/**
 * This is an optimization for copying attribute lists in IE. IE includes many
 * extraneous properties in its DOM attribute lists, which take require
 * significant extra processing when evaluating attribute steps. With this
 * function, we ignore any such attributes that has an empty string value.
 * @param {Array} dst
 * @param {Array} src
 */
function copyArrayIgnoringAttributesWithoutValue(dst, src) {
    if (!src) return;
    for (var i = src.length - 1; i >= 0; --i) {
        // this test will pass so long as the attribute has a non-empty string
        // value, even if that value is "false", "0", "undefined", etc.
        if (src[i].nodeValue) {
            dst.push(src[i]);
        }
    }
}

/**
 * Reverses the given array in place.
 * @param {Array} array
 */
function reverseInplace(array) {
    for (var i = 0; i < array.length / 2; ++i) {
        var h = array[i];
        var ii = array.length - i - 1;
        array[i] = array[ii];
        array[ii] = h;
    }
}

/**
 * @param {boolean} b
 */
function assert(b) {
    if (!b) {
        throw "Assertion failed";
    }
}


function xpathParse(expr) {
    xpathParseInit();

    var cached = xpathCacheLookup(expr);
    if (cached) {
        return cached;
    }

    // Optimize for a few common cases: simple attribute node tests
    // (@id), simple element node tests (page), variable references
    // ($address), numbers (4), multi-step path expressions where each
    // step is a plain element node test
    // (page/overlay/locations/location).
    var ret;
    if (expr.match(/^([$@])?\w+$/i)) {
        ret = makeSimpleExpr(expr);
        xpathParseCache[expr] = ret;
        return ret;
    }

    if (expr.match(/^\w+(\/\w+)*$/i)) {
        ret = makeSimpleExpr2(expr);
        xpathParseCache[expr] = ret;
        return ret;
    }

    var cachekey = expr; // expr is modified during parse

    var stack = [];
    var ahead = null;
    var previous = null;
    var done = false;

    var result;
    while (!done) {
        expr = expr.replace(/^\s*/, '');
        previous = ahead;
        ahead = null;

        var rule = null;
        var match = '';
        for (var i = 0; i < xpathTokenRules.length; ++i) {
            result = xpathTokenRules[i].re.exec(expr);
            if (result && result.length > 0 && result[0].length > match.length) {
                rule = xpathTokenRules[i];
                match = result[0];
                break;
            }
        }

        // Special case: allow operator keywords to be element and
        // variable names.

        // NOTE(mesch): The parser resolves conflicts by looking ahead,
        // and this is the only case where we look back to
        // disambiguate. So this is indeed something different, and
        // looking back is usually done in the lexer (via states in the
        // general case, called "start conditions" in flex(1)). Also,the
        // conflict resolution in the parser is not as robust as it could
        // be, so I'd like to keep as much off the parser as possible (all
        // these precedence values should be computed from the grammar
        // rules and possibly associativity declarations, as in bison(1),
        // and not explicitly set.

        if (rule &&
            (rule === TOK_DIV ||
                rule === TOK_MOD ||
                rule === TOK_AND ||
                rule === TOK_OR) &&
            (!previous ||
                previous.tag === TOK_AT ||
                previous.tag === TOK_DSLASH ||
                previous.tag === TOK_SLASH ||
                previous.tag === TOK_AXIS ||
                previous.tag === TOK_DOLLAR)) {
            rule = TOK_QNAME;
        }

        if (rule) {
            expr = expr.substr(match.length);
            ahead = {
                tag: rule,
                match: match,
                prec: rule.prec ? rule.prec : 0, // || 0 is removed by the compiler
                expr: makeTokenExpr(match)
            };

        } else {
            done = true;
        }

        while (xpathReduce(stack, ahead)) {
            //
        }
    }
    // DGF any valid XPath should "reduce" to a single Expr token
    if (stack.length !== 1) {
        throw 'XPath parse error ' + cachekey + ':\n' + stackToString(stack);
    }

    result = stack[0].expr;
    xpathParseCache[cachekey] = result;
    return result;
}

var xpathParseCache = {};

function xpathCacheLookup(expr) {
    return xpathParseCache[expr];
}

/*DGF xpathReduce is where the magic happens in this parser.
 Skim down to the bottom of this file to find the table of
 grammatical rules and precedence numbers, "The productions of the grammar".

 The idea here
 is that we want to take a stack of tokens and apply
 grammatical rules to them, "reducing" them to higher-level
 tokens.  Ultimately, any valid XPath should reduce to exactly one
 "Expr" token.

 Reduce too early or too late and you'll have two tokens that can't reduce
 to single Expr.  For example, you may hastily reduce a qname that
 should name a function, incorrectly treating it as a tag name.
 Or you may reduce too late, accidentally reducing the last part of the
 XPath into a top-level "Expr" that won't reduce with earlier parts of
 the XPath.

 A "cand" is a grammatical rule candidate, with a given precedence
 number.  "ahead" is the upcoming token, which also has a precedence
 number.  If the token has a higher precedence number than
 the rule candidate, we'll "shift" the token onto the token stack,
 instead of immediately applying the rule candidate.

 Some tokens have left associativity, in which case we shift when they
 have LOWER precedence than the candidate.
 */
function xpathReduce(stack, ahead) {
    var cand = null;

    if (stack.length > 0) {
        var top = stack[stack.length - 1];
        var ruleset = xpathRules[top.tag.key];
        var i;
        if (ruleset) {
            for (i = 0; i < ruleset.length; ++i) {
                var rule = ruleset[i];
                var match = xpathMatchStack(stack, rule[1]);
                if (match.length) {
                    cand = {
                        tag: rule[0],
                        rule: rule,
                        match: match
                    };
                    cand.prec = xpathGrammarPrecedence(cand);
                    break;
                }
            }
        }
    }

    var ret;
    if (cand && (!ahead || cand.prec > ahead.prec ||
            (ahead.tag.left && cand.prec >= ahead.prec))) {
        for (i = 0; i < cand.match.matchlength; ++i) {
            stack.pop();
        }

        var matchexpr = xmlUtil.mapExpr(cand.match, function (m) {
            return m.expr;
        });
        cand.expr = cand.rule[3].apply(null, matchexpr);

        stack.push(cand);
        ret = true;

    } else {
        if (ahead) {
            stack.push(ahead);
        }
        ret = false;
    }
    return ret;
}

function xpathMatchStack(stack, pattern) {

    // NOTE(mesch): The stack matches for variable cardinality are
    // greedy but don't do backtracking. This would be an issue only
    // with rules of the form A* A, i.e. with an element with variable
    // cardinality followed by the same element. Since that doesn't
    // occur in the grammar at hand, all matches on the stack are
    // unambiguous.

    var S = stack.length;
    var P = pattern.length;
    var p, s;
    var match = [];
    match.matchlength = 0;
    var ds = 0;
    for (p = P - 1, s = S - 1; p >= 0 && s >= 0; --p, s -= ds) {
        ds = 0;
        var qmatch = [];
        if (pattern[p] === Q_MM) {
            p -= 1;
            match.push(qmatch);
            while (s - ds >= 0 && stack[s - ds].tag === pattern[p]) {
                qmatch.push(stack[s - ds]);
                ds += 1;
                match.matchlength += 1;
            }

        } else if (pattern[p] === Q_01) {
            p -= 1;
            match.push(qmatch);
            while (s - ds >= 0 && ds < 2 && stack[s - ds].tag === pattern[p]) {
                qmatch.push(stack[s - ds]);
                ds += 1;
                match.matchlength += 1;
            }

        } else if (pattern[p] === Q_1M) {
            p -= 1;
            match.push(qmatch);
            if (stack[s].tag === pattern[p]) {
                while (s - ds >= 0 && stack[s - ds].tag === pattern[p]) {
                    qmatch.push(stack[s - ds]);
                    ds += 1;
                    match.matchlength += 1;
                }
            } else {
                return [];
            }

        } else if (stack[s].tag === pattern[p]) {
            match.push(stack[s]);
            ds += 1;
            match.matchlength += 1;

        } else {
            return [];
        }

        reverseInplace(qmatch);
        qmatch.expr = xmlUtil.mapExpr(qmatch, function (m) {
            return m.expr;
        });
    }

    reverseInplace(match);

    if (p === -1) {
        return match;

    } else {
        return [];
    }
}

function xpathTokenPrecedence(tag) {
    return (tag.prec || 2);
}

function xpathGrammarPrecedence(frame) {
    var ret = 0;
    var p;
    if (frame.rule) { /* normal reduce */
        if (frame.rule.length >= 3 && frame.rule[2] >= 0) {
            ret = frame.rule[2];

        } else {
            for (var i = 0; i < frame.rule[1].length; ++i) {
                p = xpathTokenPrecedence(frame.rule[1][i]);
                ret = Math.max(ret, p);
            }
        }
    } else if (frame.tag) { /* TOKEN match */
        ret = xpathTokenPrecedence(frame.tag);

    } else if (frame.length) { /* Q_ match */
        for (var j = 0; j < frame.length; ++j) {
            p = xpathGrammarPrecedence(frame[j]);
            ret = Math.max(ret, p);
        }
    }

    return ret;
}

function stackToString(stack) {
    var ret = '';
    for (var i = 0; i < stack.length; ++i) {
        if (ret) {
            ret += '\n';
        }
        ret += stack[i].tag.label;
    }
    return ret;
}


// XPath expression evaluation context. An XPath context consists of a
// DOM node, a list of DOM nodes that contains this node, a number
// that represents the position of the single node in the list, and a
// current set of variable bindings. (See XPath spec.)
//
// The interface of the expression context:
//
//   Constructor -- gets the node, its position, the node set it
//   belongs to, and a parent context as arguments. The parent context
//   is used to implement scoping rules for variables: if a variable
//   is not found in the current context, it is looked for in the
//   parent context, recursively. Except for node, all arguments have
//   default values: default position is 0, default node set is the
//   set that contains only the node, and the default parent is null.
//
//     Notice that position starts at 0 at the outside interface;
//     inside XPath expressions this shows up as position()=1.
//
//   clone() -- creates a new context with the current context as
//   parent. If passed as argument to clone(), the new context has a
//   different node, position, or node set. What is not passed is
//   inherited from the cloned context.
//
//   setVariable(name, expr) -- binds given XPath expression to the
//   name.
//
//   getVariable(name) -- what the name says.
//
//   setNode(position) -- sets the context to the node at the given
//   position. Needed to implement scoping rules for variables in
//   XPath. (A variable is visible to all subsequent siblings, not
//   only to its children.)
//
//   set/isCaseInsensitive -- specifies whether node name tests should
//   be case sensitive.  If you're executing xpaths against a regular
//   HTML DOM, you probably don't want case-sensitivity, because
//   browsers tend to disagree about whether elements & attributes
//   should be upper/lower case.  If you're running xpaths in an
//   XSLT instance, you probably DO want case sensitivity, as per the
//   XSL spec.
/**
 *
 * @param {XNode} node
 * @param {Integer=} opt_position
 * @param {*=} opt_nodelist
 * @param {*=} opt_parent
 * @param {Boolean=} opt_caseInsensitive
 * @param {Boolean=} opt_ignoreAttributesWithoutValue
 * @constructor
 */
function ExprContext(node, opt_position, opt_nodelist, opt_parent, opt_caseInsensitive, opt_ignoreAttributesWithoutValue) {
    if (node === undefined)
        return;
    this.initialize(node, opt_position, opt_nodelist, opt_parent, opt_caseInsensitive, opt_ignoreAttributesWithoutValue);
    /**
     * @type {Array}
     * @private
     */
    this._functions = [];
}

/**
 *
 * @param {XNode} node
 * @param opt_position
 * @param opt_nodelist
 * @param opt_parent
 * @param opt_caseInsensitive
 * @param opt_ignoreAttributesWithoutValue
 */
ExprContext.prototype.initialize = function (node, opt_position, opt_nodelist, opt_parent, opt_caseInsensitive, opt_ignoreAttributesWithoutValue) {
    this.node = node;
    this.position = opt_position || 0;
    this.nodelist = opt_nodelist || [node];
    this.variables = {};
    this.parent = opt_parent || null;
    this.caseInsensitive = opt_caseInsensitive || false;
    this.ignoreAttributesWithoutValue = opt_ignoreAttributesWithoutValue || false;
    if (opt_parent) {
        this.root = opt_parent.root;
    } else if (this.node.nodeType === xmlCommon.DOM_DOCUMENT_NODE) {
        // NOTE: DOM Spec stipulates that the ownerDocument of a
        // document is null. Our root, however is the document that we are
        // processing, so the initial context is created from its document
        // node, which case we must handle here explcitly.
        this.root = node;
    } else {
        this.root = node.ownerDocument;
    }
};
// noinspection JSUnusedGlobalSymbols
/**
 * Resolves a function reference and returns an function representing the xslt function
 * */
ExprContext.prototype.resolveFunction = function (f) {
    this.invokeFunction = f;
};
// noinspection JSUnusedGlobalSymbols
/**
 * Registers XPath function class based on the specified prefix e.g. ns:count, ns:resolve etc.
 * @param {String} prefix - The function context prefix
 * @param {Object} obj The object that contains the functions we want to register
 */
ExprContext.prototype.setFunctionContext = function (prefix, obj) {
    var fn = null;
    if (typeof this._functions === 'undefined' || this._functions === null)
        this._functions = [];
    if (this._functions.length > 0) {
        for (var i = 0; i < this._functions.length; i++) {
            if (this._functions[i].prefix === prefix) {
                fn = this._functions[i];
                break;
            }
        }
    }
    if (fn === null)
        this._functions.push({prefix: prefix, instance: obj});
    else
        fn.instance = obj;
};

ExprContext.prototype.getFunctionContext = function (prefix) {
    if (typeof this._functions === 'undefined' || this._functions === null)
        return null;
    if (!xmlUtil.isArray(this._functions))
        return null;
    var fn = null;
    for (var i = 0; i < this._functions.length; i++) {
        if (this._functions[i].prefix === prefix) {
            fn = this._functions[i];
            break;
        }
    }
    if (fn === null)
        return null;
    return fn.instance;
};

ExprContext.prototype.clone = function (opt_node, opt_position, opt_nodelist) {
    return new ExprContext(
        opt_node || this.node,
        typeof opt_position !== 'undefined' ? opt_position : this.position,
        opt_nodelist || this.nodelist, this, this.caseInsensitive,
        this.ignoreAttributesWithoutValue);
};
// noinspection JSUnusedGlobalSymbols
ExprContext.prototype.setVariable = function (name, value) {
    if (value instanceof StringValue || value instanceof BooleanValue ||
        value instanceof NumberValue || value instanceof NodeSetValue) {
        this.variables[name] = value;
        return;
    }
    if ('true' === value) {
        this.variables[name] = new BooleanValue(true);
    } else if ('false' === value) {
        this.variables[name] = new BooleanValue(false);
    } else if (TOK_NUMBER.re.test(value)) {
        this.variables[name] = new NumberValue(value);
    } else {
        // DGF What if it's null?
        this.variables[name] = new StringValue(value);
    }
};

ExprContext.prototype.getVariable = function (name) {
    if (typeof this.variables[name] !== 'undefined') {
        return this.variables[name];

    } else if (this.parent) {
        return this.parent.getVariable(name);

    } else {
        return null;
    }
};

ExprContext.prototype.setNode = function (position) {
    this.node = this.nodelist[position];
    this.position = position;
};

ExprContext.prototype.contextSize = function () {
    return this.nodelist.length;
};
// noinspection JSUnusedGlobalSymbols
ExprContext.prototype.isCaseInsensitive = function () {
    return this.caseInsensitive;
};
// noinspection JSUnusedGlobalSymbols
ExprContext.prototype.setCaseInsensitive = function (caseInsensitive) {
    return this.caseInsensitive = caseInsensitive;
};
// noinspection JSUnusedGlobalSymbols
ExprContext.prototype.isIgnoreAttributesWithoutValue = function () {
    return this.ignoreAttributesWithoutValue;
};
// noinspection JSUnusedGlobalSymbols
ExprContext.prototype.setIgnoreAttributesWithoutValue = function (ignore) {
    return this.ignoreAttributesWithoutValue = ignore;
};
/**
 * Parses and then evaluates the given XPath expression.
 * @param {String} select An XPATH expression
 * @param {Array=} ns - An array of namespaces that are used by the given expression
 * @returns {Object} An object that represents the result of the given expression
 */
ExprContext.prototype.evaluate = function (select, ns) {
    if (ns !== undefined)
        return xpathEval(select, this, ns);
    return xpathEval(select, this);
};

// XPath expression values. They are what XPath expressions evaluate
// to. Strangely, the different value types are not specified in the
// XPath syntax, but only in the semantics, so they don't show up as
// nonterminals in the grammar. Yet, some expressions are required to
// evaluate to particular types, and not every type can be coerced
// into every other type. Although the types of XPath values are
// similar to the types present in JavaScript, the type coercion rules
// are a bit peculiar, so we explicitly model XPath types instead of
// mapping them onto JavaScript types. (See XPath spec.)
//
// The four types are:
//
//   StringValue
//
//   NumberValue
//
//   BooleanValue
//
//   NodeSetValue
//
// The common interface of the value classes consists of methods that
// implement the XPath type coercion rules:
//
//   stringValue() -- returns the value as a JavaScript String,
//
//   numberValue() -- returns the value as a JavaScript Number,
//
//   booleanValue() -- returns the value as a JavaScript Boolean,
//
//   nodeSetValue() -- returns the value as a JavaScript Array of DOM
//   Node objects.
//

function StringValue(value) {
    this.value = value;
    this.type = 'string';
}

StringValue.prototype.stringValue = function () {
    return this.value;
};

StringValue.prototype.booleanValue = function () {
    return this.value.length > 0;
};

StringValue.prototype.numberValue = function () {
    return this.value - 0;
};

StringValue.prototype.nodeSetValue = function () {
    throw this;
};

function BooleanValue(value) {
    this.value = value;
    this.type = 'boolean';
}

BooleanValue.prototype.stringValue = function () {
    return '' + this.value;
};

BooleanValue.prototype.booleanValue = function () {
    return this.value;
};

BooleanValue.prototype.numberValue = function () {
    return this.value ? 1 : 0;
};

BooleanValue.prototype.nodeSetValue = function () {
    throw this;
};

function NumberValue(value) {
    this.value = value;
    this.type = 'number';
}

NumberValue.prototype.stringValue = function () {
    return '' + this.value;
};

NumberValue.prototype.booleanValue = function () {
    return !!this.value;
};

NumberValue.prototype.numberValue = function () {
    return this.value - 0;
};

NumberValue.prototype.nodeSetValue = function () {
    throw this;
};

function NodeSetValue(value) {
    this.value = value;
    this.type = 'node-set';
}

NodeSetValue.prototype.stringValue = function () {
    if (this.value.length === 0) {
        return '';
    } else {
        if (this.value[0].nodeType === 1 || this.value[0].nodeType === 9) {
            var s = '';
            for (var i = 0; i < this.value[0].childNodes.length; i++) {
                var child = this.value[0].childNodes[i];
                //if child node is a TEXT NODE
                if (child.nodeType === 3) {
                    s += child.nodeValue;
                }
            }
            return s.replace(/(^\s*|\s*$)/g, '');
        }
        else
            return this.value[0].nodeValue;
    }
};

NodeSetValue.prototype.booleanValue = function () {
    return this.value.length > 0;
};

NodeSetValue.prototype.numberValue = function () {
    return this.stringValue() - 0;
};

NodeSetValue.prototype.nodeSetValue = function () {
    return this.value;
};

// XPath expressions. They are used as nodes in the parse tree and
// possess an evaluate() method to compute an XPath value given an XPath
// context. Expressions are returned from the parser. Teh set of
// expression classes closely mirrors the set of non terminal symbols
// in the grammar. Every non trivial nonterminal symbol has a
// corresponding expression class.
//
// The common expression interface consists of the following methods:
//
// evaluate(context) -- evaluates the expression, returns a value.
//
// toString() -- returns the XPath text representation of the
// expression (defined in xsltdebug.js).
//
// parseTree(indent) -- returns a parse tree representation of the
// expression (defined in xsltdebug.js).

function TokenExpr(m) {
    this.value = m;
}

TokenExpr.prototype.evaluate = function () {
    return new StringValue(this.value);
};

function LocationExpr() {
    this.absolute = false;
    this.steps = [];
}

LocationExpr.prototype.appendStep = function (s) {
    var combinedStep = this._combineSteps(this.steps[this.steps.length - 1], s);
    if (combinedStep) {
        this.steps[this.steps.length - 1] = combinedStep;
    } else {
        this.steps.push(s);
    }
};

LocationExpr.prototype.prependStep = function (s) {
    var combinedStep = this._combineSteps(s, this.steps[0]);
    if (combinedStep) {
        this.steps[0] = combinedStep;
    } else {
        this.steps.unshift(s);
    }
};

// DGF try to combine two steps into one step (perf enhancement)
LocationExpr.prototype._combineSteps = function (prevStep, nextStep) {
    if (!prevStep) return null;
    if (!nextStep) return null;
    var hasPredicates = (prevStep.predicates && prevStep.predicates.length > 0);
    if (prevStep.nodetest instanceof NodeTestAny && !hasPredicates) {
        // maybe suitable to be combined
        if (prevStep.axis === xpathAxis.DESCENDANT_OR_SELF) {
            if (nextStep.axis === xpathAxis.CHILD) {
                nextStep.axis = xpathAxis.DESCENDANT;
                return nextStep;
            } else if (nextStep.axis === xpathAxis.SELF) {
                nextStep.axis = xpathAxis.DESCENDANT_OR_SELF;
                return nextStep;
            }
        } else if (prevStep.axis === xpathAxis.DESCENDANT) {
            if (nextStep.axis === xpathAxis.SELF) {
                nextStep.axis = xpathAxis.DESCENDANT;
                return nextStep;
            }
        }
    }
    return null;
};

LocationExpr.prototype.evaluate = function (ctx) {
    var start;
    if (this.absolute) {
        start = ctx.root;

    } else {
        start = ctx.node;
    }

    var nodes = [];
    xPathStep(nodes, this.steps, 0, start, ctx);
    return new NodeSetValue(nodes);
};

function xPathStep(nodes, steps, step, input, ctx) {
    var s = steps[step];
    var ctx2 = ctx.clone(input);
    var nodelist = s.evaluate(ctx2).nodeSetValue();

    for (var i = 0; i < nodelist.length; ++i) {
        if (step === steps.length - 1) {
            nodes.push(nodelist[i]);
        } else {
            xPathStep(nodes, steps, step + 1, nodelist[i], ctx);
        }
    }
}

function StepExpr(axis, nodetest, opt_predicate) {
    this.axis = axis;
    this.nodetest = nodetest;
    this.predicate = opt_predicate || [];
}

StepExpr.prototype.appendPredicate = function (p) {
    this.predicate.push(p);
};

StepExpr.prototype.evaluate = function (ctx) {
    var input = ctx.node;
    var nodelist = [];
    var skipNodeTest = false;

    if (this.nodetest instanceof NodeTestAny) {
        skipNodeTest = true;
    }

    // NOTE(mesch): When this was a switch() statement, it didn't work
    // in Safari/2.0. Not sure why though; it resulted in the JavaScript
    // console output "undefined" (without any line number or so).
    var n, nn, tagName, i, ii;
    if (this.axis === xpathAxis.ANCESTOR_OR_SELF) {
        nodelist.push(input);
        for (n = input.parentNode; n; n = n.parentNode) {
            nodelist.push(n);
        }

    } else if (this.axis === xpathAxis.ANCESTOR) {
        for (n = input.parentNode; n; n = n.parentNode) {
            nodelist.push(n);
        }

    } else if (this.axis === xpathAxis.ATTRIBUTE) {
        if (ctx.ignoreAttributesWithoutValue) {
            copyArrayIgnoringAttributesWithoutValue(nodelist, input.attributes);
        }
        else {
            copyArray(nodelist, input.attributes);
        }

    } else if (this.axis === xpathAxis.CHILD) {
        copyArray(nodelist, input.childNodes);

    } else if (this.axis === xpathAxis.DESCENDANT_OR_SELF) {
        if (this.nodetest.evaluate(ctx).booleanValue()) {
            nodelist.push(input);
        }
        tagName = xpathExtractTagNameFromNodeTest(this.nodetest);
        xpathCollectDescendants(nodelist, input, tagName);
        if (tagName) skipNodeTest = true;

    } else if (this.axis === xpathAxis.DESCENDANT) {
        tagName = xpathExtractTagNameFromNodeTest(this.nodetest);
        xpathCollectDescendants(nodelist, input, tagName);
        if (tagName) skipNodeTest = true;

    } else if (this.axis === xpathAxis.FOLLOWING) {
        for (n = input; n; n = n.parentNode) {
            for (nn = n.nextSibling; nn; nn = nn.nextSibling) {
                nodelist.push(nn);
                xpathCollectDescendants(nodelist, nn);
            }
        }

    } else if (this.axis === xpathAxis.FOLLOWING_SIBLING) {
        for (n = input.nextSibling; n; n = n.nextSibling) {
            nodelist.push(n);
        }

    } else if (this.axis === xpathAxis.NAMESPACE) {
        throw new Error('not implemented: axis namespace');

    } else if (this.axis === xpathAxis.PARENT) {
        if (input.parentNode) {
            nodelist.push(input.parentNode);
        }

    } else if (this.axis === xpathAxis.PRECEDING) {
        for (n = input; n; n = n.parentNode) {
            for (nn = n.previousSibling; nn; nn = nn.previousSibling) {
                nodelist.push(nn);
                xpathCollectDescendantsReverse(nodelist, nn);
            }
        }

    } else if (this.axis === xpathAxis.PRECEDING_SIBLING) {
        for (n = input.previousSibling; n; n = n.previousSibling) {
            nodelist.push(n);
        }

    } else if (this.axis === xpathAxis.SELF) {
        nodelist.push(input);

    } else {
        throw 'ERROR -- NO SUCH AXIS: ' + this.axis;
    }

    var nodelist0;
    if (!skipNodeTest) {
        // process node test
        nodelist0 = nodelist;
        nodelist = [];
        for (i = 0; i < nodelist0.length; ++i) {
            n = nodelist0[i];
            if (this.nodetest.evaluate(ctx.clone(n, i, nodelist0)).booleanValue()) {
                nodelist.push(n);
            }
        }
    }

    // process predicates
    for (i = 0; i < this.predicate.length; ++i) {
        nodelist0 = nodelist;
        nodelist = [];
        for (ii = 0; ii < nodelist0.length; ++ii) {
            n = nodelist0[ii];
            if (this.predicate[i].evaluate(ctx.clone(n, ii, nodelist0)).booleanValue()) {
                nodelist.push(n);
            }
        }
    }

    return new NodeSetValue(nodelist);
};

function NodeTestAny() {
    this.value = new BooleanValue(true);
}

// eslint-disable-next-line no-unused-vars
NodeTestAny.prototype.evaluate = function (ctx) {
    return this.value;
};

function NodeTestElementOrAttribute() {
}

NodeTestElementOrAttribute.prototype.evaluate = function (ctx) {
    return new BooleanValue(
        ctx.node.nodeType === xmlCommon.DOM_ELEMENT_NODE ||
        ctx.node.nodeType === xmlCommon.DOM_ATTRIBUTE_NODE);
};

function NodeTestText() {
}

NodeTestText.prototype.evaluate = function (ctx) {
    return new BooleanValue(ctx.node.nodeType === xmlCommon.DOM_TEXT_NODE);
};

function NodeTestComment() {
}

NodeTestComment.prototype.evaluate = function (ctx) {
    return new BooleanValue(ctx.node.nodeType === xmlCommon.DOM_COMMENT_NODE);
};

function NodeTestPI(target) {
    this.target = target;
}

NodeTestPI.prototype.evaluate = function (ctx) {
    return new
    BooleanValue(ctx.node.nodeType === xmlCommon.DOM_PROCESSING_INSTRUCTION_NODE &&
        (!this.target || ctx.node.nodeName === this.target));
};

function NodeTestNC(nsprefix) {
    this.regex = new RegExp("^" + nsprefix + ":");
    // noinspection JSUnusedGlobalSymbols
    this.nsprefix = nsprefix;
}

NodeTestNC.prototype.evaluate = function (ctx) {
    var n = ctx.node;
    return new BooleanValue(this.regex.match(n.nodeName));
};

function NodeTestName(name) {
    this.name = name;
    this.re = new RegExp('^' + name + '$', "i");
}

NodeTestName.prototype.evaluate = function (ctx) {
    var n = ctx.node;
    if (ctx.caseInsensitive) {
        if (n.nodeName.length !== this.name.length) return new BooleanValue(false);
        return new BooleanValue(this.re.test(n.nodeName));
    } else {
        return new BooleanValue(n.nodeName === this.name);
    }
};

function PredicateExpr(expr) {
    this.expr = expr;
}

PredicateExpr.prototype.evaluate = function (ctx) {
    var v = this.expr.evaluate(ctx);
    if (v.type === 'number') {
        // NOTE(mesch): Internally, position is represented starting with
        // 0, however in XPath position starts with 1. See functions
        // position() and last().
        return new BooleanValue(ctx.position === v.numberValue() - 1);
    } else {
        return new BooleanValue(v.booleanValue());
    }
};

function FunctionCallExpr(name) {
    this.name = name;
    this.args = [];
}

FunctionCallExpr.prototype.appendArg = function (arg) {
    this.args.push(arg);
};
/**
 * @param {ExprContext} ctx
 * @param {Function=} callback
 * @returns {*}
 */
FunctionCallExpr.prototype.evaluate = function (ctx, callback) {
    var fn = '' + this.name.value;
    var f = this.xpathfunctions[fn];
    if (f) {
        if (callback)
            f.call(this, ctx, callback);
        else
            return f.call(this, ctx);
    } else {
        //first of all get function prefix and local name
        var prefix = '';
        var localName = fn;
        var ix = fn.indexOf(':');
        if (ix > 0) {
            localName = fn.substr(ix + 1);
            prefix = fn.substr(0, ix)
        }
        //try to find function context for the specified prefix
        var functionContext = ctx.getFunctionContext(prefix);
        if (functionContext) {
            fn = functionContext[localName];
            if (typeof fn === 'function') {
                if (typeof callback === 'function')
                    fn.call(this, ctx, this.args, callback);
                else
                    return fn.call(this, ctx, this.args);
            }
        }
        else {
            if (typeof ctx.invokeFunction === 'function') {
                if (callback)
                    ctx.invokeFunction.call(this, ctx, localName, this.args, callback);
                else
                    return ctx.invokeFunction.call(this, ctx, localName, this.args);
            }
        }
        if (callback)
            callback(null, new BooleanValue(false));
        else
            return new BooleanValue(false);
    }
};

FunctionCallExpr.prototype.xpathfunctions = {
    'last': function (ctx) {
        assert(this.args.length === 0);
        // XPath position starts at 1.
        return new NumberValue(ctx.contextSize());
    },

    'position': function (ctx) {
        assert(this.args.length === 0);
        // NOTE(mesch): XPath position starts at 1.
        return new NumberValue(ctx.position + 1);
    },

    'count': function (ctx) {
        assert(this.args.length === 1);
        var v = this.args[0].evaluate(ctx);
        return new NumberValue(v.nodeSetValue().length);
    },

    'id': function (ctx) {
        var i;
        assert(this.args.length === 1);
        var e = this.args[0].evaluate(ctx);
        var ret = [];
        var ids;
        if (e.type === 'node-set') {
            ids = [];
            var en = e.nodeSetValue();
            for (i = 0; i < en.length; ++i) {
                var v = en[i].value.split(/\s+/);
                for (var ii = 0; ii < v.length; ++ii) {
                    ids.push(v[ii]);
                }
            }
        } else {
            ids = e.stringValue().split(/\s+/);
        }
        var d = ctx.root;
        for (i = 0; i < ids.length; ++i) {
            var n = d.getElementById(ids[i]);
            if (n) {
                ret.push(n);
            }
        }
        return new NodeSetValue(ret);
    },
// eslint-disable-next-line no-unused-vars
    'local-name': function (ctx) {
        throw new Error('not implmented yet: XPath function local-name()');
    },
// eslint-disable-next-line no-unused-vars
    'namespace-uri': function (ctx) {
        throw new Error('not implemented yet: XPath function namespace-uri()');
    },

    'name': function (ctx) {
        assert(this.args.length === 1 || this.args.length === 0);
        var n;
        if (this.args.length === 0) {
            n = [ctx.node];
        } else {
            n = this.args[0].evaluate(ctx).nodeSetValue();
        }

        if (n.length === 0) {
            return new StringValue('');
        } else {
            return new StringValue(n[0].nodeName);
        }
    },

    'string': function (ctx) {
        assert(this.args.length === 1 || this.args.length === 0);
        if (this.args.length === 0) {
            return new StringValue(new NodeSetValue([ctx.node]).stringValue());
        } else {
            return new StringValue(this.args[0].evaluate(ctx).stringValue());
        }
    },

    'concat': function (ctx) {
        var ret = '';
        for (var i = 0; i < this.args.length; ++i) {
            ret += this.args[i].evaluate(ctx).stringValue();
        }
        return new StringValue(ret);
    },

    'starts-with': function (ctx) {
        assert(this.args.length === 2);
        var s0 = this.args[0].evaluate(ctx).stringValue();
        var s1 = this.args[1].evaluate(ctx).stringValue();
        return new BooleanValue(s0.indexOf(s1) === 0);
    },

    'contains': function (ctx) {
        assert(this.args.length === 2);
        var s0 = this.args[0].evaluate(ctx).stringValue();
        var s1 = this.args[1].evaluate(ctx).stringValue();
        return new BooleanValue(s0.indexOf(s1) !== -1);
    },

    'substring-before': function (ctx) {
        assert(this.args.length === 2);
        var s0 = this.args[0].evaluate(ctx).stringValue();
        var s1 = this.args[1].evaluate(ctx).stringValue();
        var i = s0.indexOf(s1);
        var ret;
        if (i === -1) {
            ret = '';
        } else {
            ret = s0.substr(0, i);
        }
        return new StringValue(ret);
    },

    'substring-after': function (ctx) {
        assert(this.args.length === 2);
        var s0 = this.args[0].evaluate(ctx).stringValue();
        var s1 = this.args[1].evaluate(ctx).stringValue();
        var i = s0.indexOf(s1);
        var ret;
        if (i === -1) {
            ret = '';
        } else {
            ret = s0.substr(i + s1.length);
        }
        return new StringValue(ret);
    },

    'substring': function (ctx) {
        // NOTE: XPath defines the position of the first character in a
        // string to be 1, in JavaScript this is 0 ([XPATH] Section 4.2).
        assert(this.args.length === 2 || this.args.length === 3);
        var s0 = this.args[0].evaluate(ctx).stringValue();
        var s1 = this.args[1].evaluate(ctx).numberValue();
        var ret, i1;
        if (this.args.length === 2) {
            i1 = Math.max(0, Math.round(s1) - 1);
            ret = s0.substr(i1);

        } else {
            var s2 = this.args[2].evaluate(ctx).numberValue();
            var i0 = Math.round(s1) - 1;
            i1 = Math.max(0, i0);
            var i2 = Math.round(s2) - Math.max(0, -i0);
            ret = s0.substr(i1, i2);
        }
        return new StringValue(ret);
    },

    'string-length': function (ctx) {
        var s;
        if (this.args.length > 0) {
            s = this.args[0].evaluate(ctx).stringValue();
        } else {
            s = new NodeSetValue([ctx.node]).stringValue();
        }
        return new NumberValue(s.length);
    },

    'normalize-space': function (ctx) {
        var s;
        if (this.args.length > 0) {
            s = this.args[0].evaluate(ctx).stringValue();
        } else {
            s = new NodeSetValue([ctx.node]).stringValue();
        }
        s = s.replace(/^\s*/, '').replace(/\s*$/, '').replace(/\s+/g, ' ');
        return new StringValue(s);
    },

    'translate': function (ctx) {
        assert(this.args.length === 3);
        var s0 = this.args[0].evaluate(ctx).stringValue();
        var s1 = this.args[1].evaluate(ctx).stringValue();
        var s2 = this.args[2].evaluate(ctx).stringValue();

        for (var i = 0; i < s1.length; ++i) {
            s0 = s0.replace(new RegExp(s1.charAt(i), 'g'), s2.charAt(i));
        }
        return new StringValue(s0);
    },

    'boolean': function (ctx) {
        assert(this.args.length === 1);
        return new BooleanValue(this.args[0].evaluate(ctx).booleanValue());
    },

    'not': function (ctx) {
        assert(this.args.length === 1);
        var ret = !this.args[0].evaluate(ctx).booleanValue();
        return new BooleanValue(ret);
    },
// eslint-disable-next-line no-unused-vars
    'true': function (ctx) {
        assert(this.args.length === 0);
        return new BooleanValue(true);
    },
// eslint-disable-next-line no-unused-vars
    'false': function (ctx) {
        assert(this.args.length === 0);
        return new BooleanValue(false);
    },

    'lang': function (ctx) {
        assert(this.args.length === 1);
        var lang = this.args[0].evaluate(ctx).stringValue();
        var xmllang;
        var n = ctx.node;
        while (n && n !== n.parentNode /* just in case ... */) {
            xmllang = n.getAttribute('xml:lang');
            if (xmllang) {
                break;
            }
            n = n.parentNode;
        }
        if (!xmllang) {
            return new BooleanValue(false);
        } else {
            var re = new RegExp('^' + lang + '$', 'i');
            return new BooleanValue(xmllang.match(re) ||
                xmllang.replace(/_.*$/, '').match(re));
        }
    },

    'number': function (ctx) {
        assert(this.args.length === 1 || this.args.length === 0);

        if (this.args.length === 1) {
            return new NumberValue(this.args[0].evaluate(ctx).numberValue());
        } else {
            return new NumberValue(new NodeSetValue([ctx.node]).numberValue());
        }
    },

    'sum': function (ctx) {
        assert(this.args.length === 1);
        var n = this.args[0].evaluate(ctx).nodeSetValue();
        var sum = 0;
        for (var i = 0; i < n.length; ++i) {
            sum += n[i].value - 0;
        }
        return new NumberValue(sum);
    },

    'floor': function (ctx) {
        assert(this.args.length === 1);
        var num = this.args[0].evaluate(ctx).numberValue();
        return new NumberValue(Math.floor(num));
    },

    'ceiling': function (ctx) {
        assert(this.args.length === 1);
        var num = this.args[0].evaluate(ctx).numberValue();
        return new NumberValue(Math.ceil(num));
    },

    'round': function (ctx) {
        assert(this.args.length === 1);
        var num = this.args[0].evaluate(ctx).numberValue();
        return new NumberValue(Math.round(num));
    },

    // standard that defines how to add functions, which should be
    // applied here.

    'ext-join': function (ctx) {
        assert(this.args.length === 2);
        var nodes = this.args[0].evaluate(ctx).nodeSetValue();
        var delim = this.args[1].evaluate(ctx).stringValue();
        var ret = '';
        for (var i = 0; i < nodes.length; ++i) {
            if (ret) {
                ret += delim;
            }
            ret += nodes[i].value;
        }
        return new StringValue(ret);
    },

    // ext-if() evaluates and returns its second argument, if the
    // boolean value of its first argument is true, otherwise it
    // evaluates and returns its third argument.

    'ext-if': function (ctx) {
        assert(this.args.length === 3);
        if (this.args[0].evaluate(ctx).booleanValue()) {
            return this.args[1].evaluate(ctx);
        } else {
            return this.args[2].evaluate(ctx);
        }
    },

    // ext-cardinal() evaluates its single argument as a number, and
    // returns the current node that many times. It can be used in the
    // select attribute to iterate over an integer range.

    'ext-cardinal': function (ctx) {
        assert(this.args.length >= 1);
        var c = this.args[0].evaluate(ctx).numberValue();
        var ret = [];
        for (var i = 0; i < c; ++i) {
            ret.push(ctx.node);
        }
        return new NodeSetValue(ret);
    }
};

function UnionExpr(expr1, expr2) {
    this.expr1 = expr1;
    this.expr2 = expr2;
}

UnionExpr.prototype.evaluate = function (ctx) {
    var nodes1 = this.expr1.evaluate(ctx).nodeSetValue();
    var nodes2 = this.expr2.evaluate(ctx).nodeSetValue();
    var I1 = nodes1.length;
    for (var i2 = 0; i2 < nodes2.length; ++i2) {
        var n = nodes2[i2];
        var inBoth = false;
        for (var i1 = 0; i1 < I1; ++i1) {
            if (nodes1[i1] === n) {
                inBoth = true;
                i1 = I1; // break inner loop
            }
        }
        if (!inBoth) {
            nodes1.push(n);
        }
    }
    return new NodeSetValue(nodes1);
};

function PathExpr(filter, rel) {
    this.filter = filter;
    this.rel = rel;
}

PathExpr.prototype.evaluate = function (ctx) {
    var nodeSet = this.filter.evaluate(ctx);
    if (typeof nodeSet.nodeSetValue === 'undefined')
        return new NodeSetValue([]);
    var nodes = nodeSet.nodeSetValue();
    var nodes1 = [];
    for (var i = 0; i < nodes.length; ++i) {
        var nodes0 = this.rel.evaluate(ctx.clone(nodes[i], i, nodes)).nodeSetValue();
        for (var ii = 0; ii < nodes0.length; ++ii) {
            nodes1.push(nodes0[ii]);
        }
    }
    return new NodeSetValue(nodes1);
};

function FilterExpr(expr, predicate) {
    this.expr = expr;
    this.predicate = predicate;
}

FilterExpr.prototype.evaluate = function (ctx) {
    var nodes = this.expr.evaluate(ctx).nodeSetValue();
    for (var i = 0; i < this.predicate.length; ++i) {
        var nodes0 = nodes;
        nodes = [];
        for (var j = 0; j < nodes0.length; ++j) {
            var n = nodes0[j];
            if (this.predicate[i].evaluate(ctx.clone(n, j, nodes0)).booleanValue()) {
                nodes.push(n);
            }
        }
    }

    return new NodeSetValue(nodes);
};

function UnaryMinusExpr(expr) {
    this.expr = expr;
}

UnaryMinusExpr.prototype.evaluate = function (ctx) {
    return new NumberValue(-this.expr.evaluate(ctx).numberValue());
};

function BinaryExpr(expr1, op, expr2) {
    this.expr1 = expr1;
    this.expr2 = expr2;
    this.op = op;
}

BinaryExpr.prototype.evaluate = function (ctx) {
    var ret;
    switch (this.op.value) {
        case 'or':
            ret = new BooleanValue(this.expr1.evaluate(ctx).booleanValue() ||
                this.expr2.evaluate(ctx).booleanValue());
            break;

        case 'and':
            ret = new BooleanValue(this.expr1.evaluate(ctx).booleanValue() &&
                this.expr2.evaluate(ctx).booleanValue());
            break;

        case '+':
            ret = new NumberValue(this.expr1.evaluate(ctx).numberValue() +
                this.expr2.evaluate(ctx).numberValue());
            break;

        case '-':
            ret = new NumberValue(this.expr1.evaluate(ctx).numberValue() -
                this.expr2.evaluate(ctx).numberValue());
            break;

        case '*':
            ret = new NumberValue(this.expr1.evaluate(ctx).numberValue() *
                this.expr2.evaluate(ctx).numberValue());
            break;

        case 'mob':
            ret = new NumberValue(this.expr1.evaluate(ctx).numberValue() %
                this.expr2.evaluate(ctx).numberValue());
            break;

        case 'div':
            ret = new NumberValue(this.expr1.evaluate(ctx).numberValue() /
                this.expr2.evaluate(ctx).numberValue());
            break;

        case '=':
            ret = this.compare(ctx, function (x1, x2) {
                return x1 === x2;
            });
            break;

        case '!=':
            ret = this.compare(ctx, function (x1, x2) {
                return x1 !== x2;
            });
            break;

        case '<':
            ret = this.compare(ctx, function (x1, x2) {
                return x1 < x2;
            });
            break;

        case '<=':
            ret = this.compare(ctx, function (x1, x2) {
                return x1 <= x2;
            });
            break;

        case '>':
            ret = this.compare(ctx, function (x1, x2) {
                return x1 > x2;
            });
            break;

        case '>=':
            ret = this.compare(ctx, function (x1, x2) {
                return x1 >= x2;
            });
            break;

        default:
            throw new Error('BinaryExpr.evaluate: ' + this.op.value);
    }
    return ret;
};

BinaryExpr.prototype.compare = function (ctx, cmp) {
    var v1 = this.expr1.evaluate(ctx);
    var v2 = this.expr2.evaluate(ctx);
    var n, s;
    var ret;
    if (v1.type === 'node-set' && v2.type === 'node-set') {
        //get string values
        var n1 = v1.stringValue();
        var n2 = v1.stringValue();
        ret = !!cmp(n1, n2);
    } else if (v1.type === 'node-set' || v2.type === 'node-set') {

        if (v1.type === 'number') {
            s = v1.numberValue();
            n = v2.numberValue();
            ret = !!cmp(s, n);
        } else if (v2.type === 'number') {
            n = v1.numberValue();
            s = v2.numberValue();
            ret = !!cmp(n, s);
        } else if (v1.type === 'string') {
            s = v1.stringValue();
            n = v2.stringValue();
            ret = !!cmp(s, n);
        } else if (v2.type === 'string') {
            n = v1.stringValue();
            s = v2.stringValue();
            ret = !!cmp(s, n);
        } else {
            ret = cmp(v1.booleanValue(), v2.booleanValue());
        }

    } else if (v1.type === 'boolean' || v2.type === 'boolean') {
        ret = cmp(v1.booleanValue(), v2.booleanValue());

    } else if (v1.type === 'number' || v2.type === 'number') {
        ret = cmp(v1.numberValue(), v2.numberValue());

    } else {
        ret = cmp(v1.stringValue(), v2.stringValue());
    }

    return new BooleanValue(ret);
};

/*
 BinaryExpr.prototype.compare = function(ctx, cmp) {
 var v1 = this.expr1.evaluate(ctx);
 var v2 = this.expr2.evaluate(ctx);

 var ret;
 if (v1.type === 'node-set' && v2.type === 'node-set') {
 var n1 = v1.nodeSetValue();
 var n2 = v2.nodeSetValue();
 ret = false;
 for (var i1 = 0; i1 < n1.length; ++i1) {
 for (var i2 = 0; i2 < n2.length; ++i2) {
 if (cmp(n1[i1].nodeValue, n2[i2].nodeValue)) {
 ret = true;
 // Break outer loop. Labels confuse the jscompiler and we
 // don't use them.
 i2 = n2.length;
 i1 = n1.length;
 }
 }
 }

 } else if (v1.type === 'node-set' || v2.type === 'node-set') {

 if (v1.type === 'number') {
 var s = v1.numberValue();
 var n = v2.nodeSetValue();

 ret = false;
 for (var i = 0;  i < n.length; ++i) {
 var nn = n[i].nodeValue - 0;
 if (cmp(s, nn)) {
 ret = true;
 break;
 }
 }

 } else if (v2.type === 'number') {
 var n = v1.nodeSetValue();
 var s = v2.numberValue();

 ret = false;
 for (var i = 0;  i < n.length; ++i) {
 var nn = n[i].nodeValue - 0;
 if (cmp(nn, s)) {
 ret = true;
 break;
 }
 }

 } else if (v1.type === 'string') {
 var s = v1.stringValue();
 var n = v2.nodeSetValue();

 ret = false;
 for (var i = 0;  i < n.length; ++i) {
 var nn = n[i].nodeValue;
 if (cmp(s, nn)) {
 ret = true;
 break;
 }
 }

 } else if (v2.type === 'string') {
 var n = v1.nodeSetValue();
 var s = v2.stringValue();

 ret = false;
 for (var i = 0;  i < n.length; ++i) {
 var nn = n[i].nodeValue;
 if (cmp(nn, s)) {
 ret = true;
 break;
 }
 }

 } else {
 ret = cmp(v1.booleanValue(), v2.booleanValue());
 }

 } else if (v1.type === 'boolean' || v2.type === 'boolean') {
 ret = cmp(v1.booleanValue(), v2.booleanValue());

 } else if (v1.type === 'number' || v2.type === 'number') {
 ret = cmp(v1.numberValue(), v2.numberValue());

 } else {
 ret = cmp(v1.stringValue(), v2.stringValue());
 }

 return new BooleanValue(ret);
 }
 */

function LiteralExpr(value) {
    this.value = value;
}

// eslint-disable-next-line no-unused-vars
LiteralExpr.prototype.evaluate = function (ctx) {
    return new StringValue(this.value);
};

function NumberExpr(value) {
    this.value = value;
}

// eslint-disable-next-line no-unused-vars
NumberExpr.prototype.evaluate = function (ctx) {
    return new NumberValue(this.value);
};

function VariableExpr(name) {
    this.name = name;
}

// eslint-disable-next-line no-unused-vars
VariableExpr.prototype.evaluate = function (ctx) {
    return ctx.getVariable(this.name);
};

// Factory functions for semantic values (i.e. Expressions) of the
// productions in the grammar. When a production is matched to reduce
// the current parse state stack, the function is called with the
// semantic values of the matched elements as arguments, and returns
// another semantic value. The semantic value is a node of the parse
// tree, an expression object with an evaluate() method that evaluates the
// expression in an actual context. These factory functions are used
// in the specification of the grammar rules, below.

function makeTokenExpr(m) {
    return new TokenExpr(m);
}

function passExpr(e) {
    return e;
}

function makeLocationExpr1(slash, rel) {
    rel.absolute = true;
    return rel;
}

function makeLocationExpr2(dslash, rel) {
    rel.absolute = true;
    rel.prependStep(makeAbbrevStep(dslash.value));
    return rel;
}

// eslint-disable-next-line no-unused-vars
function makeLocationExpr3(slash) {
    var ret = new LocationExpr();
    ret.appendStep(makeAbbrevStep('.'));
    ret.absolute = true;
    return ret;
}

function makeLocationExpr4(dslash) {
    var ret = new LocationExpr();
    ret.absolute = true;
    ret.appendStep(makeAbbrevStep(dslash.value));
    return ret;
}

function makeLocationExpr5(step) {
    var ret = new LocationExpr();
    ret.appendStep(step);
    return ret;
}

function makeLocationExpr6(rel, slash, step) {
    rel.appendStep(step);
    return rel;
}

function makeLocationExpr7(rel, dslash, step) {
    rel.appendStep(makeAbbrevStep(dslash.value));
    rel.appendStep(step);
    return rel;
}

function makeStepExpr1(dot) {
    return makeAbbrevStep(dot.value);
}

function makeStepExpr2(ddot) {
    return makeAbbrevStep(ddot.value);
}

function makeStepExpr3(axisname, axis, nodetest) {
    return new StepExpr(axisname.value, nodetest);
}

function makeStepExpr4(at, nodetest) {
    return new StepExpr('attribute', nodetest);
}

function makeStepExpr5(nodetest) {
    return new StepExpr('child', nodetest);
}

function makeStepExpr6(step, predicate) {
    step.appendPredicate(predicate);
    return step;
}

function makeAbbrevStep(abbrev) {
    switch (abbrev) {
        case '//':
            return new StepExpr('descendant-or-self', new NodeTestAny);

        case '.':
            return new StepExpr('self', new NodeTestAny);

        case '..':
            return new StepExpr('parent', new NodeTestAny);
    }
}
// eslint-disable-next-line no-unused-vars
function makeNodeTestExpr1(asterisk) {
    return new NodeTestElementOrAttribute;
}
// eslint-disable-next-line no-unused-vars
function makeNodeTestExpr2(ncname, colon, asterisk) {
    return new NodeTestNC(ncname.value);
}
// eslint-disable-next-line no-unused-vars
function makeNodeTestExpr3(qname) {
    return new NodeTestName(qname.value);
}
// eslint-disable-next-line no-unused-vars
function makeNodeTestExpr4(typeo, parenc) {
    var type = typeo.value.replace(/\s*\($/, '');
    switch (type) {
        case 'node':
            return new NodeTestAny;

        case 'text':
            return new NodeTestText;

        case 'comment':
            return new NodeTestComment;

        case 'processing-instruction':
            return new NodeTestPI('');
    }
}

// eslint-disable-next-line no-unused-vars
function makeNodeTestExpr5(typeo, target, parenc) {
    var type = typeo.replace(/\s*\($/, '');
    if (type !== 'processing-instruction') {
        throw type;
    }
    return new NodeTestPI(target.value);
}
// eslint-disable-next-line no-unused-vars
function makePredicateExpr(pareno, expr, parenc) {
    return new PredicateExpr(expr);
}
// eslint-disable-next-line no-unused-vars
function makePrimaryExpr(pareno, expr, parenc) {
    return expr;
}
// eslint-disable-next-line no-unused-vars
function makeFunctionCallExpr1(name, pareno, parenc) {
    return new FunctionCallExpr(name);
}
// eslint-disable-next-line no-unused-vars
function makeFunctionCallExpr2(name, pareno, arg1, args, parenc) {
    var ret = new FunctionCallExpr(name);
    ret.appendArg(arg1);
    for (var i = 0; i < args.length; ++i) {
        ret.appendArg(args[i]);
    }
    return ret;
}

function makeArgumentExpr(comma, expr) {
    return expr;
}

function makeUnionExpr(expr1, pipe, expr2) {
    return new UnionExpr(expr1, expr2);
}

function makePathExpr1(filter, slash, rel) {
    return new PathExpr(filter, rel);
}

function makePathExpr2(filter, dslash, rel) {
    rel.prependStep(makeAbbrevStep(dslash.value));
    return new PathExpr(filter, rel);
}

function makeFilterExpr(expr, predicates) {
    if (predicates.length > 0) {
        return new FilterExpr(expr, predicates);
    } else {
        return expr;
    }
}

function makeUnaryMinusExpr(minus, expr) {
    return new UnaryMinusExpr(expr);
}

function makeBinaryExpr(expr1, op, expr2) {
    return new BinaryExpr(expr1, op, expr2);
}

function makeLiteralExpr(token) {
    // remove quotes from the parsed value:
    var value = token.value.substring(1, token.value.length - 1);
    return new LiteralExpr(value);
}

function makeNumberExpr(token) {
    return new NumberExpr(token.value);
}

function makeVariableReference(dollar, name) {
    return new VariableExpr(name.value);
}

// Used before parsing for optimization of common simple cases. See
// the begin of xpathParse() for which they are.
function makeSimpleExpr(expr) {
    var a, b, c;
    if (expr.charAt(0) === '$') {
        return new VariableExpr(expr.substr(1));
    } else if (expr.charAt(0) === '@') {
        a = new NodeTestName(expr.substr(1));
        b = new StepExpr('attribute', a);
        c = new LocationExpr();
        c.appendStep(b);
        return c;
    } else if (expr.match(/^[0-9]+$/)) {
        return new NumberExpr(expr);
    } else {
        a = new NodeTestName(expr);
        b = new StepExpr('child', a);
        c = new LocationExpr();
        c.appendStep(b);
        return c;
    }
}

function makeSimpleExpr2(expr) {
    var steps = xmlUtil.stringSplit(expr, '/');
    var c = new LocationExpr();
    for (var i = 0; i < steps.length; ++i) {
        var a = new NodeTestName(steps[i]);
        var b = new StepExpr('child', a);
        c.appendStep(b);
    }
    return c;
}

// The axes of XPath expressions.

var xpathAxis = {
    ANCESTOR_OR_SELF: 'ancestor-or-self',
    ANCESTOR: 'ancestor',
    ATTRIBUTE: 'attribute',
    CHILD: 'child',
    DESCENDANT_OR_SELF: 'descendant-or-self',
    DESCENDANT: 'descendant',
    FOLLOWING_SIBLING: 'following-sibling',
    FOLLOWING: 'following',
    NAMESPACE: 'namespace',
    PARENT: 'parent',
    PRECEDING_SIBLING: 'preceding-sibling',
    PRECEDING: 'preceding',
    SELF: 'self'
};

var xpathAxesRe = [
    xpathAxis.ANCESTOR_OR_SELF,
    xpathAxis.ANCESTOR,
    xpathAxis.ATTRIBUTE,
    xpathAxis.CHILD,
    xpathAxis.DESCENDANT_OR_SELF,
    xpathAxis.DESCENDANT,
    xpathAxis.FOLLOWING_SIBLING,
    xpathAxis.FOLLOWING,
    xpathAxis.NAMESPACE,
    xpathAxis.PARENT,
    xpathAxis.PRECEDING_SIBLING,
    xpathAxis.PRECEDING,
    xpathAxis.SELF
].join('|');


// The tokens of the language. The label property is just used for
// generating debug output. The prec property is the precedence used
// for shift/reduce resolution. Default precedence is 0 as a lookahead
// token and 2 on the stack.
// necessary and too complicated. Simplify this!

// NOTE: tabular formatting is the big exception, but here it should
// be OK.

var TOK_PIPE = {label: "|", prec: 17, re: new RegExp("^\\|")};
var TOK_DSLASH = {label: "//", prec: 19, re: new RegExp("^//")};
var TOK_SLASH = {label: "/", prec: 30, re: new RegExp("^/")};
var TOK_AXIS = {label: "::", prec: 20, re: new RegExp("^::")};
var TOK_COLON = {label: ":", prec: 1000, re: new RegExp("^:")};
var TOK_AXISNAME = {label: "[axis]", re: new RegExp('^(' + xpathAxesRe + ')')};
var TOK_PARENO = {label: "(", prec: 34, re: new RegExp("^\\(")};
var TOK_PARENC = {label: ")", re: new RegExp("^\\)")};
var TOK_DDOT = {label: "..", prec: 34, re: new RegExp("^\\.\\.")};
var TOK_DOT = {label: ".", prec: 34, re: new RegExp("^\\.")};
var TOK_AT = {label: "@", prec: 34, re: new RegExp("^@")};

var TOK_COMMA = {label: ",", re: new RegExp("^,")};

var TOK_OR = {label: "or", prec: 10, re: new RegExp("^or\\b")};
var TOK_AND = {label: "and", prec: 11, re: new RegExp("^and\\b")};
var TOK_EQ = {label: "=", prec: 12, re: new RegExp("^=")};
var TOK_NEQ = {label: "!=", prec: 12, re: new RegExp("^!=")};
var TOK_GE = {label: ">=", prec: 13, re: new RegExp("^>=")};
var TOK_GT = {label: ">", prec: 13, re: new RegExp("^>")};
var TOK_LE = {label: "<=", prec: 13, re: new RegExp("^<=")};
var TOK_LT = {label: "<", prec: 13, re: new RegExp("^<")};
var TOK_PLUS = {label: "+", prec: 14, re: new RegExp("^\\+"), left: true};
var TOK_MINUS = {label: "-", prec: 14, re: new RegExp("^\\-"), left: true};
var TOK_DIV = {label: "div", prec: 15, re: new RegExp("^div\\b"), left: true};
var TOK_MOD = {label: "mob", prec: 15, re: new RegExp("^mob\\b"), left: true};

var TOK_BRACKO = {label: "[", prec: 32, re: new RegExp("^\\[")};
var TOK_BRACKC = {label: "]", re: new RegExp("^\\]")};
var TOK_DOLLAR = {label: "$", re: new RegExp("^\\$")};

var TOK_NCNAME = {label: "[ncname]", re: new RegExp('^' + xmlCommon.XML_NC_NAME)};

var TOK_ASTERISK = {label: "*", prec: 15, re: new RegExp("^\\*"), left: true};
var TOK_LITERALQ = {label: "[litq]", prec: 20, re: new RegExp("^'[^\\']*'")};
var TOK_LITERALQQ = {
    label: "[litqq]",
    prec: 20,
    re: new RegExp('^"[^\\"]*"')
};

var TOK_NUMBER = {
    label: "[number]",
    prec: 35,
    re: new RegExp('^\\d+(\\.\\d*)?')
};

var TOK_QNAME = {
    label: "[qname]",
    re: new RegExp('^(' + xmlCommon.XML_NC_NAME + ':)?' + xmlCommon.XML_NC_NAME)
};

var TOK_NODEO = {
    label: "[nodetest-start]",
    re: new RegExp('^(processing-instruction|comment|text|node)\\(')
};

// The table of the tokens of our grammar, used by the lexer: first
// column the tag, second column a regexp to recognize it in the
// input, third column the precedence of the token, fourth column a
// factory function for the semantic value of the token.
//
// NOTE: order of this list is important, because the first match
// counts. Cf. DDOT and DOT, and AXIS and COLON.

var xpathTokenRules = [
    TOK_DSLASH,
    TOK_SLASH,
    TOK_DDOT,
    TOK_DOT,
    TOK_AXIS,
    TOK_COLON,
    TOK_AXISNAME,
    TOK_NODEO,
    TOK_PARENO,
    TOK_PARENC,
    TOK_BRACKO,
    TOK_BRACKC,
    TOK_AT,
    TOK_COMMA,
    TOK_OR,
    TOK_AND,
    TOK_NEQ,
    TOK_EQ,
    TOK_GE,
    TOK_GT,
    TOK_LE,
    TOK_LT,
    TOK_PLUS,
    TOK_MINUS,
    TOK_ASTERISK,
    TOK_PIPE,
    TOK_MOD,
    TOK_DIV,
    TOK_LITERALQ,
    TOK_LITERALQQ,
    TOK_NUMBER,
    TOK_QNAME,
    TOK_NCNAME,
    TOK_DOLLAR
];

// All the nonterminals of the grammar. The nonterminal objects are
// identified by object identity; the labels are used in the debug
// output only.
var XPathLocationPath = {label: "LocationPath"};
var XPathRelativeLocationPath = {label: "RelativeLocationPath"};
var XPathAbsoluteLocationPath = {label: "AbsoluteLocationPath"};
var XPathStep = {label: "Step"};
var XPathNodeTest = {label: "NodeTest"};
var XPathPredicate = {label: "Predicate"};
var XPathLiteral = {label: "Literal"};
var XPathExpr = {label: "Expr"};
var XPathPrimaryExpr = {label: "PrimaryExpr"};
var XPathVariableReference = {label: "Variablereference"};
var XPathNumber = {label: "Number"};
var XPathFunctionCall = {label: "FunctionCall"};
var XPathArgumentRemainder = {label: "ArgumentRemainder"};
var XPathPathExpr = {label: "PathExpr"};
var XPathUnionExpr = {label: "UnionExpr"};
var XPathFilterExpr = {label: "FilterExpr"};
var XPathDigits = {label: "Digits"};

var xpathNonTerminals = [
    XPathLocationPath,
    XPathRelativeLocationPath,
    XPathAbsoluteLocationPath,
    XPathStep,
    XPathNodeTest,
    XPathPredicate,
    XPathLiteral,
    XPathExpr,
    XPathPrimaryExpr,
    XPathVariableReference,
    XPathNumber,
    XPathFunctionCall,
    XPathArgumentRemainder,
    XPathPathExpr,
    XPathUnionExpr,
    XPathFilterExpr,
    XPathDigits
];

// Quantifiers that are used in the productions of the grammar.
var Q_01 = {label: "?"};
var Q_MM = {label: "*"};
var Q_1M = {label: "+"};

// Tag for left associativity (right assoc is implied by undefined).
var ASSOC_LEFT = true;

// The productions of the grammar. Columns of the table:
//
// - target nonterminal,
// - pattern,
// - precedence,
// - semantic value factory
//
// The semantic value factory is a function that receives parse tree
// nodes from the stack frames of the matched symbols as arguments and
// returns an a node of the parse tree. The node is stored in the top
// stack frame along with the target object of the rule. The node in
// the parse tree is an expression object that has an evaluate() method
// and thus evaluates XPath expressions.
//
// The precedence is used to decide between reducing and shifting by
// comparing the precedence of the rule that is candidate for
// reducing with the precedence of the look ahead token. Precedence of
// -1 means that the precedence of the tokens in the pattern is used
// instead.
// precedences to rules.

// DGF As it stands, these precedences are purely empirical; we're
// not sure they can be made to be consistent at all.

var xpathGrammarRules =
    [
        [XPathLocationPath, [XPathRelativeLocationPath], 18,
            passExpr],
        [XPathLocationPath, [XPathAbsoluteLocationPath], 18,
            passExpr],

        [XPathAbsoluteLocationPath, [TOK_SLASH, XPathRelativeLocationPath], 18,
            makeLocationExpr1],
        [XPathAbsoluteLocationPath, [TOK_DSLASH, XPathRelativeLocationPath], 18,
            makeLocationExpr2],

        [XPathAbsoluteLocationPath, [TOK_SLASH], 0,
            makeLocationExpr3],
        [XPathAbsoluteLocationPath, [TOK_DSLASH], 0,
            makeLocationExpr4],

        [XPathRelativeLocationPath, [XPathStep], 31,
            makeLocationExpr5],
        [XPathRelativeLocationPath,
            [XPathRelativeLocationPath, TOK_SLASH, XPathStep], 31,
            makeLocationExpr6],
        [XPathRelativeLocationPath,
            [XPathRelativeLocationPath, TOK_DSLASH, XPathStep], 31,
            makeLocationExpr7],

        [XPathStep, [TOK_DOT], 33,
            makeStepExpr1],
        [XPathStep, [TOK_DDOT], 33,
            makeStepExpr2],
        [XPathStep,
            [TOK_AXISNAME, TOK_AXIS, XPathNodeTest], 33,
            makeStepExpr3],
        [XPathStep, [TOK_AT, XPathNodeTest], 33,
            makeStepExpr4],
        [XPathStep, [XPathNodeTest], 33,
            makeStepExpr5],
        [XPathStep, [XPathStep, XPathPredicate], 33,
            makeStepExpr6],

        [XPathNodeTest, [TOK_ASTERISK], 33,
            makeNodeTestExpr1],
        [XPathNodeTest, [TOK_NCNAME, TOK_COLON, TOK_ASTERISK], 33,
            makeNodeTestExpr2],
        [XPathNodeTest, [TOK_QNAME], 33,
            makeNodeTestExpr3],
        [XPathNodeTest, [TOK_NODEO, TOK_PARENC], 33,
            makeNodeTestExpr4],
        [XPathNodeTest, [TOK_NODEO, XPathLiteral, TOK_PARENC], 33,
            makeNodeTestExpr5],

        [XPathPredicate, [TOK_BRACKO, XPathExpr, TOK_BRACKC], 33,
            makePredicateExpr],

        [XPathPrimaryExpr, [XPathVariableReference], 33,
            passExpr],
        [XPathPrimaryExpr, [TOK_PARENO, XPathExpr, TOK_PARENC], 33,
            makePrimaryExpr],
        [XPathPrimaryExpr, [XPathLiteral], 30,
            passExpr],
        [XPathPrimaryExpr, [XPathNumber], 30,
            passExpr],
        [XPathPrimaryExpr, [XPathFunctionCall], 31,
            passExpr],

        [XPathFunctionCall, [TOK_QNAME, TOK_PARENO, TOK_PARENC], -1,
            makeFunctionCallExpr1],
        [XPathFunctionCall,
            [TOK_QNAME, TOK_PARENO, XPathExpr, XPathArgumentRemainder, Q_MM,
                TOK_PARENC], -1,
            makeFunctionCallExpr2],
        [XPathArgumentRemainder, [TOK_COMMA, XPathExpr], -1,
            makeArgumentExpr],

        [XPathUnionExpr, [XPathPathExpr], 20,
            passExpr],
        [XPathUnionExpr, [XPathUnionExpr, TOK_PIPE, XPathPathExpr], 20,
            makeUnionExpr],

        [XPathPathExpr, [XPathLocationPath], 20,
            passExpr],
        [XPathPathExpr, [XPathFilterExpr], 19,
            passExpr],
        [XPathPathExpr,
            [XPathFilterExpr, TOK_SLASH, XPathRelativeLocationPath], 19,
            makePathExpr1],
        [XPathPathExpr,
            [XPathFilterExpr, TOK_DSLASH, XPathRelativeLocationPath], 19,
            makePathExpr2],

        [XPathFilterExpr, [XPathPrimaryExpr, XPathPredicate, Q_MM], 31,
            makeFilterExpr],

        [XPathExpr, [XPathPrimaryExpr], 16,
            passExpr],
        [XPathExpr, [XPathUnionExpr], 16,
            passExpr],

        [XPathExpr, [TOK_MINUS, XPathExpr], -1,
            makeUnaryMinusExpr],

        [XPathExpr, [XPathExpr, TOK_OR, XPathExpr], -1,
            makeBinaryExpr],
        [XPathExpr, [XPathExpr, TOK_AND, XPathExpr], -1,
            makeBinaryExpr],

        [XPathExpr, [XPathExpr, TOK_EQ, XPathExpr], -1,
            makeBinaryExpr],
        [XPathExpr, [XPathExpr, TOK_NEQ, XPathExpr], -1,
            makeBinaryExpr],

        [XPathExpr, [XPathExpr, TOK_LT, XPathExpr], -1,
            makeBinaryExpr],
        [XPathExpr, [XPathExpr, TOK_LE, XPathExpr], -1,
            makeBinaryExpr],
        [XPathExpr, [XPathExpr, TOK_GT, XPathExpr], -1,
            makeBinaryExpr],
        [XPathExpr, [XPathExpr, TOK_GE, XPathExpr], -1,
            makeBinaryExpr],

        [XPathExpr, [XPathExpr, TOK_PLUS, XPathExpr], -1,
            makeBinaryExpr, ASSOC_LEFT],
        [XPathExpr, [XPathExpr, TOK_MINUS, XPathExpr], -1,
            makeBinaryExpr, ASSOC_LEFT],

        [XPathExpr, [XPathExpr, TOK_ASTERISK, XPathExpr], -1,
            makeBinaryExpr, ASSOC_LEFT],
        [XPathExpr, [XPathExpr, TOK_DIV, XPathExpr], -1,
            makeBinaryExpr, ASSOC_LEFT],
        [XPathExpr, [XPathExpr, TOK_MOD, XPathExpr], -1,
            makeBinaryExpr, ASSOC_LEFT],

        [XPathLiteral, [TOK_LITERALQ], -1,
            makeLiteralExpr],
        [XPathLiteral, [TOK_LITERALQQ], -1,
            makeLiteralExpr],

        [XPathNumber, [TOK_NUMBER], -1,
            makeNumberExpr],

        [XPathVariableReference, [TOK_DOLLAR, TOK_QNAME], 200,
            makeVariableReference]
    ];

// That function computes some optimizations of the above data
// structures and will be called right here. It merely takes the
// counter variables out of the global scope.

var xpathRules = [];

function xpathParseInit() {
    if (xpathRules.length) {
        return;
    }

    // Some simple optimizations for the xpath expression parser: sort
    // grammar rules descending by length, so that the longest match is
    // first found.

    xpathGrammarRules.sort(function (a, b) {
        var la = a[1].length;
        var lb = b[1].length;
        if (la < lb) {
            return 1;
        } else if (la > lb) {
            return -1;
        } else {
            return 0;
        }
    });

    var k = 1;
    for (var i = 0; i < xpathNonTerminals.length; ++i) {
        xpathNonTerminals[i].key = k++;
    }

    for (i = 0; i < xpathTokenRules.length; ++i) {
        xpathTokenRules[i].key = k++;
    }

    // Another slight optimization: sort the rules into bins according
    // to the last element (observing quantifiers), so we can restrict
    // the match against the stack to the subest of rules that match the
    // top of the stack.
    // bison, so that we don't have to do any explicit and iterated
    // match against the stack.

    function push_(array, position, element) {
        if (!array[position]) {
            array[position] = [];
        }
        array[position].push(element);
    }

    for (i = 0; i < xpathGrammarRules.length; ++i) {
        var rule = xpathGrammarRules[i];
        var pattern = rule[1];

        for (var j = pattern.length - 1; j >= 0; --j) {
            if (pattern[j] === Q_1M) {
                push_(xpathRules, pattern[j - 1].key, rule);
                break;

            } else if (pattern[j] === Q_MM || pattern[j] === Q_01) {
                push_(xpathRules, pattern[j - 1].key, rule);
                --j;

            } else {
                push_(xpathRules, pattern[j].key, rule);
                break;
            }
        }
    }
// eslint-disable-next-line no-unused-vars
    var sum = 0;
    xmlUtil.mapExec(xpathRules, function (i) {
        if (i) {
            sum += i.length;
        }
    });
}

// Local utility functions that are used by the lexer or parser.

function xpathCollectDescendants(nodelist, node, opt_tagName) {
    if (opt_tagName && node.getElementsByTagName) {
        copyArray(nodelist, node.getElementsByTagName(opt_tagName));
        return;
    }
    for (var n = node.firstChild; n; n = n.nextSibling) {
        nodelist.push(n);
        xpathCollectDescendants(nodelist, n);
    }
}

// DGF extract a tag name suitable for getElementsByTagName
function xpathExtractTagNameFromNodeTest(nodetest) {
    if (nodetest instanceof NodeTestName) {
        return nodetest.name;
    } else if (nodetest instanceof NodeTestAny || nodetest instanceof NodeTestElementOrAttribute) {
        return "*";
    }
}

function xpathCollectDescendantsReverse(nodelist, node) {
    for (var n = node.lastChild; n; n = n.previousSibling) {
        nodelist.push(n);
        xpathCollectDescendantsReverse(nodelist, n);
    }
}


// The entry point for the library: match an expression against a DOM
// node. Returns an XPath value.
function xpathDomEval(expr, node) {
    var expr1 = xpathParse(expr);
    return expr1.evaluate(new ExprContext(node));
}

// Utility function to sort a list of nodes.
// eslint-disable-next-line no-unused-vars
function xpathSort(input, sort) {
    if (sort.length === 0) {
        return;
    }
    var sortlist = [];
    var i;
    for (i = 0; i < input.contextSize(); ++i) {
        var node = input.nodelist[i];
        var sortitem = {node: node, key: []};
        var context = input.clone(node, 0, [node]);

        for (var j = 0; j < sort.length; ++j) {
            var s = sort[j];
            var value = s.expr.evaluate(context);

            var evalue;
            if (s.type === 'text') {
                evalue = value.stringValue();
            } else if (s.type === 'number') {
                evalue = value.numberValue();
            }
            sortitem.key.push({value: evalue, order: s.order});
        }

        // Make the sort stable by adding a lowest priority sort by
        // id. This is very convenient and furthermore required by the
        // spec ([XSLT] - Section 10 Sorting).
        sortitem.key.push({value: i, order: 'ascending'});

        sortlist.push(sortitem);
    }

    sortlist.sort(xpathSortByKey);

    var nodes = [];
    for (i = 0; i < sortlist.length; ++i) {
        nodes.push(sortlist[i].node);
    }
    input.nodelist = nodes;
    input.setNode(0);
}


// Sorts by all order criteria defined. According to the JavaScript
// spec ([ECMA] Section 11.8.5), the compare operators compare strings
// as strings and numbers as numbers.
//
// NOTE: In browsers which do not follow the spec, this breaks only in
// the case that numbers should be sorted as strings, which is very
// unxmlCommon.
function xpathSortByKey(v1, v2) {
    // NOTE: Sort key vectors of different length never occur in
    // xsltSort.

    for (var i = 0; i < v1.key.length; ++i) {
        var o = v1.key[i].order === 'descending' ? -1 : 1;
        if (v1.key[i].value > v2.key[i].value) {
            return +1 * o;
        } else if (v1.key[i].value < v2.key[i].value) {
            return -1 * o;
        }
    }

    return 0;
}


/**
 * Parses and then evaluates the given XPath expression in the given input context.
 * @param {String} select
 * @param {ExprContext} context
 * @param {Array=} ns
 * @returns {Object}
 */
function xpathEval(select, context, ns) {
    var str = select;
    if (ns !== undefined) {
        if (context.node)
            str = context.node.prepare(select, ns);
    }
    //parse statement
    var expr = xpathParse(str);
    //and return value
    return expr.evaluate(context);
}

if (typeof exports !== 'undefined')
{
    module.exports.evaluate = xpathEval;
    module.exports.select = xpathDomEval;
    module.exports.BinaryExpr = BinaryExpr;
    module.exports.ExprContext = ExprContext;
    /**
     * @param {XNode} node
     * @returns {ExprContext}
     */
    module.exports.createContext = function (node) {
        return new ExprContext(node)
    };
    module.exports.BooleanValue = BooleanValue;
    module.exports.FilterExpr = FilterExpr;
    module.exports.LiteralExpr = LiteralExpr;
    module.exports.LocationExpr = LocationExpr;
    module.exports.NodeSetValue = NodeSetValue;
    module.exports.NodeTestAny = NodeTestAny;
    module.exports.NodeTestComment = NodeTestComment;
    module.exports.NodeTestElementOrAttribute = NodeTestElementOrAttribute;
    module.exports.NodeTestName = NodeTestName;
    module.exports.NodeTestNC = NodeTestNC;
    module.exports.NodeTestPI = NodeTestPI;
    module.exports.NodeTestText = NodeTestText;
    module.exports.NumberExpr = NumberExpr;
    module.exports.NumberValue = NumberValue;
    module.exports.PathExpr = PathExpr;
    module.exports.PredicateExpr = PredicateExpr;
    module.exports.StepExpr = StepExpr;
}
