'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RequiredValidator = exports.DataValidatorListener = exports.DataTypeValidator = exports.RangeValidator = exports.MaxValueValidator = exports.MinValueValidator = exports.MaxLengthValidator = exports.MinLengthValidator = exports.PatternValidator = exports.DataValidator = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _ = _lodash._;

var _sprintf = require('sprintf');

var sprintf = _interopRequireDefault(_sprintf).default;

var _config = require('./config');

var DataConfiguration = _config.DataConfiguration;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * @license
                                                                                                                                                           * MOST Web Framework 2.0 Codename Blueshift
                                                                                                                                                           * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
                                                                                                                                                           *                     Anthi Oikonomou anthioikonomou@gmail.com
                                                                                                                                                           *
                                                                                                                                                           * Use of this source code is governed by an BSD-3-Clause license that can be
                                                                                                                                                           * found in the LICENSE file at https://themost.io/license
                                                                                                                                                           */


/**
 * @class
 * @property {*} target - Gets or sets the target data object
 * @constructor
 */
var DataValidator = exports.DataValidator = function DataValidator() {
    _classCallCheck(this, DataValidator);

    var context_ = void 0;
    /**
     * Sets the current data context.
     * @param {DataContext|*} context
     */
    this.setContext = function (context) {
        context_ = context;
    };
    /**
     * Gets the current data context, if any.
     * @returns {DataContext|*}
     */
    this.getContext = function () {
        return context_;
    };
};

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
 * @property {string} message - Gets or sets a string which represents a custom validator message.
 * @augments DataValidator
 * @classdesc
 * Validates a variable against the regular expression provided
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

var PatternValidator = exports.PatternValidator = function (_DataValidator) {
    _inherits(PatternValidator, _DataValidator);

    /**
     * @constructor
     * @param {string} pattern - A string which represents a regular expression
     */
    function PatternValidator(pattern) {
        _classCallCheck(this, PatternValidator);

        var _this = _possibleConstructorReturn(this, (PatternValidator.__proto__ || Object.getPrototypeOf(PatternValidator)).call(this));

        _this.pattern = pattern;
        PatternValidator.super_.call(_this);
        return _this;
    }

    /**
     * Validates the given value and returns a validation result or undefined if the specified value is invalid
     * @param val
     * @returns {{code: string, message: string, innerMessage: *}|undefined}
     */


    _createClass(PatternValidator, [{
        key: 'validateSync',
        value: function validateSync(val) {
            if (_.isNil(val)) {
                return;
            }
            var valueTo = val;
            if (val instanceof Date) {
                var year = val.getFullYear();
                var month = zeroPad_(val.getMonth() + 1, 2);
                var day = zeroPad_(val.getDate(), 2);
                var hour = zeroPad_(val.getHours(), 2);
                var minute = zeroPad_(val.getMinutes(), 2);
                var second = zeroPad_(val.getSeconds(), 2);
                var millisecond = zeroPad_(val.getMilliseconds(), 3);
                //format timezone
                var offset = new Date().getTimezoneOffset(),
                    timezone = (offset >= 0 ? '+' : '') + zeroPad_(Math.floor(offset / 60), 2) + ':' + zeroPad_(offset % 60, 2);
                valueTo = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + '.' + millisecond + timezone;
            }
            var re = new RegExp(this.pattern, "ig");
            if (!re.test(valueTo)) {

                var innerMessage = null,
                    message = this.message || PatternValidator.DefaultMessage;
                if (this.getContext() && typeof this.getContext().translate === 'function') {
                    innerMessage = message;
                    message = this.getContext().translate(this.message || PatternValidator.DefaultMessage);
                }

                return {
                    code: "EPATTERN",
                    "message": message,
                    "innerMessage": innerMessage
                };
            }
        }
    }]);

    return PatternValidator;
}(DataValidator);

PatternValidator.DefaultMessage = "The value seems to be invalid.";

