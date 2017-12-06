/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var xmlCommon = require('./common.js');
var xmlUtil = require('./util.js');
var xpath = require('./xpath.js');

function nodeRequire(module) {
    return require(module);
}

function xmlResolveEntities(s) {
    var parts = xmlUtil.stringSplit(s, '&');
    var ret = parts[0];
    for ( var i = 1; i < parts.length; ++i) {
        var rp = parts[i].indexOf(';');
        if (rp === -1) {
            // no entity reference: just a & but no ;
            ret += parts[i];
            continue;
        }

        var entityName = parts[i].substring(0, rp);
        var remainderText = parts[i].substring(rp + 1);

        var ch;
        switch (entityName) {
            case 'lt':
                ch = '<';
                break;
            case 'gt':
                ch = '>';
                break;
            case 'amp':
                ch = '&';
                break;
            case 'quot':
                ch = '"';
                break;
            case 'apos':
                ch = '\'';
                break;
            case 'nbsp':
                ch = String.fromCharCode(160);
                break;
            default:
                // Cool trick: let the DOM do the entity decoding. We assign
                // the entity text through non-W3C DOM properties and read it
                // through the W3C DOM. W3C DOM access is specified to resolve
                // entities.
                // var span = domCreateElement(window.document, 'span');
                var span;
                if (typeof window === 'undefined') {
                    var doc = new XDocument();
                    span = doc.createTextNode('&' + entityName + '; ');
                    ch = span.nodeValue;
                }
                else {
                    span = window.document.createElement('span');
                    span.innerHTML = '&' + entityName + '; ';
                    ch = span.childNodes[0].nodeValue.charAt(0);
                }
        }
        ret += ch + remainderText;
    }

    return ret;
}
// Parses the given XML string with our custom, JavaScript XML parser.
function xmlParse(xml) {
    var regex_empty = /\/$/;
    var regex_tagname = xmlCommon.XML10_TAGNAME_REGEXP;
    var regex_attribute = xmlCommon.XML10_ATTRIBUTE_REGEXP;
    if (xml.match(/^<\?xml/)) {
        // When an XML document begins with an XML declaration
        // VersionInfo must appear.
        if (xml.search(new RegExp(xmlCommon.XML10_VERSION_INFO)) === 5) {
            regex_tagname = xmlCommon.XML10_TAGNAME_REGEXP;
            regex_attribute = xmlCommon.XML10_ATTRIBUTE_REGEXP;
        } else if (xml.search(new RegExp(xmlCommon.XML11_VERSION_INFO)) === 5) {
            regex_tagname = xmlCommon.XML11_TAGNAME_REGEXP;
            regex_attribute = xmlCommon.XML11_ATTRIBUTE_REGEXP;
        } else {
            // VersionInfo is missing, or unknown version number.
            // Fall back to XML 1.0 or XML 1.1, or just return null?
            regex_tagname = xmlCommon.XML10_TAGNAME_REGEXP;
            regex_attribute = xmlCommon.XML10_ATTRIBUTE_REGEXP;
        }
    } else {
        // When an XML declaration is missing it's an XML 1.0 document.
        regex_tagname = xmlCommon.XML10_TAGNAME_REGEXP;
        regex_attribute = xmlCommon.XML10_ATTRIBUTE_REGEXP;
    }

    var xmldoc = new XDocument();
    var root = xmldoc;

    // For the record: in Safari, we would create native DOM nodes, but
    // in Opera that is not possible, because the DOM only allows HTML
    // element nodes to be created, so we have to do our own DOM nodes.

    // xmldoc = document.implementation.createDocument('','',null);
    // root = xmldoc; // .createDocumentFragment();
    // NOTE(mesch): using the DocumentFragment instead of the Document
    // crashes my Safari 1.2.4 (v125.12).
    var stack = [];

    var parent = root;
    stack.push(parent);

    // The token that delimits a section that contains markup as
    // content: CDATA or comments.
    var slurp = '';
    var start, end, data, node;
    var x = xmlUtil.stringSplit(xml, '<');
    for ( var i = 1; i < x.length; ++i) {
        var xx = xmlUtil.stringSplit(x[i], '>');
        var tag = xx[0];
        var text = xmlResolveEntities(xx[1] || '');

        if (slurp) {
            // In a "slurp" section (CDATA or comment): only check for the
            // end of the section, otherwise append the whole text.
            end = x[i].indexOf(slurp);
            if (end !== -1) {
                data = x[i].substring(0, end);
                parent.nodeValue += '<' + data;
                stack.pop();
                parent = stack[stack.length - 1];
                text = x[i].substring(end + slurp.length);
                slurp = '';
            } else {
                parent.nodeValue += '<' + x[i];
                text = null;
            }

        } else if (tag.indexOf('![CDATA[') === 0) {
            start = '![CDATA['.length;
            end = x[i].indexOf(']]>');
            if (end !== -1) {
                data = x[i].substring(start, end);
                node = xmldoc.createCDATASection(data);
                parent.appendChild(node);
            } else {
                data = x[i].substring(start);
                text = null;
                node = xmldoc.createCDATASection(data);
                parent.appendChild(node);
                parent = node;
                stack.push(node);
                slurp = ']]>';
            }

        } else if (tag.indexOf('!--') === 0) {
            start = '!--'.length;
            end = x[i].indexOf('-->');
            if (end !== -1) {
                data = x[i].substring(start, end);
                node = xmldoc.createComment(data);
                parent.appendChild(node);
            } else {
                data = x[i].substring(start);
                text = null;
                node = xmldoc.createComment(data);
                parent.appendChild(node);
                parent = node;
                stack.push(node);
                slurp = '-->';
            }

        } else if (tag.charAt(0) === '/') {
            stack.pop();
            parent = stack[stack.length - 1];

        } else if (tag.charAt(0) === '?') {
            // Ignore XML declaration and processing instructions
        } else if (tag.charAt(0) === '!') {
            // Ignore notation and comments
        } else {
            var empty = tag.match(regex_empty);
            var tagname = regex_tagname.exec(tag)[1];
            node = xmldoc.createElement(tagname);

            var att = regex_attribute.exec(tag);
            while (att) {
                var val = xmlResolveEntities(att[5] || att[7] || '');
                node.setAttribute(att[1], val);
                att = regex_attribute.exec(tag);
            }

            parent.appendChild(node);
            if (!empty) {
                parent = node;
                stack.push(node);
            }
        }

        if (text && parent !== root) {
            parent.appendChild(xmldoc.createTextNode(text));
        }
    }

    return root;
}

