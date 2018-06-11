/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var _ = require('lodash');
var sprintf = require('sprintf');
var LangUtils = require('@themost/common/utils').LangUtils;
var DataConfigurationStrategy = require('./data-configuration').DataConfigurationStrategy;
var conf = require('./data-configuration');

    var validators = { };
    /**
     * @class
     * @property {*} target - Gets or sets the target data object
     * @constructor
     */
    function DataValidator() {
        var context_;
        /**
         * Sets the current data context.
         * @param {DataContext|*} context
         */
        this.setContext = function(context) {
            context_ = context;
        };
        /**
         * Gets the current data context, if any.
         * @returns {DataContext|*}
         */
        this.getContext = function() {
            return context_;
        };
    }

    function zeroPad_(number, length) {
        number = number || 0;
        var res = number.toString();
        while (res.length < length) {
            res = '0' + res;
        }
        return res;
    }

    /**
     * @class
     * @param {string} pattern - A string which represents a regular expression
     * @property {string} message - Gets or sets a string which represents a custom validator message.
     * @constructor
     * @augments DataValidator
     * @classdesc Validates a variable against the regular expression provided
     *
     <p>PatternValidator is used by <a href="DataValidatorListener.html">DataValidatorListener</a> for validating data objects.</p>
     <p>
     An attribute of a data model may define a max length in validation properties:
     <pre class="prettyprint"><code>
     {
        "name": "model",
        "title": "Model",
        "description": "The model of the product. Use with the URL of a ProductModel or a textual representation of the model identifier. The URL of the ProductModel can be from an external source. It is recommended to additionally provide strong product identifiers via the gtin8/gtin13/gtin14 and mpn properties.",
        "type": "Text",
        "validation": {
            "pattern":"^[A-Z]{2}\\.\\d{3}$",
            "patternMessage":"Product model seems to be invalid. Valid values are VC.100, DX.010 etc."
        }
    }
     </code></pre>
     <p>An operation tries to save a data object:</p>
     <pre class="prettyprint"><code>
     var obj = {
                "model": "FS240098701",
                "name": "USB 3.0 Adapter"
            };
     context.model("Product").save(obj).then(function() {
               return done();
           }).catch(function(err) {
               return done(err);
           });
     </code></pre>
     </p>
     <p>and the result is:</p>
     <pre class="prettyprint"><code>
     {
        "code": "EPATTERN",
        "model": "Product",
        "field": "model",
        "message": "Product model seems to be invalid. Valid values are VC.100, DX.010 etc."
    }
     </code></pre>
     */
    function PatternValidator(pattern) {
        this.pattern = pattern;
        PatternValidator.super_.call(this);
    }
    LangUtils.inherits(PatternValidator, DataValidator);
    PatternValidator.DefaultMessage = "The value seems to be invalid.";
    /**
     * Validates the given value and returns a validation result or undefined if the specified value is invalid
     * @param val
     * @returns {{code: string, message: string, innerMessage: *}|undefined}
     */
    PatternValidator.prototype.validateSync = function(val) {
        if (_.isNil(val)) {
            return;
        }
        var valueTo = val;
        if (val instanceof Date) {
            var year   = val.getFullYear();
            var month  = zeroPad_(val.getMonth() + 1, 2);
            var day    = zeroPad_(val.getDate(), 2);
            var hour   = zeroPad_(val.getHours(), 2);
            var minute = zeroPad_(val.getMinutes(), 2);
            var second = zeroPad_(val.getSeconds(), 2);
            var millisecond = zeroPad_(val.getMilliseconds(), 3);
            //format timezone
            var offset = (new Date()).getTimezoneOffset(),
                timezone = (offset>=0 ? '+' : '') + zeroPad_(Math.floor(offset/60),2) + ':' + zeroPad_(offset%60,2);
            valueTo = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + '.' + millisecond + timezone;
        }
        var re = new RegExp(this.pattern, "ig");
        if  (!re.test(valueTo)) {

            var innerMessage = null, message = this.message || PatternValidator.DefaultMessage;
            if (this.getContext() && (typeof this.getContext().translate === 'function')) {
                innerMessage = message;
                message = this.getContext().translate(this.message || PatternValidator.DefaultMessage);
            }

            return {
                code:"EPATTERN",
                "message":message,
                "innerMessage":innerMessage
            }
        }
    };

    /**
     * @class
     * @param {number} length - A number which represents the minimum length
     * @property {number} minLength - Gets or sets an integer which represents the minimum length.
     * @property {string} message - Gets or sets a string which represents a custom validator message.
     * @augments {DataValidator}
     * @constructor
     * @classdesc Validates a variable which has a length property (e.g. a string) against the minimum length provided
     <p>MinLengthValidator is used by <a href="DataValidatorListener.html">DataValidatorListener</a> for validating data objects.</p>
     <p>
     An attribute of a data model may define a min length in validation properties:
     <pre class="prettyprint"><code>
     {
        "name": "model",
        "title": "Model",
        "description": "The model of the product. Use with the URL of a ProductModel or a textual representation of the model identifier. The URL of the ProductModel can be from an external source. It is recommended to additionally provide strong product identifiers via the gtin8/gtin13/gtin14 and mpn properties.",
        "type": "Text",
        "validation": {
            minLength:4
        }
    }
     </code></pre>
     <p>An operation tries to save a data object:</p>
     <pre class="prettyprint"><code>
     var obj = {
                "model": "FS2",
                "name": "USB 3.0 Adapter"
            };
     context.model("Product").save(obj).then(function() {
               return done();
           }).catch(function(err) {
               return done(err);
           });
     </code></pre>
     </p>
     <p>Result:</p>
     <pre class="prettyprint"><code>
     {
        "code": "EMINLEN",
        "model": "Product",
        "field": "model",
        "message": "The value is too short. It should have 4 characters or more."
    }
     </code></pre>
     */
    function MinLengthValidator(length) {
        this.minLength = length;
        MinLengthValidator.super_.call(this);
    }

    LangUtils.inherits(MinLengthValidator,DataValidator);

    MinLengthValidator.DefaultMessage = "The value is too short. It should have %s characters or more.";

    /**
     * Validates the given value. If validation fails, the operation will return a validation result.
     * @param {*} val
     * @returns {{code: string, minLength: number, message:string, innerMessage: string}|undefined}
     */
    MinLengthValidator.prototype.validateSync = function(val) {
        if (_.isNil(val)) {
            return;
        }
        if (val.hasOwnProperty('length')) {
            if (val.length<this.minLength) {

                var innerMessage = null, message = sprintf.sprintf(this.message || MinLengthValidator.DefaultMessage, this.minLength);
                if (this.getContext() && (typeof this.getContext().translate === 'function')) {
                    innerMessage = message;
                    message = sprintf.sprintf(this.getContext().translate(this.message || MinLengthValidator.DefaultMessage), this.minLength);
                }

                return {
                    code:"EMINLEN",
                    minLength:this.minLength,
                    message:message,
                    innerMessage:innerMessage
                }

            }
        }
    };

    /**
     * @class
     * @param {number} length - A number which represents the maximum length
     * @augments {DataValidator}
     * @property {number} maxLength - Gets or sets an integer which represents the maximum length.
     * @property {string} message - Gets or sets a string which represents a custom validator message.
     * @constructor
     * @classdesc Validates a variable which has a length property (e.g. a string) against the maximum length provided
     <p>MaxLengthValidator is used by <a href="DataValidatorListener.html">DataValidatorListener</a> for validating data objects.</p>
     <p>
     An attribute of a data model may define a max length in validation properties:
     <pre class="prettyprint"><code>
     {
        "name": "model",
        "title": "Model",
        "description": "The model of the product. Use with the URL of a ProductModel or a textual representation of the model identifier. The URL of the ProductModel can be from an external source. It is recommended to additionally provide strong product identifiers via the gtin8/gtin13/gtin14 and mpn properties.",
        "type": "Text",
        "validation": {
            maxLength:8
        }
    }
     </code></pre>
     <p>An operation tries to save a data object:</p>
     <pre class="prettyprint"><code>
     var obj = {
                "model": "FS240098701",
                "name": "USB 3.0 Adapter"
            };
     context.model("Product").save(obj).then(function() {
               return done();
           }).catch(function(err) {
               return done(err);
           });
     </code></pre>
     </p>
     <p>Result:</p>
     <pre class="prettyprint"><code>
     {
        "code": "EMAXLEN",
        "model": "Product",
        "field": "model",
        "message": "The value is too long. It should have 8 characters or fewer."
    }
     </code></pre>
     <p><strong>Note:</strong>If validation.maxLength is missing and data model's attribute has a defined size then the operation will try to validate data object against this size.
     <pre class="prettyprint"><code>
     {
        "name": "model",
        "title": "Model",
        "description": "The model of the product. Use with the URL of a ProductModel or a textual representation of the model identifier. The URL of the ProductModel can be from an external source. It is recommended to additionally provide strong product identifiers via the gtin8/gtin13/gtin14 and mpn properties.",
        "type": "Text",
        "size":8
    }
     </code></pre>
     */
    function MaxLengthValidator(length) {
        this.maxLength = length;
        MaxLengthValidator.super_.call(this);
    }
    LangUtils.inherits(MaxLengthValidator, DataValidator);

    MaxLengthValidator.DefaultMessage = "The value is too long. It should have %s characters or fewer.";

    /**
     * Validates the given value. If validation fails, the operation will return a validation result.
     * @param {*} val
     * @returns {{code: string, maxLength: number, message:string, innerMessage: string}|undefined|*}
     */
    MaxLengthValidator.prototype.validateSync = function(val) {
        if (_.isNil(val)) {
            return;
        }

        var innerMessage = null, message = sprintf.sprintf(this.message || MaxLengthValidator.DefaultMessage, this.maxLength);
        if (this.getContext() && (typeof this.getContext().translate === 'function')) {
            innerMessage = message;
            message = sprintf.sprintf(this.getContext().translate(this.message || MaxLengthValidator.DefaultMessage), this.maxLength);
        }

        if (val.hasOwnProperty('length')) {
            if (val.length>this.maxLength) {
                return {
                    code:"EMAXLEN",
                    maxLength:this.maxLength,
                    message: message,
                    innerMessage:innerMessage
                }
            }
        }
    };

    /**
     * @class
     * @param {number|Date|*} min - A value which represents the minimum value
     * @augments {DataValidator}
     * @property {*} minValue - Gets or sets a value which represents the minimum value.
     * @property {string} message - Gets or sets a string which represents a custom validator message.
     * @constructor
     * @classdesc Validates a value against the minimum value provided
     <p>MinValueValidator is used by <a href="DataValidatorListener.html">DataValidatorListener</a> for validating data objects.</p>
     <p>
     An attribute of a data model may define a max value in validation properties:
     <pre class="prettyprint"><code>
     {
        "name": "price",
        "title": "Price",
        "description": "The price of the product.",
        "type": "Number",
        "validation": {
            "minValue":5
        }
    }
     </code></pre>
     <p>An operation tries to save a data object:</p>
     <pre class="prettyprint"><code>
     var obj = {
                "price":2.5
                "model": "FS2USB42",
                "name": "USB 3.0 Adapter"
            };
     context.model("Product").save(obj).then(function() {
               return done();
           }).catch(function(err) {
               return done(err);
           });
     </code></pre>
     </p>
     <p>and the result is:</p>
     <pre class="prettyprint"><code>
     {
        "code": "EMINVAL",
        "model": "Product",
        "field": "price",
        "message": "The value should be greater than or equal to 5."
    }
     </code></pre>
     */
    function MinValueValidator(min) {
        this.minValue = min;
        MinValueValidator.super_.call(this);
    }

    LangUtils.inherits(MinValueValidator, DataValidator);

    MinValueValidator.DefaultMessage = "The value should be greater than or equal to %s.";
    /**
     * Validates the given value. If validation fails, the operation will return a validation result.
     * @param {*} val
     * @returns {{code: string, maxLength: number, message:string, innerMessage: string}|undefined|*}
     */
    MinValueValidator.prototype.validateSync = function(val) {
        if (_.isNil(val)) {
            return;
        }
        if (val<this.minValue) {

            var innerMessage = null, message = sprintf.sprintf(this.message || MinValueValidator.DefaultMessage, this.minValue);
            if (this.getContext() && (typeof this.getContext().translate === 'function')) {
                innerMessage = message;
                message = sprintf.sprintf(this.getContext().translate(this.message || MinValueValidator.DefaultMessage), this.minValue);
            }

            return {
                code:"EMINVAL",
                minValue:this.minValue,
                message:message,
                innerMessage:innerMessage
            }
        }
    };
    /**
     * @class
     * @param {number|Date|*} max - A value which represents the maximum value
     * @augments {DataValidator}
     * @property {*} maxValue - Gets or sets a value which represents the maximum value.
     * @property {string} message - Gets or sets a string which represents a custom validator message.
     * @constructor
     * @classdesc Validates a value against the maximum value provided
     <p>MaxValueValidator is used by <a href="DataValidatorListener.html">DataValidatorListener</a> for validating data objects.</p>
     <p>
     An attribute of a data model may define a min value in validation properties:
     <pre class="prettyprint"><code>
     {
        "name": "price",
        "title": "Price",
        "description": "The price of the product.",
        "type": "Number",
        "validation": {
            "maxValue":1000
        }
    }
     </code></pre>
     <p>An operation tries to save a data object:</p>
     <pre class="prettyprint"><code>
     var obj = {
                "price":1245.50
                "model": "FS2USB42",
                "name": "USB 3.0 Adapter"
            };
     context.model("Product").save(obj).then(function() {
               return done();
           }).catch(function(err) {
               return done(err);
           });
     </code></pre>
     </p>
     <p>Result:</p>
     <pre class="prettyprint"><code>
     {
        "code": "EMAXVAL",
        "model": "Product",
        "field": "price",
        "message": "The value should be lower or equal to 1000."
    }
     </code></pre>
     */
    function MaxValueValidator(max) {
        this.maxValue = max;
        MaxValueValidator.super_.call(this);
    }

    LangUtils.inherits(MaxValueValidator, DataValidator);


    MaxValueValidator.DefaultMessage = "The value should be lower or equal to %s.";
    /**
     * Validates the given value. If validation fails, the operation will return a validation result.
     * @param {*} val
     * @returns {{code: string, maxLength: number, message:string, innerMessage: string}|undefined|*}
     */
    MaxValueValidator.prototype.validateSync = function(val) {
        if (_.isNil(val)) {
            return;
        }
        if (val>this.maxValue) {

            var innerMessage = null, message = sprintf.sprintf(this.message || MaxValueValidator.DefaultMessage , this.maxValue);
            if (this.getContext() && (typeof this.getContext().translate === 'function')) {
                innerMessage = message;
                message = sprintf.sprintf(this.getContext().translate(this.message || MaxValueValidator.DefaultMessage), this.maxValue);
            }

            return {
                code:"EMAXVAL",
                maxValue:this.maxValue,
                message:message,
                innerMessage:innerMessage
            }
        }
    };
    /**
     * @class
     * @param {number|Date|*} min - A value which represents the minimum value
     * @param {number|Date|*} max - A value which represents the maximum value
     * @augments {DataValidator}
     * @property {*} minValue - Gets or sets a value which represents the minimum value
     * @property {*} maxValue - Gets or sets a value which represents the maximum value
     * @property {string} message - Gets or sets a string which represents a custom validator message.
     * @constructor
     * @classdesc Validates a value against a minimum and maximum value
     <p>RangeValidator is used by <a href="DataValidatorListener.html">DataValidatorListener</a> for validating data objects.</p>
     <p>
     An attribute of a data model may define min and max values in validation properties:
     <pre class="prettyprint"><code>
     {
        "name": "price",
        "title": "Price",
        "description": "The price of the product.",
        "type": "Number",
        "validation": {
            "minValue":5,
            "maxValue":100
        }
    }
     </code></pre>
     <p>An operation tries to save a data object:</p>
     <pre class="prettyprint"><code>
     var obj = {
                "price":102.5
                "model": "FS2USB42",
                "name": "USB 3.0 Adapter"
            };
     context.model("Product").save(obj).then(function() {
               return done();
           }).catch(function(err) {
               return done(err);
           });
     </code></pre>
     </p>
     <p>and the result is:</p>
     <pre class="prettyprint"><code>
     {
        "code": "ERANGE",
        "model": "Product",
        "field": "price",
        "message": "The value should be between 5 to 100."
    }
     </code></pre>
     */
    function RangeValidator(min,max) {
        this.minValue = min;
        this.maxValue = max;
        RangeValidator.super_.call(this);
    }

    LangUtils.inherits(RangeValidator, DataValidator);

    RangeValidator.DefaultMessage = "The value should be between %s to %s.";
    /**
     * Validates the given value. If validation fails, the operation will return a validation result.
     * @param {*} val
     * @returns {{code: string, maxLength: number, message:string, innerMessage: string}|undefined|*}
     */
    RangeValidator.prototype.validateSync = function(val) {
        if (_.isNil(val)) {
            return;
        }
        var minValidator, maxValidator, minValidation, maxValidation;
        if (!_.isNil(this.minValue)) {
            minValidator = new MinValueValidator(this.minValue);
            minValidation = minValidator.validateSync(val);
        }
        if (!_.isNil(this.maxValue)) {
            maxValidator = new MaxValueValidator(this.maxValue);
            maxValidation = maxValidator.validateSync(val);
        }
        if (minValidator && maxValidator && (minValidation || maxValidation)) {
            var innerMessage = null, message = sprintf.sprintf(this.message || RangeValidator.DefaultMessage, this.minValue, this.maxValue);
            if (this.getContext() && (typeof this.getContext().translate === 'function')) {
                innerMessage = message;
                message = sprintf.sprintf(this.getContext().translate(this.message || RangeValidator.DefaultMessage), this.minValue, this.maxValue);
            }
            return {
                code:"ERANGE",
                maxValue:this.maxValue,
                message:message,
                innerMessage:innerMessage
            }
        }
        else if (minValidation) {
            return minValidation;
        }
        else if (maxValidation) {
            return maxValidation;
        }
    };
    /**
     * @class
     * @param {string|*} type - The data type which is going to be used for data validation
     * @property {*} dataType - Gets or sets the data type which is going to be used for data validation
     * @constructor
     * @augments {DataValidator}
     * @classdesc Validates a value against a pre-defined data type
     *
     <p>DataTypeValidator is used by <a href="DataValidatorListener.html">DataValidatorListener</a> for validating data objects.</p>
     <p>
     An attribute of a data model may define a data type in validation properties:
     <pre class="prettyprint"><code>
     {
        "name": "price",
        "title": "Price",
        "description": "The price of the product.",
        "type": "Number",
        "validation": {
            "type":"NonNegativeNumber"
        }
    }
     </code></pre>
     <p>There is a collection of pre-defined data types. This collection may also be extended by using dataTypes.json configuration.</p>
     <table class="table-flat">
     <thead><tr><th>Type</th><th>Description</th></tr></thead>
     <tbody>
     <tr><td>NegativeInteger</td><td>An integer containing only negative values (..,-2,-1)</td></tr>
     <tr><td>NegativeNumber</td><td>A number containing only negative values (..,-2,-1)</td></tr>
     <tr><td>NonNegativeInteger</td><td>An integer containing only non-negative values (0,1,2,..)</td></tr>
     <tr><td>NonNegativeNumber</td><td>An number containing only non-negative values (0,1,2,..)</td></tr>
     <tr><td>NonPositiveInteger</td><td>An integer containing only non-positive values (..,-2,-1,0)</td></tr>
     <tr><td>NonPositiveNumber</td><td>A number containing only non-positive values (..,-2,-1,0)</td></tr>
     <tr><td>PositiveInteger</td><td>An integer containing only positive values (1,2,..)</td></tr>
     <tr><td>PositiveNumber</td><td>A number containing only positive values (0.1,+1,2,..)</td></tr>
     <tr><td>Float</td><td>Float data type is a single-precision floating point.</td></tr>
     <tr><td>Email</td><td>A string which represents an email address (e.g. user@example.com)</td></tr>
     <tr><td>Guid</td><td>A string which represents a global unique identifier (e.g. 21EC2020-3AEA-4069-A2DD-08002B30309D).</td></tr>
     <tr><td>AbsoluteURI</td><td>A string which represents an absolute URI address (e.g. https://www.example.com/help?article=1001)</td></tr>
     <tr><td>RelativeURI</td><td>A string which represents a relative URI address (e.g. /help?article=1001)</td></tr>
     <tr><td>Time</td><td>A string which represents an instant of time that recurs every day (e.g. 13:20:45)</td></tr>
     <tr><td>Date</td><td>Represents a date value.</td></tr>
     <tr><td>DateTime</td><td>Represents a date and time value.</td></tr>
     <tr><td>Duration</td><td>A string which represents a duration of time (e.g. P1Y1M10D, P10D, -P0Y1M10D2H15M30S etc)</td></tr>
     <tr><td>IP</td><td>A string which represents an IPv4 address (e.g. 127.0.0.1)</td></tr>
     </tbody>
     </table>
     <p>A custom data type may be defined as follows:</p>
     <pre class="prettyprint"><code>
     "ProductModel": {
    "comment": "A string which represents the model of a product",
    "label": "Product Model",
    "properties": {
      "pattern":"^[A-Z]{2}\\.\\d{3}$",
      "patternMessage":"Product model seems to be invalid. Valid values are VC.100, DX.010 etc."
    },
    "supertypes": [
      "Text"
    ],
    "type": "string",
    "sqltype":"Text",
    "version":"1.0"
  }
     </code></pre>
     <p>An operation tries to save a data object:</p>
     <pre class="prettyprint"><code>
     var obj = {
                "price":-10.75
                "model": "FS2USB42",
                "name": "USB 3.0 Adapter"
            };
     context.model("Product").save(obj).then(function() {
               return done();
           }).catch(function(err) {
               return done(err);
           });
     </code></pre>
     </p>
     <p>and the result is:</p>
     <pre class="prettyprint"><code>
     {
        "code": "EPATTERN",
        "model": "Product",
        "field": "price",
        "message": "The value should be a number greater or equal to zero."
    }
     </code></pre>
     */
    function DataTypeValidator(type) {
        DataTypeValidator.super_.call(this);
        /**
         * @name DataTypeValidator#type
         * @type {*}
         */
        Object.defineProperty(this, 'dataType', {
            get: function() {
                if (typeof type === 'string') {
                    return this.getContext().getConfiguration().getStrategy(DataConfigurationStrategy).dataTypes[type];
                }
                else {
                    return type;
                }
            }
        });
    }

    LangUtils.inherits(DataTypeValidator, DataValidator);

    /**
     * @param val
     * @returns {*}
     */
    DataTypeValidator.prototype.validateSync = function(val) {
        if (typeof this.dataType === 'undefined') {
            return;
        }
        /**
         * @type {{pattern:string,patternMessage:string,minValue:*,maxValue:*,minLength:number,maxLength:number}}
         */
        var properties = this.dataType.properties;
        if (typeof properties !== 'undefined') {
            var validator, validationResult;
            //validate pattern if any
            if (properties.pattern) {
                validator = new PatternValidator(properties.pattern);
                validator.setContext(this.getContext());
                validationResult = validator.validateSync(val);
                if (validationResult) {
                    if (properties.patternMessage) {

                        validationResult.message = properties.patternMessage;
                        if (this.getContext() && (typeof this.getContext().translate === 'function')) {
                            validationResult.innerMessage = validationResult.message;
                            validationResult.message = this.getContext().translate(properties.patternMessage);
                        }
                    }
                    return validationResult;
                }
            }
            if (properties.hasOwnProperty('minValue') && properties.hasOwnProperty('maxValue')) {
                validator = new RangeValidator(properties.minValue, properties.maxValue);
                validator.setContext(this.getContext());
                validationResult = validator.validateSync(val);
                if (validationResult) {
                    return validationResult;
                }
            }
            else if (properties.hasOwnProperty('minValue')) {
                validator = new MinValueValidator(properties.minValue);
                validator.setContext(this.getContext());
                validationResult = validator.validateSync(val);
                if (validationResult) {
                    return validationResult;
                }
            }
            else if (properties.hasOwnProperty('maxValue')) {
                validator = new MaxValueValidator(properties.maxValue);
                validator.setContext(this.getContext());
                validationResult = validator.validateSync(val);
                if (validationResult) {
                    return validationResult;
                }
            }
            if (properties.hasOwnProperty('minLength')) {
                validator = new MinLengthValidator(properties.minLength);
                validator.setContext(this.getContext());
                validationResult = validator.validateSync(val);
                if (validationResult) {
                    return validationResult;
                }
            }
            if (properties.hasOwnProperty('maxLength')) {
                validator = new MaxLengthValidator(properties.maxLength);
                validator.setContext(this.getContext());
                validationResult = validator.validateSync(val);
                if (validationResult) {
                    return validationResult;
                }
            }
        }
    };
    /**
     * @class
     * @classdesc DataValidatorListener is one of the default listeners of MOST data models. Validates data objects against validation rules defined in model attributes.
     * <h4>Validation Rules</h4>
     * <p>Each attribute may have a set of validation rules. These rules may validate data against:
     * <ul>
     * <li><a href="module-most-data_data-validator-MaxValueValidator.html">a maximum value</a></li>
     * <li><a href="module-most-data_data-validator-MinValueValidator.html">a minimum value</a></li>
     * <li><a href="module-most-data_data-validator-MaxLengthValidator.html">a maximum length</a></li>
     * <li><a href="module-most-data_data-validator-MinLengthValidator.html">a minimum length</a></li>
     * <li><a href="module-most-data_data-validator-RangeValidator.html">a value range</a></li>
     * <li><a href="module-most-data_data-validator-RequiredValidator.html">a required attribute</a></li>
     * <li><a href="module-most-data_data-validator-PatternValidator.html">a regular expression</a></li>
     * <li><a href="module-most-data_data-validator-DataTypeValidator.html">a pre-defined data type</a></li>
     * <li><a href="#custom">a custom validator</a></li>
     * </ul>
     * </p>
     <h6>Use default validation rules</h6>
     <p>
     In the following example price attribute has a validation which allows values between 0 to 1000:
     <pre class="prettyprint"><code>
     {
         "name": "price",
         "title": "Price",
         "description": "The price of the product.",
         "type": "Number",
         "nullable":false,
         "validation": {
             "minValue":0,
             "maxValue":1000
         }
     }
     </code></pre>
     </p>
     <p>
     The following code snippet tries to save an object with a negative value in price:
     <pre class="prettyprint"><code>
     var obj = {
                "price": -23.45,
                "model": "FS2400",
                "name": "USB 3.0 Adapter"
            };
     context.model("Product").save(obj).then(function() {
               return done();
           }).catch(function(err) {
               return done(err);
           });
     </code></pre>
     </p>
     <p>
     and the result is:
     </p>
     <pre class="prettyprint"><code>
     {
         "code": "ERANGE",
         "model": "Product",
         "field": "price",
         "message": "The value should be between 0 to 1000."
     }
     </code></pre>
     <h6>Use data type validation</h6>
     <p>
     A validation may be performed by using a pre-defined data type:
     <pre class="prettyprint"><code>
     {
         "name": "price",
         "title": "Price",
         "description": "The price of the product.",
         "type": "Number",
         "nullable":false,
         "validation": {
            "type":"NonNegativeNumber"
         }
     }
     </code></pre>
     <p>An operation tries to save a product with a negative price:</p>
     <pre class="prettyprint"><code>
     var obj = {
                "price": -23.45,
                "model": "FS2400",
                "name": "USB 3.0 Adapter"
            };
     context.model("Product").save(obj).then(function() {
               return done();
           }).catch(function(err) {
               return done(err);
           });
     </code></pre>
     <p>and the result is:</p>
     <pre class="prettyprint"><code>
     {
        "code": "EPATTERN",
        "model": "Product",
        "field": "price",
        "message": "The value should be a number greater or equal to zero."
    }
     </code></pre>
     <p>The following list contains a set of pre-defined data types which may be used for data type validation:</p>
     <table class="table-flat">
     <thead><tr><th>Type</th><th>Description</th></tr></thead>
     <tbody>
     <tr><td>NegativeInteger</td><td>An integer containing only negative values (..,-2,-1)</td></tr>
     <tr><td>NegativeNumber</td><td>A number containing only negative values (..,-2,-1)</td></tr>
     <tr><td>NonNegativeInteger</td><td>An integer containing only non-negative values (0,1,2,..)</td></tr>
     <tr><td>NonNegativeNumber</td><td>An number containing only non-negative values (0,1,2,..)</td></tr>
     <tr><td>NonPositiveInteger</td><td>An integer containing only non-positive values (..,-2,-1,0)</td></tr>
     <tr><td>NonPositiveNumber</td><td>A number containing only non-positive values (..,-2,-1,0)</td></tr>
     <tr><td>PositiveInteger</td><td>An integer containing only positive values (1,2,..)</td></tr>
     <tr><td>PositiveNumber</td><td>A number containing only positive values (0.1,+1,2,..)</td></tr>
     <tr><td>Float</td><td>Float data type is a single-precision floating point.</td></tr>
     <tr><td>Email</td><td>A string which represents an email address (e.g. user@example.com)</td></tr>
     <tr><td>Guid</td><td>A string which represents a global unique identifier (e.g. 21EC2020-3AEA-4069-A2DD-08002B30309D).</td></tr>
     <tr><td>AbsoluteURI</td><td>A string which represents an absolute URI address (e.g. https://www.example.com/help?article=1001)</td></tr>
     <tr><td>RelativeURI</td><td>A string which represents a relative URI address (e.g. /help?article=1001)</td></tr>
     <tr><td>Time</td><td>A string which represents an instant of time that recurs every day (e.g. 13:20:45)</td></tr>
     <tr><td>Date</td><td>Represents a date value.</td></tr>
     <tr><td>DateTime</td><td>Represents a date and time value.</td></tr>
     <tr><td>Duration</td><td>A string which represents a duration of time (e.g. P1Y1M10D, P10D, -P0Y1M10D2H15M30S etc)</td></tr>
     <tr><td>IP</td><td>A string which represents an IPv4 address (e.g. 127.0.0.1)</td></tr>
     </tbody>
     </table>
     </p>
     <h6><a name="custom">Use custom validator</a></h6>
     Value validation may be performed by custom validator which is being registered as follows:
     <pre class="prettyprint"><code>
     {
        "name": "price",
        "title": "Price",
        "description": "The price of the product.",
        "type": "Number",
        "nullable":false,
        "validation": {
          "validator":"./validators/price-validator"
        }
    }
     </code></pre>
     <p>where price-validator is a module which exports a createInstance() method
     that returns an instance of a class which inherits DataValidator class.</p>
     <pre class="prettyprint"><code>
     //# ./validators/price-validator
     var util = require("util"),
     most = require("most-data");

     function PriceValidator(attr) {
    this.attr = attr;
    PriceValidator.super_.call(this);
}
     LangUtils.inherits(PriceValidator, most.validators.DataValidator);
     PriceValidator.prototype.validateSync = function(val) {
    if (typeof val === 'number') {
        if (val<=0) {
            return {
                code:"EPRICE",
                "message":"A valid price must be always greater than zero."
            };
        }
    }
    else {
        return {
            code:"EPRICE",
            "message":"A valid price must be always a number greater than zero."
        };
    }
};
     exports.createInstance = function() {
    return new PriceValidator();
};
     </code></pre>
     <p>An operation tries to save a data object:</p>
     <pre class="prettyprint"><code>
     var obj = {
        "price":-10.75,
        "model": "FS2USB3",
        "name": "USB 3.0 Adapter"
    };
     context.model("Product").save(obj).then(function() {
       return done();
   }).catch(function(err) {
       return done(err);
   });
     </code></pre>
     <p>and the result is:</p>
     <pre class="prettyprint"><code>
     {
        "code": "EPRICE",
        "model": "Product",
        "field": "price",
        "message": "A valid price must be always greater than zero."
    }
     </code></pre>
     <p>A custom validator may use async validate(val,callback) method:</p>
     <pre class="prettyprint"><code>
     PriceValidator.prototype.validate = function(val, callback) {
    this.getContext().model("Product")
    .where("price").lowerThan(val).count()
    .then(function(result) {
        if (result<=5) {
            return callback(null, {
                code:"EPRICE",
                "message":sprintf.sprintf("You have already 5 products with price lower than %s.", val)
            });
        }
        return callback();
    }).catch(function(err) {
        return callback(err);
    });
};
     </code></pre>
     <p>and the result may be:</p>
     <pre class="prettyprint"><code>
     {
        "code": "EPRICE",
        "model": "Product",
        "field": "price",
        "message": "You have already 5 products with price lower than 10."
    }
     </code></pre>
     </p>
     * @constructor
     */
    function DataValidatorListener() {
        //
    }

    /**
     * Occurs before creating or updating a data object.
     * @param {DataEventArgs|*} event - An object that represents the event arguments passed to this operation.
     * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occurred.
     */
    DataValidatorListener.prototype.beforeSave = function(event, callback) {
        if (event.state === 4) { return callback(); }
        if (event.state === 1) {
            return event.model.validateForInsert(event.target).then(function() {
                return callback();
            }).catch(function(err) {
                return callback(err);
            });
        }
        else if  (event.state === 2) {
            return event.model.validateForUpdate(event.target).then(function() {
                return callback();
            }).catch(function(err) {
                return callback(err);
            });
        }
        else {
            return callback();
        }
    };

    /**
     * @class
     * @augments most-data/data-validator~DataValidator
     * @constructor
     * @classdesc Validates a required attribute
     <p>RequiredValidator is used by <a href="DataValidatorListener.html">DataValidatorListener</a> for validating data objects.</p>
     <p>
     An attribute of a data model may be defined as required:
     <pre class="prettyprint"><code>
     {
        "name": "price",
        "title": "Price",
        "description": "The price of the product.",
        "type": "Number",
        "nullable": false
    }
     </code></pre>
     <p>An operation tries to save a data object without price:</p>
     <pre class="prettyprint"><code>
     var obj = {
                "model": "FS2USB42",
                "name": "USB 3.0 Adapter"
            };
     context.model("Product").save(obj).then(function() {
               return done();
           }).catch(function(err) {
               return done(err);
           });
     </code></pre>
     </p>
     <p>and the result is:</p>
     <pre class="prettyprint"><code>
     {
        "code": "EREQUIRED",
        "model": "Product",
        "field": "price",
        "message": "A value is required."
    }
     </code></pre>
     */
    function RequiredValidator() {
        RequiredValidator.super_.call(this);
    }
    LangUtils.inherits(RequiredValidator, DataValidator);
    /**
     * Validates the given value. If validation fails, the operation will return a validation result.
     * @param {*} val
     * @returns {{code: string, maxLength: number, message:string, innerMessage: string}|undefined|*}
     */
    RequiredValidator.prototype.validateSync = function(val) {
        var invalid = false;
        if (_.isNil(val)) {
            invalid=true;
        }
        else if ((typeof val === 'number') && isNaN(val)) {
            invalid=true;
        }
        if (invalid) {

            var innerMessage = null, message = "A value is required.";
            if (this.getContext() && (typeof this.getContext().translate === 'function')) {
                innerMessage = message;
                message = this.getContext().translate("A value is required.");
            }

            return {
                code:"EREQUIRED",
                message:message,
                innerMessage:innerMessage
            }

        }
    };

    validators.PatternValidator = PatternValidator;
    validators.DataValidator = DataValidator;
    validators.MaxValueValidator = MaxValueValidator;
    validators.MinValueValidator = MinValueValidator;
    validators.MaxLengthValidator = MaxLengthValidator;
    validators.MinLengthValidator = MinLengthValidator;
    validators.RangeValidator = RangeValidator;
    validators.RequiredValidator = RequiredValidator;
    validators.DataTypeValidator = DataTypeValidator;
    validators.DataValidatorListener = DataValidatorListener;


    module.exports = validators;