/**
 * @class
 * @property {number} minLength - Gets or sets an integer which represents the minimum length.
 * @property {string} message - Gets or sets a string which represents a custom validator message.
 * @augments {DataValidator}
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

var MinLengthValidator = exports.MinLengthValidator = function (_DataValidator2) {
    _inherits(MinLengthValidator, _DataValidator2);

    /**
     * @constructor
     * @param {number} length - A number which represents the minimum length
     */
    function MinLengthValidator(length) {
        _classCallCheck(this, MinLengthValidator);

        var _this2 = _possibleConstructorReturn(this, (MinLengthValidator.__proto__ || Object.getPrototypeOf(MinLengthValidator)).call(this));

        _this2.minLength = length;
        MinLengthValidator.super_.call(_this2);
        return _this2;
    }

    /**
     * Validates the given value. If validation fails, the operation will return a validation result.
     * @param {*} val
     * @returns {{code: string, minLength: number, message:string, innerMessage: string}|undefined}
     */


    _createClass(MinLengthValidator, [{
        key: 'validateSync',
        value: function validateSync(val) {
            if (_.isNil(val)) {
                return;
            }
            if (val.hasOwnProperty('length')) {
                if (val.length < this.minLength) {

                    var innerMessage = null,
                        message = sprintf.sprintf(this.message || MinLengthValidator.DefaultMessage, this.minLength);
                    if (this.getContext() && typeof this.getContext().translate === 'function') {
                        innerMessage = message;
                        message = sprintf.sprintf(this.getContext().translate(this.message || MinLengthValidator.DefaultMessage), this.minLength);
                    }

                    return {
                        code: "EMINLEN",
                        minLength: this.minLength,
                        message: message,
                        innerMessage: innerMessage
                    };
                }
            }
        }
    }]);

    return MinLengthValidator;
}(DataValidator);

MinLengthValidator.DefaultMessage = "The value is too short. It should have %s characters or more.";

/**
 * @class
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

var MaxLengthValidator = exports.MaxLengthValidator = function (_DataValidator3) {
    _inherits(MaxLengthValidator, _DataValidator3);

    /**
     * @constructor
     * @param {number} length - A number which represents the maximum length
     */
    function MaxLengthValidator(length) {
        _classCallCheck(this, MaxLengthValidator);

        var _this3 = _possibleConstructorReturn(this, (MaxLengthValidator.__proto__ || Object.getPrototypeOf(MaxLengthValidator)).call(this));

        _this3.maxLength = length;
        MaxLengthValidator.super_.call(_this3);
        return _this3;
    }

    /**
     * Validates the given value. If validation fails, the operation will return a validation result.
     * @param {*} val
     * @returns {{code: string, maxLength: number, message:string, innerMessage: string}|undefined|*}
     */


    _createClass(MaxLengthValidator, [{
        key: 'validateSync',
        value: function validateSync(val) {
            if (_.isNil(val)) {
                return;
            }

            var innerMessage = null,
                message = sprintf.sprintf(this.message || MaxLengthValidator.DefaultMessage, this.maxLength);
            if (this.getContext() && typeof this.getContext().translate === 'function') {
                innerMessage = message;
                message = sprintf.sprintf(this.getContext().translate(this.message || MaxLengthValidator.DefaultMessage), this.maxLength);
            }

            if (val.hasOwnProperty('length')) {
                if (val.length > this.maxLength) {
                    return {
                        code: "EMAXLEN",
                        maxLength: this.maxLength,
                        message: message,
                        innerMessage: innerMessage
                    };
                }
            }
        }
    }]);

    return MaxLengthValidator;
}(DataValidator);

MaxLengthValidator.DefaultMessage = "The value is too long. It should have %s characters or fewer.";

/**
 * @class
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

var MinValueValidator = exports.MinValueValidator = function (_DataValidator4) {
    _inherits(MinValueValidator, _DataValidator4);

    /**
     * @constructor
     * @param {number|Date|*} min - A value which represents the minimum value
     */
    function MinValueValidator(min) {
        _classCallCheck(this, MinValueValidator);

        var _this4 = _possibleConstructorReturn(this, (MinValueValidator.__proto__ || Object.getPrototypeOf(MinValueValidator)).call(this));

        _this4.minValue = min;
        MinValueValidator.super_.call(_this4);
        return _this4;
    }

    /**
     * Validates the given value. If validation fails, the operation will return a validation result.
     * @param {*} val
     * @returns {{code: string, maxLength: number, message:string, innerMessage: string}|undefined|*}
     */


    _createClass(MinValueValidator, [{
        key: 'validateSync',
        value: function validateSync(val) {
            if (_.isNil(val)) {
                return;
            }
            if (val < this.minValue) {

                var innerMessage = null,
                    message = sprintf.sprintf(this.message || MinValueValidator.DefaultMessage, this.minValue);
                if (this.getContext() && typeof this.getContext().translate === 'function') {
                    innerMessage = message;
                    message = sprintf.sprintf(this.getContext().translate(this.message || MinValueValidator.DefaultMessage), this.minValue);
                }

                return {
                    code: "EMINVAL",
                    minValue: this.minValue,
                    message: message,
                    innerMessage: innerMessage
                };
            }
        }
    }]);

    return MinValueValidator;
}(DataValidator);