// Based on <http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/
// core.html#ID-1950641247>

// Traverses the element nodes in the DOM section underneath the given
// node and invokes the given callbacks as methods on every element
// node encountered. Function opt_pre is invoked before a node's
// children are traversed; opt_post is invoked after they are
// traversed. Traversal will not be continued if a callback function
// returns boolean false. NOTE(mesch): copied from
// <//google3/maps/webmaps/javascript/dom.js>.
function domTraverseElements(node, opt_pre, opt_post) {
    var ret;
    if (opt_pre) {
        ret = opt_pre.call(null, node);
        if (typeof ret === 'boolean' && !ret) {
            return false;
        }
    }

    for ( var c = node.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === xmlCommon.DOM_ELEMENT_NODE) {
            ret = arguments.callee.call(this, c, opt_pre, opt_post);
            if (typeof ret === 'boolean' && !ret) {
                return false;
            }
        }
    }

    if (opt_post) {
        ret = opt_post.call(null, node);
        if (typeof ret === 'boolean' && !ret) {
            return false;
        }
    }
}

/**
 * @class
 * @param type
 * @param name
 * @param opt_value
 * @param opt_owner
 * @constructor
 */
function XNode(type, name, opt_value, opt_owner) {
    this.attributes = [];
    this.childNodes = [];
    XNode.init.bind(this)(type, name, opt_value, opt_owner);
    Object.defineProperty(this, 'nodeTypedValue', {
       get: function() {
           return XSerializer.unescape(this);
       },
        set: function(value) {

            var s = this.ownerDocument.createTextNode(value).innerText();
            //Xml Attribute
            if (this.nodeType===2) {
                this.nodeValue = s;
            }
            //Xml Node
            else if (this.nodeType===1) {
                this.innerText(s);
            }
            else {
                throw new Error('Node typed value cannot be set for this type of node.')
            }
        }, enumerable:false, configurable:false
    });

}

XNode.prototype.appendChild = function(node) {

    //first node
    if (this.childNodes.length === 0)
        this.firstChild = node;

    // previousSibling
    node.previousSibling = this.lastChild;

    // nextSibling
    node.nextSibling = null;
    if (this.lastChild) {
        this.lastChild.nextSibling = node;
    }

    // parentNode
    node.parentNode = this;

    // lastChild
    this.lastChild = node;

    // childNodes
    this.childNodes.push(node);
};

// noinspection JSUnusedGlobalSymbols
/**
 * Replaces the child node oldNode with newNode node.
 * @param newNode {XNode} The new node we want to insert.
 * @param oldNode {XNode} The node we want to replace.
 */
XNode.prototype.replaceChild = function(newNode, oldNode) {
    if (oldNode === newNode) {
        return;
    }

    for ( var i = 0; i < this.childNodes.length; ++i) {
        if (this.childNodes[i] === oldNode) {
            this.childNodes[i] = newNode;

            var p = oldNode.parentNode;
            oldNode.parentNode = null;
            newNode.parentNode = p;

            p = oldNode.previousSibling;
            oldNode.previousSibling = null;
            newNode.previousSibling = p;
            if (newNode.previousSibling) {
                newNode.previousSibling.nextSibling = newNode;
            }

            p = oldNode.nextSibling;
            oldNode.nextSibling = null;
            newNode.nextSibling = p;
            if (newNode.nextSibling) {
                newNode.nextSibling.previousSibling = newNode;
            }

            if (this.firstChild === oldNode) {
                this.firstChild = newNode;
            }

            if (this.lastChild === oldNode) {
                this.lastChild = newNode;
            }

            break;
        }
    }
};
// noinspection JSUnusedGlobalSymbols
XNode.prototype.insertBefore = function(newNode, oldNode) {
    if (oldNode === newNode) {
        return;
    }

    if (oldNode.parentNode !== this) {
        return;
    }

    if (newNode.parentNode) {
        newNode.parentNode.removeChild(newNode);
    }

    var newChildren = [];
    for ( var i = 0; i < this.childNodes.length; ++i) {
        var c = this.childNodes[i];
        if (c === oldNode) {
            newChildren.push(newNode);

            newNode.parentNode = this;

            newNode.previousSibling = oldNode.previousSibling;
            oldNode.previousSibling = newNode;
            if (newNode.previousSibling) {
                newNode.previousSibling.nextSibling = newNode;
            }

            newNode.nextSibling = oldNode;

            if (this.firstChild === oldNode) {
                this.firstChild = newNode;
            }
        }
        newChildren.push(c);
    }
    this.childNodes = newChildren;
};
// noinspection JSUnusedGlobalSymbols
/**
 * Adds the specified node to the beginning of the list of child nodes for this node.
 * @param newNode {XNode} The node to add.
 * */
