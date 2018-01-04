'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _dec, _dec2, _dec3, _dec4, _dec5, _class, _desc, _value, _class2; /**
                                                                       * @license
                                                                       * MOST Web Framework 2.0 Codename Blueshift
                                                                       * Copyright (c) 2017, THEMOST LP All rights reserved
                                                                       *
                                                                       * Use of this source code is governed by an BSD-3-Clause license that can be
                                                                       * found in the LICENSE file at https://themost.io/license
                                                                       */


var _q = require('q');

var Q = _interopRequireDefault(_q).default;

var _lodash = require('lodash');

var _ = _interopRequireDefault(_lodash).default;

var _data = require('../../../modules/@themost/web/controllers/data');

var HttpDataController = _interopRequireDefault(_data).default;

var _decorators = require('../../../modules/@themost/web/decorators');

var httpAction = _decorators.httpAction;
var httpGet = _decorators.httpGet;
var httpController = _decorators.httpController;

var _url = require('url');

var url = _interopRequireDefault(_url).default;

var _utils = require('../../../modules/@themost/common/utils');

var LangUtils = _utils.LangUtils;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
    var desc = {};
    Object['ke' + 'ys'](descriptor).forEach(function (key) {
        desc[key] = descriptor[key];
    });
    desc.enumerable = !!desc.enumerable;
    desc.configurable = !!desc.configurable;

    if ('value' in desc || desc.initializer) {
        desc.writable = true;
    }

    desc = decorators.slice().reverse().reduce(function (desc, decorator) {
        return decorator(target, property, desc) || desc;
    }, desc);

    if (context && desc.initializer !== void 0) {
        desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
        desc.initializer = undefined;
    }

    if (desc.initializer === void 0) {
        Object['define' + 'Property'](target, property, desc);
        desc = null;
    }

    return desc;
}

var OrderController = (_dec = httpController(), _dec2 = httpGet(), _dec3 = httpAction('index'), _dec4 = httpGet(), _dec5 = httpAction('edit'), _dec(_class = (_class2 = function (_HttpDataController) {
    _inherits(OrderController, _HttpDataController);

    function OrderController(context) {
        _classCallCheck(this, OrderController);

        return _possibleConstructorReturn(this, (OrderController.__proto__ || Object.getPrototypeOf(OrderController)).call(this, context));
    }

    _createClass(OrderController, [{
        key: 'getNextLink',
        value: function getNextLink(result) {
            if (result.hasOwnProperty("total")) {
                var urlObject = url.parse(this.context.request.url, true);
                //get next link
                var $skip = LangUtils.parseInt(urlObject.query.$skip);
                var $top = LangUtils.parseInt(urlObject.query.$top) || 25;
                if (result.total >= $skip + $top) {
                    urlObject.query.$skip = $skip + $top;
                    urlObject.query.$top = $top;
                    urlObject.query.$count = true;
                    delete urlObject.search;
                    return url.format(urlObject);
                }
            }
        }
    }, {
        key: 'getPrevLink',
        value: function getPrevLink(result) {
            if (result.hasOwnProperty("total")) {
                var urlObject = url.parse(this.context.request.url, true);
                //get next link
                var $skip = LangUtils.parseInt(urlObject.query.$skip);
                var $top = LangUtils.parseInt(urlObject.query.$top) || 25;
                if ($skip - $top >= 0) {
                    urlObject.query.$skip = $skip - $top;
                    urlObject.query.$top = $top;
                    urlObject.query.$count = true;
                    delete urlObject.search;
                    return url.format(urlObject);
                }
            }
        }
    }, {
        key: 'mapResult',
        value: function mapResult(result) {
            _.assign({
                total: result.total,
                skip: result.skip,
                nextLink: this.getNextLink(result),
                prevLink: this.getPrevLink(result)
            }, {
                value: result.value
            });
        }
    }, {
        key: 'getItems',
        value: function getItems() {
            return Q.nbind(_get(OrderController.prototype.__proto__ || Object.getPrototypeOf(OrderController.prototype), 'index', this), this)();
        }
    }, {
        key: 'getEdit',
        value: function getEdit(id) {
            return this.model.where('id').equal(id).getItem();
        }
    }]);

    return OrderController;
}(HttpDataController), (_applyDecoratedDescriptor(_class2.prototype, 'getItems', [_dec2, _dec3], Object.getOwnPropertyDescriptor(_class2.prototype, 'getItems'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'getEdit', [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, 'getEdit'), _class2.prototype)), _class2)) || _class);
exports.default = OrderController;
module.exports = exports['default'];
//# sourceMappingURL=order-controller.js.map