MinValueValidator.DefaultMessage = "The value should be greater than or equal to %s.";

/**
 * @class
 * @augments {DataValidator}
 * @property {*} maxValue - Gets or sets a value which represents the maximum value.
 * @property {string} message - Gets or sets a string which represents a custom validator message.
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

var MaxValueValidator = exports.MaxValueValidator = function (_DataValidator5) {
    _inherits(MaxValueValidator, _DataValidator5);

    /**
     * @constructor
     * @param {number|Date|*} max - A value which represents the maximum value
     */
    function MaxValueValidator(max) {
        _classCallCheck(this, MaxValueValidator);

        var _this5 = _possibleConstructorReturn(this, (MaxValueValidator.__proto__ || Object.getPrototypeOf(MaxValueValidator)).call(this));

        _this5.maxValue = max;
        MaxValueValidator.super_.call(_this5);
        return _this5;
    }

    /**
     * Validates the given value. If validation fails, the operation will return a validation result.
     * @param {*} val
     * @returns {{code: string, maxLength: number, message:string, innerMessage: string}|undefined|*}
     */


    _createClass(MaxValueValidator, [{
        key: 'validateSync',
        value: function validateSync(val) {
            if (_.isNil(val)) {
                return;
            }
            if (val > this.maxValue) {

                var innerMessage = null,
                    message = sprintf.sprintf(this.message || MaxValueValidator.DefaultMessage, this.maxValue);
                if (this.getContext() && typeof this.getContext().translate === 'function') {
                    innerMessage = message;
                    message = sprintf.sprintf(this.getContext().translate(this.message || MaxValueValidator.DefaultMessage), this.maxValue);
                }

                return {
                    code: "EMAXVAL",
                    maxValue: this.maxValue,
                    message: message,
                    innerMessage: innerMessage
                };
            }
        }
    }]);

    return MaxValueValidator;
}(DataValidator);

MaxValueValidator.DefaultMessage = "The value should be lower or equal to %s.";

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

var RangeValidator = exports.RangeValidator = function (_DataValidator6) {
    _inherits(RangeValidator, _DataValidator6);

    /**
     * @constructor
     * @param {number|Date|*} min - A value which represents the minimum value
     * @param {number|Date|*} max - A value which represents the maximum value
     */
    function RangeValidator(min, max) {
        _classCallCheck(this, RangeValidator);

        var _this6 = _possibleConstructorReturn(this, (RangeValidator.__proto__ || Object.getPrototypeOf(RangeValidator)).call(this));

        _this6.minValue = min;
        _this6.maxValue = max;
        RangeValidator.super_.call(_this6);
        return _this6;
    }

    /**
     * Validates the given value. If validation fails, the operation will return a validation result.
     * @param {*} val
     * @returns {{code: string, maxLength: number, message:string, innerMessage: string}|undefined|*}
     */


    _createClass(RangeValidator, [{
        key: 'validateSync',
        value: function validateSync(val) {
            if (_.isNil(val)) {
                return;
            }
            var minValidator = void 0,
                maxValidator = void 0,
                minValidation = void 0,
                maxValidation = void 0;
            if (typeof this.minValue !== 'undefined' && this.minValue != null) {
                minValidator = new MinValueValidator(this.minValue);
                minValidation = minValidator.validateSync(val);
            }
            if (typeof this.maxValue !== 'undefined' && this.maxValue != null) {
                maxValidator = new MaxValueValidator(this.maxValue);
                maxValidation = maxValidator.validateSync(val);
            }
            if (minValidator && maxValidator && (minValidation || maxValidation)) {
                var innerMessage = null,
                    message = sprintf.sprintf(this.message || RangeValidator.DefaultMessage, this.minValue, this.maxValue);
                if (this.getContext() && typeof this.getContext().translate === 'function') {
                    innerMessage = message;
                    message = sprintf.sprintf(this.getContext().translate(this.message || RangeValidator.DefaultMessage), this.minValue, this.maxValue);
                }
                return {
                    code: "ERANGE",
                    maxValue: this.maxValue,
                    message: message,
                    innerMessage: innerMessage
                };
            } else if (minValidation) {
                return minValidation;
            } else if (maxValidation) {
                return maxValidation;
            }
        }
    }]);

    return RangeValidator;
}(DataValidator);

RangeValidator.DefaultMessage = "The value should be between %s to %s.";