XNode.prototype.prependChild = 	function(newNode) {
    if (this.childNodes.length===0) {
        this.appendChild(newNode);
    }
};

XNode.prototype.removeChild = function(node) {
    var newChildren = [];
    for ( var i = 0; i < this.childNodes.length; ++i) {
        var c = this.childNodes[i];
        if (c !== node) {
            newChildren.push(c);
        } else {
            if (c.previousSibling) {
                c.previousSibling.nextSibling = c.nextSibling;
            }
            if (c.nextSibling) {
                c.nextSibling.previousSibling = c.previousSibling;
            }
            if (this.firstChild === c) {
                this.firstChild = c.nextSibling;
            }
            if (this.lastChild === c) {
                this.lastChild = c.previousSibling;
            }
        }
    }
    this.childNodes = newChildren;
};

/**
 * Gets a value indicating whether this node has any attributes.
 *
 * @returns Boolean
 */
XNode.prototype.hasAttributes = function() {
    if (this.attributes === null)
        return false;
    return (this.attributes.length > 0);
};
// noinspection JSUnusedGlobalSymbols
/**
 * @param {string} name
 * @returns {boolean}
 */
XNode.prototype.hasAttribute = function(name) {
    if (typeof name!=='string')
        return false;
    if (this.attributes === null)
        return false;
    return (this.selectSingleNode('@'.concat(name))!==null);
};

XNode.prototype.setAttribute = function(name, value) {
    for ( var i = 0; i < this.attributes.length; ++i) {
        if (this.attributes[i].nodeName === name) {
            this.attributes[i].nodeValue = '' + value;
            return;
        }
    }
    this.attributes.push(XNode.create(xmlCommon.DOM_ATTRIBUTE_NODE, name, value,
        this));
};

XNode.prototype.getAttribute = function(name) {
    for ( var i = 0; i < this.attributes.length; ++i) {
        if (this.attributes[i].nodeName === name) {
            return this.attributes[i].nodeValue;
        }
    }
    return null;
};
// noinspection JSUnusedGlobalSymbols
XNode.prototype.removeAttribute = function(name) {
    var a = [];
    for ( var i = 0; i < this.attributes.length; ++i) {
        if (this.attributes[i].nodeName !== name) {
            a.push(this.attributes[i]);
        }
    }
    this.attributes = a;
};

XNode.prototype.getElementsByTagName = function(name) {
    var ret = [];
    var self = this;
    if ("*" === name) {
        domTraverseElements(this, function(node) {
            if (self === node)
                return;
            ret.push(node);
        }, null);
    } else {
        domTraverseElements(this, function(node) {
            if (self === node)
                return;
            if (node.nodeName === name) {
                ret.push(node);
            }
        }, null);
    }
    return ret;
};

XNode.prototype.getElementById = function(id) {
    var ret = null;
    domTraverseElements(this, function(node) {
        if (node.getAttribute('id') === id) {
            ret = node;
            return false;
        }
    }, null);
    return ret;
};
/*
 * Gets a string that represents the value of the current XNode instance. If
 * XNode is empty then returns an empty string @return String
 */
XNode.prototype.value = function() {
    var ret = '';
    if (this.nodeType === xmlCommon.DOM_TEXT_NODE
        || this.nodeType === xmlCommon.DOM_CDATA_SECTION_NODE) {
        ret += this.nodeValue;

    } else if (this.nodeType === xmlCommon.DOM_ATTRIBUTE_NODE) {
        ret += this.nodeValue;
    } else if (this.nodeType === xmlCommon.DOM_ELEMENT_NODE
        || this.nodeType === xmlCommon.DOM_DOCUMENT_NODE
        || this.nodeType === xmlCommon.DOM_DOCUMENT_FRAGMENT_NODE) {
        for ( var i = 0; i < this.childNodes.length; ++i) {
            ret += arguments.callee(this.childNodes[i]);
        }
    }
    return ret;
};
/**
 * Gets a value indicating whether this node has any child nodes.
 *
 * @returns Boolean
 */
XNode.prototype.hasChildNodes = function() {
    if (this.childNodes === null)
        return false;
    return (this.childNodes.length > 0);
};

/**
 * Gets or sets the concatenated values of the node and all its child nodes.
 *
 * @param {string=} s
 * @return {string|*}
 */
XNode.prototype.innerText = function(s) {
    if (s === undefined) {
        // return innerText
        // validating node type
        if ((this.nodeType === xmlCommon.DOM_TEXT_NODE)
            || (this.nodeType === xmlCommon.DOM_CDATA_SECTION_NODE)
            || (this.nodeType === xmlCommon.DOM_COMMENT_NODE)
            || (this.nodeType === xmlCommon.DOM_ATTRIBUTE_NODE))
        // and return node values for text nodes
            return this.nodeValue ? this.nodeValue : '';
        var result = '';
        if (this.hasChildNodes()) {
            for ( var i = 0; i < this.childNodes.length; i++) {
                result += this.childNodes[i].innerText();
            }
        }
        return result;
    } else {
        // set innerText of this node
        if ((this.nodeType === xmlCommon.DOM_TEXT_NODE)
            || (this.nodeType === xmlCommon.DOM_CDATA_SECTION_NODE)
            || (this.nodeType === xmlCommon.DOM_COMMENT_NODE)
            || (this.nodeType === xmlCommon.DOM_ATTRIBUTE_NODE)
            || (this.nodeType === xmlCommon.DOM_ELEMENT_NODE)) {
            // remove child nodes if any
            while (this.childNodes.length > 0) {
                this.removeChild(this.childNodes[0]);
            }
            var value = s ? xmlCommon.escapeText(s) : '';
            /**
             * @type XNode
             */
            var textNode = this.ownerDocument.createTextNode(value);
            this.appendChild(textNode);
            return;
        }
        throw new Error("Invalid property set operation");
    }
};

