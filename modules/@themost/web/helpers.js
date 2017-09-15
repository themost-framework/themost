/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-06-10
 */
/**
 * @ignore
 */
var fs = require('fs'),
    ejs = require('ejs'),
    util = require('util'),
    HttpViewContext = require('./mvc').HttpViewContext;
/**
 *
 * @param {String} name
 * @param {*} attributes
 * @param {Function} callback
 */
HttpViewContext.prototype.input = function(name, attributes, callback)
{
    try {
        attributes = attributes || {};
        attributes.type = attributes.type || 'text';
        attributes.name = name;
        if (!attributes.id)
            attributes.id = name;
        this.writer.writeAttributes(attributes).writeFullBeginTag('input').writeTo(function(buffer) {
            callback(null, buffer);
        });
    }
    catch (e) {
        callback(e);
    }
};

HttpViewContext.prototype.textbox = function(name, attributes, callback)
{
    attributes = attributes || {};
    util._extend(attributes,{ type:'text' });
    HttpViewContext.prototype.input.call(this, name, attributes, callback)
};

HttpViewContext.prototype.password = function(name, attributes, callback)
{
    attributes = attributes || {};
    util._extend(attributes,{ type:'password',value:'' });
    HttpViewContext.prototype.input.call(this, name, attributes, callback)
};

HttpViewContext.prototype.passwordFor = function(model, field, attributes, callback)
{
    attributes = attributes || {};
    util._extend(attributes,{ type:'password',value:'' });
    HttpViewContext.prototype.inputFor.call(this, model, field, attributes, callback)
};

HttpViewContext.prototype.textboxFor = function(model, field, attributes, callback)
{
    try {
        attributes = attributes || {};
        util._extend(attributes,{ type:'text' });
        HttpViewContext.prototype.inputFor.call(this, model, field, attributes, callback)
    }
    catch (e) {
        callback(e);
    }
};

HttpViewContext.prototype.textarea = function(name, attributes, callback)
{
    try {
        attributes = attributes || {};
        attributes.name = name;
        attributes.id = attributes.id || name;
        attributes.cols = attributes.cols || 40;
        attributes.rows = attributes.rows || 5;
        this.writer.writeAttributes(attributes).writeBeginTag('textarea').writeText(attributes.value || '').writeEndTag().writeTo(function(buffer) {
            callback(null, buffer);
        });
    }
    catch (e) {
        callback(e);
    }
};

HttpViewContext.prototype.button = function(name, text, attributes, callback)
{
    try {
        attributes = attributes || {};
        attributes.name = name;
        this.writer.writeAttributes(attributes).writeBeginTag('button').writeText(text || '').writeEndTag().writeTo(function(buffer) {
            callback(null, buffer);
        });
    }
    catch (e) {
        callback(e);
    }
};

HttpViewContext.prototype.submit = function(name, text, attributes, callback)
{
    try {
        attributes = attributes || {};
        attributes.name = name;
        attributes.value = attributes.value || 'submit';
        HttpViewContext.prototype.button.call(this, name, text, attributes, callback);
    }
    catch (e) {
        callback(e);
    }
};

HttpViewContext.prototype.cancel = function(name, text, attributes, callback)
{
    try {
        attributes = attributes || {};
        attributes.name = name;
        attributes.value = attributes.value || 'cancel';
        HttpViewContext.prototype.button.call(this, name, text, attributes, callback);
    }
    catch (e) {
        callback(e);
    }
};

HttpViewContext.prototype.textareaFor = function(model, field, attributes, callback)
{
    try {
        attributes = attributes || {};
        attributes.id = field;
        if (typeof attributes.value === 'undefined')
            if (this.context.params[model])
                attributes.value = this.context.params[model][field] || '';
        var name = util.format('%s[%s]', model, field);
        HttpViewContext.prototype.textarea.call(this, name, attributes, callback);
    }
    catch (e) {
        callback(e);
    }
};

HttpViewContext.prototype.dropdown = function(name, list, attributes, callback)
{
    try {
        var self = this;
        attributes = attributes || {};
        attributes.name = name;
        attributes.id = attributes.id || name;
        this.writer.writeAttributes(attributes).writeBeginTag('select');
        if (util.isArray(list)) {
            list.forEach(function(item) {
                if (typeof item === 'string') {
                    self.writer.writeAttribute('value', item).writeBeginTag('option').writeText(item).writeEndTag();
                }
                else if (typeof item === 'object') {
                    self.writer.writeAttribute('value', item.value || '').writeBeginTag('option').writeText(item.label).writeEndTag();
                }
            });
        }
        this.writer.writeEndTag().writeTo(function(buffer) {
            callback(null, buffer);
        });
    }
    catch (e) {
        callback(e);
    }
};

HttpViewContext.prototype.dropdownFor = function(model, field, attributes, callback)
{
    try {
        var self = this;
        attributes = attributes || {};
        attributes.id = field;
        if (typeof attributes.value === 'undefined')
            if (this.context.params[model])
                attributes.value = this.context.params[model][field] || '';
        var name = util.format('%s[%s]', model, field);
        /**
         * gets target model
         * @type {DataModel}
         */
        var childModel = this.context.model(model);
        if (typeof childModel === 'undefined' || childModel==null) {
            callback(new Error('Target model cannot be found.'));
            return;
        }
        /**
         * gets target field
         * @type {DataAssociationMapping}
         */
        var mapping = childModel.inferMapping(field);
        if (typeof mapping === 'undefined' || mapping===null) {
            callback(new Error('Data association cannot be found.'));
        }
        /**
         * get associatedModel
         * @type {DataModel}
         */
        var parentModel = this.context.model(mapping.parentModel);
        if (typeof parentModel === 'undefined' || parentModel===null) {
            callback(new Error('Associated model cannot be found.'));
        }
        parentModel.select([{ 'label':mapping.parentLabel }, { 'value':mapping.parentField }]).all(function(err, result) {
            if (err) {
                callback(err);
            }
            else {
                HttpViewContext.prototype.dropdown.call(self, name, result, attributes, callback);
            }
        })

    }
    catch (e) {
        callback(e);
    }
};