/**
 * @class
 * @property {*} dataType - Gets or sets the data type which is going to be used for data validation
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

var DataTypeValidator = exports.DataTypeValidator = function (_DataValidator7) {
    _inherits(DataTypeValidator, _DataValidator7);

    /**
     * @constructor
     * @param {string|*} type - The data type which is going to be used for data validation
     */
    function DataTypeValidator(type) {
        _classCallCheck(this, DataTypeValidator);

        var _this7 = _possibleConstructorReturn(this, (DataTypeValidator.__proto__ || Object.getPrototypeOf(DataTypeValidator)).call(this));

        if (typeof type === 'string') _this7.dataType = DataConfiguration.current.dataTypes[type];else _this7.dataType = type;
        DataTypeValidator.super_.call(_this7);
        return _this7;
    }

    /**
     * @param val
     * @returns {*}
     */


    _createClass(DataTypeValidator, [{
        key: 'validateSync',
        value: function validateSync(val) {
            if (typeof this.dataType === 'undefined') {
                return;
            }
            /**
             * @type {{pattern:string,patternMessage:string,minValue:*,maxValue:*,minLength:number,maxLength:number}}
             */
            var properties = this.dataType.properties;
            if (typeof properties !== 'undefined') {
                var validator = void 0,
                    validationResult = void 0;
                //validate pattern if any
                if (properties.pattern) {
                    validator = new PatternValidator(properties.pattern);
                    validator.setContext(this.getContext());
                    validationResult = validator.validateSync(val);
                    if (validationResult) {
                        if (properties.patternMessage) {

                            validationResult.message = properties.patternMessage;
                            if (this.getContext() && typeof this.getContext().translate === 'function') {
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
                } else if (properties.hasOwnProperty('minValue')) {
                    validator = new MinValueValidator(properties.minValue);
                    validator.setContext(this.getContext());
                    validationResult = validator.validateSync(val);
                    if (validationResult) {
                        return validationResult;
                    }
                } else if (properties.hasOwnProperty('maxValue')) {
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
        }
    }]);

    return DataTypeValidator;
}(DataValidator);

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
 util.inherits(PriceValidator, most.validators.DataValidator);
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


var DataValidatorListener = exports.DataValidatorListener = function () {
    function DataValidatorListener() {
        _classCallCheck(this, DataValidatorListener);
    }

    _createClass(DataValidatorListener, [{
        key: 'beforeSave',

        /**
         * Occurs before creating or updating a data object.
         * @param {DataEventArgs|*} event - An object that represents the event arguments passed to this operation.
         * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occured.
         */
        value: function beforeSave(event, callback) {
            if (event.state === 4) {
                return callback();
            }
            if (event.state === 1) {
                return event.model.validateForInsert(event.target).then(function () {
                    return callback();
                }).catch(function (err) {
                    return callback(err);
                });
            } else if (event.state === 2) {
                return event.model.validateForUpdate(event.target).then(function () {
                    return callback();
                }).catch(function (err) {
                    return callback(err);
                });
            } else {
                return callback();
            }
        }
    }]);

    return DataValidatorListener;
}();

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


var RequiredValidator = exports.RequiredValidator = function (_DataValidator8) {
    _inherits(RequiredValidator, _DataValidator8);

    /**
     * @constructor
     */
    function RequiredValidator() {
        _classCallCheck(this, RequiredValidator);

        var _this8 = _possibleConstructorReturn(this, (RequiredValidator.__proto__ || Object.getPrototypeOf(RequiredValidator)).call(this));

        RequiredValidator.super_.call(_this8);
        return _this8;
    }

    /**
     * Validates the given value. If validation fails, the operation will return a validation result.
     * @param {*} val
     * @returns {{code: string, maxLength: number, message:string, innerMessage: string}|undefined|*}
     */


    _createClass(RequiredValidator, [{
        key: 'validateSync',
        value: function validateSync(val) {
            var invalid = false;
            if (_.isNil(val)) {
                invalid = true;
            } else if (typeof val === 'number' && isNaN(val)) {
                invalid = true;
            }
            if (invalid) {

                var innerMessage = null,
                    message = "A value is required.";
                if (this.getContext() && typeof this.getContext().translate === 'function') {
                    innerMessage = message;
                    message = this.getContext().translate("A value is required.");
                }

                return {
                    code: "EREQUIRED",
                    message: message,
                    innerMessage: innerMessage
                };
            }
        }
    }]);

    return RequiredValidator;
}(DataValidator);
//# sourceMappingURL=validators.js.map