/**
 * Gets a value that represents the inner XML equivalent of the current XNode.
 *
 * @return String
 */
XNode.prototype.innerXML = function() {
    // validating node type
    if ((this.nodeType === xmlCommon.DOM_TEXT_NODE)
        || (this.nodeType === xmlCommon.DOM_CDATA_SECTION_NODE)
        || (this.nodeType === xmlCommon.DOM_COMMENT_NODE))
    // and return empty string for text nodes
        return '';
    // if this node is an attribute node return attribute value
    if (this.nodeType === xmlCommon.DOM_ATTRIBUTE_NODE)
        return this.nodeValue ? this.nodeValue : '';

    if (this.hasChildNodes()) {
        var s = '';
        for ( var i = 0; i < this.childNodes.length; i++) {
            s += this.childNodes[i].outerXML();
        }
        return s;
    }
};
/**
 * Gets a value that represents the outer xml equivalent of the current XNode.
 *
 * @return String
 */
XNode.prototype.outerXML = function() {

    var s = '';

    switch (this.nodeType) {
        // 1. Xml Attribute Node
        case xmlCommon.DOM_ATTRIBUTE_NODE:
            s += this.name();
            s += '="';
            s += this.nodeValue ? xmlCommon.escapeText(this.nodeValue) : '';
            s += '"';
            return s;
        // 2. Xml Document Node
        case xmlCommon.DOM_DOCUMENT_NODE:
            return this.innerXML();
        // 3. Xml Text Node
        case xmlCommon.DOM_TEXT_NODE:
            return this.nodeValue ? xmlCommon.escapeText(this.nodeValue) : '';
        // 4. Xml CDATA Section Node
        case xmlCommon.DOM_CDATA_SECTION_NODE:
            s += '<![CDATA[';
            s += this.nodeValue ? this.nodeValue : '';
            s += ']]>';
            // and finally return
            return s;
        // 5. Xml Comment Node
        case xmlCommon.DOM_COMMENT_NODE:
            s += '<!--';
            s += this.nodeValue ? this.nodeValue : '';
            s += '-->';
            return s;
        default:
            break;
    }

    // write starting tag
    s += '<' + this.name();
    // write attributes (if any)
    if (this.hasAttributes()) {
        for ( var i = 0; i < this.attributes.length; i++) {
            s += ' ' + this.attributes[i].outerXML();
        }
    }

    if (this.hasChildNodes()) {
        // close tag
        s += '>';
        for ( var k = 0; k < this.childNodes.length; k++) {
            s += this.childNodes[k].outerXML();
        }
        // write closing tag
        s += '</' + this.name() + '>';
    }
    else {
        s += " />"
    }

    return s;
};
// noinspection JSUnusedGlobalSymbols
/**
 * Selects a node set matching the XPath expression.
 * @param {String} expr - A string value that represents the XPath expression we want to match.
 * @param {Array=} ns - An Array of namespaces
 * @returns {Array} An array of nodes that matching the specified XPath expression.
 */
XNode.prototype.selectNodes = function(expr, ns) {
    //format expression
    var nsExpr = (typeof ns === 'undefined' || ns === null) ? expr : this.prepare(expr, ns);
    //execute xpath expression
    var nodes = xpath.select(nsExpr, this);
    //return node set
    return nodes.value;
};

/**
 * Selects the first XNode that matches the XPath expression.
 *
 * @param {string} expr - A string value that represents the XPath expression we
 *            want to match.
 * @param {Array=} ns - An Array of namespaces
 * @returns {XNode} An XNode object that matching the specified XPath
 *          expression.
 */
XNode.prototype.selectSingleNode = function(expr, ns)
{
    //format expression
    var expr0 = ns===undefined ? expr : this.prepare(expr, ns);
    //execute xpath expression
    var nodes = xpath.select('(' + expr0 + ')[1]', this);
    //return result (if any)
    if (nodes.value.length > 0)
        return nodes.value[0];
    else
        return null;
};
// noinspection JSUnusedGlobalSymbols
/**
 * @returns {ExprContext|*}
 */
XNode.prototype.createContext = function()
{
    return new xpath.ExprContext(this);
};

/**
 *
 * @param {string} expr - A string that represents an XPATH expression.
 * @param {Array=} ns - An array of namespaces used in the specified expression
 * @returns {string} - A string that represents the prepared expression based on the namespaces declared on the document.
 */
XNode.prototype.prepare = function(expr, ns)
{
    if (ns===undefined)
        return expr;
    var expr0 = expr;
    for (var i = 0; i < ns.length; i++) {
        /**
         * @type {XNamespace}
         */
        var ns0 = ns[i];
        if (ns0) {
            if ((ns0.prefix)&&
                (ns0.uri)) {
                //try to replace namespace prefix in expression
                if (expr0.indexOf(ns0.prefix)>=0) {
                    //lookup namespace in document
                    var prefix = null;
                    if (this.nodeName==='#document')
                        prefix = this.documentElement.lookupPrefix(ns0.uri);
                    else
                        prefix = this.lookupPrefix(ns0.uri);
                    if (prefix) {
                        //replace namespace prefix
                        var pattern = new RegExp('\\b' + ns0.prefix + '\\b:', 'g');
                        expr0  =expr0.replace(pattern, prefix + ":");
                    }
                }
            }
        }
    }
    return expr0;
};

// noinspection JSUnusedGlobalSymbols
/**
 * Removes all the child nodes and/or attributes of the current node.
 */
XNode.prototype.removeAll = function() {
    while (this.childNodes.length > 0) {
        this.removeChild(this.childNodes[0]);
    }
    while (this.attributes.length > 0)
        this.attributes.pop();
};

XNode.prototype.name = function() {
    if (this.prefix && this.nodeName.indexOf(this.prefix + ':') !== 0) {
        return this.prefix + ':' + this.nodeName;
    } else {
        return this.nodeName;
    }
};

/**
 * Gets the prefix defined for the specified namespace URI.
 @param {string} namespaceURI
 @return {string}
 */
XNode.prototype.lookupPrefix = function(namespaceURI)
{
    //enumerate xmlns:* attributes for the given namespace URI
    var i = 0;
    if (this.nodeName)
        while(i<this.attributes.length) {
            if (this.attributes[i].prefix==='xmlns')
                if (this.attributes[i].nodeValue===namespaceURI)
                    return this.attributes[i].localName;
            i++;
        }
    //search parent (if ant)
    if (this.parentNode!==null) {
        return this.parentNode.lookupPrefix(namespaceURI);
    }
};

// Don't call as method, use apply() or call().
XNode.init = function(type, name, value, owner) {
    this.nodeType = type - 0;
    this.nodeName = '' + name;
    this.prefix = '';
    this.localName = this.nodeName;
    var ix = this.nodeName.indexOf(':');
    if (ix>0) {
        this.localName = this.nodeName.substr(ix+1);
        this.prefix = this.nodeName.substr(0,ix)
    }

    this.nodeValue = '' + value;
    /**
     * @type XDocument
     */
    this.ownerDocument = owner;
    this.firstChild = null;
    this.lastChild = null;
    this.nextSibling = null;
    this.previousSibling = null;
    this.parentNode = null;
};

XNode.unused_ = [];

XNode.recycle = function(node) {
    if (!node) {
        return;
    }

    if (node.constructor === XDocument) {
        XNode.recycle(node.documentElement);
        return;
    }

    if (node.constructor !== this) {
        return;
    }

    XNode.unused_.push(node);
    for ( var a = 0; a < node.attributes.length; ++a) {
        XNode.recycle(node.attributes[a]);
    }
    for ( var c = 0; c < node.childNodes.length; ++c) {
        XNode.recycle(node.childNodes[c]);
    }
    node.attributes.length = 0;
    node.childNodes.length = 0;
    XNode.init.call(node, 0, '', '', null);
};

XNode.create = function(type, name, value, owner) {
    if (XNode.unused_.length > 0) {
        var node = XNode.unused_.pop();
        XNode.init.call(node, type, name, value, owner);
        return node;
    } else {
        return new XNode(type, name, value, owner);
    }
};
/**
 * @class
 * @constructor
 */
function XDocument() {
    // According to the DOM Spec, ownerDocument of a
    // document node is null.
    XNode.call(this, xmlCommon.DOM_DOCUMENT_NODE, '#document', null, null);
    /**
     * @type XNode
     */
    this.documentElement = null;
}

XDocument.prototype = new XNode(xmlCommon.DOM_DOCUMENT_NODE, '#document');
// noinspection JSUnusedGlobalSymbols
XDocument.prototype.clear = function() {
    XNode.recycle(this.documentElement);
    this.documentElement = null;
};

XDocument.prototype.appendChild = function(node) {
    XNode.prototype.appendChild.call(this, node);
    this.documentElement = this.childNodes[0];
};
/**
 * @return XNode
 */
XDocument.prototype.createElement = function(name) {
    return XNode.create(xmlCommon.DOM_ELEMENT_NODE, name, null, this);
};
// noinspection JSUnusedGlobalSymbols
XDocument.prototype.createDocumentFragment = function() {
    return XNode.create(xmlCommon.DOM_DOCUMENT_FRAGMENT_NODE,
        '#document-fragment', null, this);
};

XDocument.prototype.createTextNode = function(value) {
    return XNode.create(xmlCommon.DOM_TEXT_NODE, '#text', value, this);
};
// noinspection JSUnusedGlobalSymbols
XDocument.prototype.createAttribute = function(name) {
    return XNode.create(xmlCommon.DOM_ATTRIBUTE_NODE, name, null, this);
};

XDocument.prototype.createComment = function(data) {
    return XNode.create(xmlCommon.DOM_COMMENT_NODE, '#comment', data, this);
};

XDocument.prototype.createCDATASection = function(data) {
    return XNode.create(xmlCommon.DOM_CDATA_SECTION_NODE, '#cdata-section', data,
        this);
};

/**
 * @return XDocument
 */
XDocument.loadXML= function(xml) {
    return xmlParse(xml);
};

/**
 * @return XDocument
 */
XDocument.loadSync = function(file) {
    try {
        var fs = nodeRequire('fs');
        return XDocument.loadXML(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        throw e;
    }
};

/**
 *
 * @param {string} file
 * @param {Function} callback
 */
XDocument.load = function(file, callback) {
    try {
        callback = callback || function() {};
        var fs = nodeRequire('fs');
        fs.readFile(file, 'utf8', function(err, data) {
            if (err) {
                return callback(err);
            }
            try {
                callback(null,XDocument.loadXML(data));
            }
            catch(err) {
                callback(err);
            }
        });
    } catch (err) {
        callback(err);
    }
};



XDocument.prototype.importNode = function(node) {
    var self = this;
    if (node.nodeType === xmlCommon.DOM_TEXT_NODE) {
        return this.createTextNode(node.nodeValue);

    } else if (node.nodeType === xmlCommon.DOM_CDATA_SECTION_NODE) {
        return this.createCDATASection(node.nodeValue);

    } else if (node.nodeType === xmlCommon.DOM_ELEMENT_NODE) {
        var newNode = this.createElement(node.nodeName);
        for ( var i = 0; i < node.attributes.length; ++i) {
            var an = node.attributes[i];
            var name = an.nodeName;
            var value = an.nodeValue;
            newNode.setAttribute(name, value);
        }


        for ( var c = node.firstChild; c; c = c.nextSibling) {
            //var cn = arguments.callee(self, c);
            var cn = self.importNode(c);
            newNode.appendChild(cn);
        }

        return newNode;

    } else {
        return self.createComment(node.nodeName);
    }
};

if (typeof Date.prototype.toXMLString === 'undefined') {
    /**
     * @returns {string}
     */
    var toXMLString = function()
    {
        var localeDate = new Date(this.getTime() - this.getTimezoneOffset() * 60000);
        var hours = Math.floor(Math.abs(this.getTimezoneOffset()/60)).toString(),
            minutes = Math.abs(this.getTimezoneOffset()%60).toString();
        var timeZoneString =   (this.getTimezoneOffset()<0 ? '+' : '-').concat(hours.length===1 ? '0'+hours : hours, ':', minutes.length===1 ? '0'+minutes : minutes);
        var localeDateString = localeDate.toISOString();
        if (localeDateString.indexOf('.')>0)
            localeDateString = localeDateString.substr(0, localeDateString.indexOf('.'));
        return localeDateString.concat(timeZoneString);
    };
    if (Object.defineProperty) {
        Object.defineProperty(Date.prototype, 'toXMLString', {
            value: toXMLString, configurable: true, enumerable: false, writable: true
        });
    }
    if (!Date.prototype.toXMLString) { Date.prototype.toXMLString = toXMLString; }

}



/**
 * @param {XDocument|XNode} parent
 */
Date.prototype.writeXml = function(parent) {
    if (typeof parent === 'undefined' || parent===null)
        return;
    if (parent.nodeType===1) {
        parent.appendChild(parent.ownerDocument.createTextNode(this.toXMLString()));
    }
    else if (parent.nodeType===9) {
        var node = parent.createElement('Date');
        node.appendChild(parent.createTextNode(this.toXMLString()));
        parent.appendChild(node);
    }
    else
        throw new Error('Parent node is of invalid type.');
};

if (typeof Date.prototype.writeXml === 'undefined') {
    /**
     * @param {XDocument|XNode} parent
     * @param {*=} options
     */
// eslint-disable-next-line no-unused-vars
    var dateWriteXml = function(parent, options) {
        if (typeof parent === 'undefined' || parent===null)
            return;
        if (parent.nodeType===1) {
            parent.appendChild(parent.ownerDocument.createTextNode(this.toXMLString()));
        }
        else
            throw new Error('Parent node is of invalid type.');
    };
    if (Object.defineProperty) {
        Object.defineProperty(Date.prototype, 'writeXml', {
            value: dateWriteXml, configurable: true, enumerable: false, writable: true
        });
    }
    if (!Date.prototype.writeXml) { Date.prototype.writeXml = dateWriteXml; }
}


if (typeof Array.prototype.writeXml === 'undefined') {
    /**
     * @param {XDocument|XNode} parent
     * @param {*=} options
     */
    var writeXml = function(parent, options) {
        if (typeof parent === 'undefined' || parent===null)
            return;
        options = options || { item:'Item' };
        for (var i = 0; i < this.length; i++) {
            var o = this[i];
            if (typeof o!=='undefined' && o!==null) {
                var name = options.item ? options.item : XSerializer.getClassName(o);
                XSerializer.writeXmlElement(parent, name, o, options);
            }
        }
    };
    if (Object.defineProperty) {
        Object.defineProperty(Array.prototype, 'writeXml', {
            value: writeXml, configurable: true, enumerable: false, writable: true
        });
    }
    if (!Array.prototype.writeXml) { Array.prototype.writeXml = writeXml; }
}


function XConverter() {
    //
}

XConverter.toInteger = function(value) {
    if (value && /\d/.test(value)) {
        var result = parseInt(value);
        if (result>=-2147483648 && result<=2147483647)
            return result;
    }
    return 0;
};

XConverter.toFloat = function(value) {
    if (value && /\d/.test(value))
        return parseFloat(value);
    return 0;
};

XConverter.toLong = function(value) {
    if (value && /\d/.test(value))
        return parseInt(value);
    return 0;
};

XConverter.DateTimeRegex = /^(\\d{4})-(\\d{1,2})-(\\d{1,2})T(\\d{1,22}):(\\d{2})(?::(\\d{2})(?:\\.(\\d{7}))?)?$/g;

XConverter.types = {
    boolean: {
        parse: function(value) {
            if (/true|TRUE/.test(value))
                return true;
            else if (/false|FALSE/.test(value))
                return false;
            else if (/\d/.test(value))
                return (parseInt(value)!==0);
            return false;
        }
    },
    byte: {
        parse: function(value) {
            if (value && /\d/.test(value)) {
                value = parseInt(value);
                if (value>=-128 && value<=127)
                    return value;
            }
            return 0;
        }
    },
    date: {
        parse: function(value) {
            if (typeof value === 'undefined' || value===null)
                return null;
            var match = value.match(XSerializer.DateTimeRegex);
            if (match!==null)
            {
                var year = parseInt(match[1]),
                    month = parseInt(match[2]),
                    day = parseInt(match[3]);
                return new Date(year, month, day);
            }
            else
            {
                throw new Error('Datetime format is invalid');
            }
        }
    },
    dateTime: {
        parse: function(value) {
            if (typeof value === 'undefined' || value===null)
                return null;
            var match = value.match(XConverter.DateTimeRegex);
            if (match!==null)
            {
                var year = parseInt(match[1]),
                    month = parseInt(match[2]),
                    day = parseInt(match[3]),
                    hour = parseInt(match[4]),
                    minute = parseInt(match[5]),
                    second = match[6].length > 0 ? parseInt(match[6]) : 0;
                return new Date(year, month, day, hour, minute, second);
            }
            else
            {
                throw new Error('Datetime format is invalid');
            }
        }
    },
    decimal: {
        parse: XConverter.toFloat
    },
    double: {
        parse: XConverter.toFloat
    },
    gYear: {
        parse: function(value) {
            if (value && /^(18|20)\d{2}$/.test(value))
                return parseInt(value) > 0 ? parseInt(value) : 1899;
            return 1899;
        }
    },
    float: {
        parse: XConverter.toFloat
    },
    int: {
        parse: XConverter.toInteger
    },
    integer: {
        parse: XConverter.toInteger
    },
    long: {
        parse: XConverter.toLong
    },
    negativeInteger: {
        parse: function(value) {
            if (value && /\d/.test(value))
                return parseInt(value) < 0 ? parseInt(value) : -1;
            return -1;
        }
    },
    nonNegativeInteger: {
        parse: function(value) {
            if (value && /\d/.test(value))
                return parseInt(value) >= 0 ? parseInt(value) : 0;
            return 0;
        }
    },
    nonPositiveInteger : {
        parse: function(value) {
            if (value && /\d/.test(value))
                return parseInt(value) <= 0 ? parseInt(value) : 0;
            return 0;
        }
    },
    positiveInteger : {
        parse: function(value) {
            if (value && /\d/.test(value))
                return parseInt(value) > 0 ? parseInt(value) : 1;
            return 1;
        }
    },
    short: {
        parse: function(value) {
            if (value && /\d/.test(value)) {
                value = parseInt(value);
                if (value>=-32768 && value<=32767)
                    return value;
            }
            return 0;
        }
    },
    string: {
        parse: function(value) {
            if (typeof value === 'undefined' || value===null)
                return null;
            return value.toString();
        }
    },
    unsignedByte: {
        parse: function(value) {
            if (value && /\d/.test(value)) {
                value = parseInt(value);
                if (value>=0 && value<=255)
                    return value;
            }
            return 0;
        }
    },
    unsignedInt: {
        parse: function(value) {
            if (value && /\d/.test(value)) {
                value = parseInt(value);
                if (value>=0 && value<=4294967295)
                    return value;
            }
            return 0;
        }
    },
    unsignedLong: {
        parse: function(value) {
            if (value && /\d/.test(value)) {
                value = parseInt(value);
                if (value>=0 && value<=18446744073709551615)
                    return value;
            }
            return 0;
        }
    },
    unsignedShort: {
        parse: function(value) {
            if (value && /\d/.test(value)) {
                value = parseInt(value);
                if (value>=0 && value<=65535)
                    return value;
            }
            return 0;
        }
    }
};

/**
 * @class
 * @constructor
 */
function XSerializer() {
    //
}

XSerializer.SR_DEFAULT_ROOT = 'Object';

/**
 * Serializes any object in an equivalent XDocument instance
 * @param {*} obj
 * @param {*} options The serialization options
 * @returns {XNode}
 */
XSerializer.serialize = function(obj, options) {
    if (typeof obj === 'undefined' || obj===null)
        return null;
    options = options || { };
    xmlUtil._extend(options, { serializeNull:true } );
    var doc = new XDocument();
    var docName = options.root ? options.root :  XSerializer.getClassName(obj);
    //append child
    doc.appendChild(doc.createElement(docName));
    if (typeof obj.writeXml === 'function') {
        //call write xml
        obj.writeXml(doc.documentElement, options);
    }
    else {
        //add properties
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                //do not serialize JS private properties e.g. _property, __property
                if (!/^_/.test(prop)) {
                    XSerializer.writeXmlElement(doc.documentElement, prop, obj[prop], options);
                }
            }
        }
    }
    return doc.documentElement;
};
/**
 * @param {XNode} parentNode The parent node
 * @param {String} propertyName The property name to be serialized
 * @param {*} propertyValue The property value to be serialized
 * @param {*} options The serialization options
 */
XSerializer.writeXmlElement = function(parentNode, propertyName, propertyValue, options) {
    if (typeof propertyName !== 'string')
        return;
    options = options || { serializeNull:true };
    var node = parentNode.ownerDocument.createElement(propertyName);
    if (typeof propertyValue === 'undefined' || propertyValue===null) {
        if (options.serializeNull) {
            parentNode.appendChild(node);
        }
        return;
    }
    if (typeof propertyValue === 'object') {
        if (typeof propertyValue.writeXml === 'function') {
            //call write xml
            propertyValue.writeXml(node);
        }
        else {
            //add properties
            for (var prop in propertyValue) {
                if (propertyValue.hasOwnProperty(prop)) {
                    //do not serialize JS private properties e.g. _property, __property
                    if (!/^_/.test(prop)) {
                        XSerializer.writeXmlElement(node, prop, propertyValue[prop], options);
                    }
                }
            }
        }
    }
    else {
        node.appendChild(node.ownerDocument.createTextNode(propertyValue));
    }
    parentNode.appendChild(node);
};


XSerializer.XmlSchema = 'http://www.w3.org/2001/XMLSchema';
/**
 * @param {*} obj
 * @returns {string}
 */
XSerializer.getClassName = function(obj) {
    var name = XSerializer.SR_DEFAULT_ROOT;
    if (typeof obj === 'undefined' || obj === null)
        return name;
    //add document element
    if (obj.__proto__)
        if (obj.__proto__.constructor)
            name=obj.__proto__.constructor.name || XSerializer.SR_DEFAULT_ROOT;
    return name;
};

/**
 * @param {XNode} node
 */
XSerializer.unescape = function(node) {
    var type = null, value = null;
    //Xml Node
    if (node.nodeType===1) {
        //get type attribute
        var xsd = node.lookupPrefix(XSerializer.XmlSchema);
        type = xsd ? node.getAttribute(xsd.concat(':type')) : node.getAttribute('type') ;
        //get node inner text
        value = node.innerText();
    }
    //Xml Attribute
    else if (node.nodeType===2) {
        //get attribute value
        value = node.nodeValue;
    }
    if (type) {
        if (XConverter.types[type])
            return XConverter.types[type].parse(value);
        return XConverter.types.string.parse(value);
    }
    else {
        if (/^\d*\.?\d*$/.test(value))
            return XConverter.types.float.parse(value);
        return XConverter.types.string.parse(value);
    }
};

/**
 * Deserializes an XNode instance and returns the equivalent object or an instance of the class defined by the constructor provided.
 * @param {XNode} obj
 * @param {Function=} ctor
 */
XSerializer.deserialize = function(obj, ctor) {
    var result = {};
    if (typeof ctor === 'function') {
        result = new ctor();
        if (typeof result.readXml === 'function') {
            result.readXml(obj);
            return result;
        }
    }
    if (obj.nodeName==='Array' || obj.getAttribute('type')==='array') {
        result = [];
    }
    var nodes = obj.childNodes.filter(function(x) { return x.nodeType===1; });
    var first;
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var childs = node.childNodes.filter(function(x) { return x.nodeType===1; });
        if (childs.length===0) {
            if (result[node.nodeName]) {
                if (xmlUtil.isArray(result[node.nodeName])) {
                    //push item to array
                    result[node.nodeName].push(XSerializer.unescape(node));
                }
                else {
                    //create array of objects
                    first = result[node.nodeName];
                    result[node.nodeName] = [ first, XSerializer.unescape(node) ];
                }
            }
            else {
                //set single valued property
                result[node.nodeName] = XSerializer.unescape(node);
            }
        }
        else {
            //deserialize object
            if (xmlUtil.isArray(result)) {
                result.push(XSerializer.deserialize(node))
            }
            else {
                var child = XSerializer.deserialize(node);
                if (result[node.nodeName]) {
                    if (xmlUtil.isArray(result[node.nodeName])) {
                        //push item to array
                        result[node.nodeName].push(child);
                    }
                    else {
                        //create array of objects
                        first = result[node.nodeName];
                        result[node.nodeName] = [ first, child ];
                    }
                }
                else
                {
                    result[node.nodeName] = child;
                }
            }

        }
    }
    return result;
};

/**
 * @class
 * @param {String} prefix
 * @param {String} uri
 * @constructor
 */
function XNamespace(prefix, uri) {
    this.prefix = prefix;
    this.uri = uri;
}

if (typeof exports !== 'undefined') {

    module.exports.XDocument = XDocument;
    module.exports.XNode = XNode;
    module.exports.XNamespace = XNamespace;
    module.exports.createDocument = function () {
        return new XDocument();
    };
    /**
     * @returns {XDocument}
     */
    module.exports.loadSync = XDocument.loadSync;
    /**
     * @returns {XDocument}
     */
    module.exports.load  = XDocument.load;
    /**
     * @param {string} s
     * @returns {XDocument}
     */
    module.exports.loadXML = function(s) {
        return XDocument.loadXML(s)
    };
    /**
     * @returns {XNode}
     */
    module.exports.serialize = function (obj, options) {
        return XSerializer.serialize(obj, options);
    };
    /**
     * @param {XNode} node
     * @param {Function=} ctor
     * @returns {*}
     */
    module.exports.deserialize = function (node, ctor) {
        return XSerializer.deserialize(node, ctor);
    };
    /**
     * @returns {XNode}
     */
    module.exports.evaluate = xpath.evaluate;
    /**
     * Creates an expression context that is going to be used in XPath evaluations.
     * @param {XNode} node
     */
    module.exports.createContext = function(node) {
        return new xpath.ExprContext(node);
    };
    module.exports.xpath = xpath;

}
