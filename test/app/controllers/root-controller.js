'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dec, _dec2, _dec3, _dec4, _class, _desc, _value, _class2; /**
                                                                * @license
                                                                * MOST Web Framework 2.0 Codename Blueshift
                                                                * Copyright (c) 2017, THEMOST LP All rights reserved
                                                                *
                                                                * Use of this source code is governed by an BSD-3-Clause license that can be
                                                                * found in the LICENSE file at https://themost.io/license
                                                                */


var _q = require('q');

var Q = _interopRequireDefault(_q).default;

var _mvc = require('../../../modules/@themost/web/mvc');

var HttpController = _mvc.HttpController;

var _decorators = require('../../../modules/@themost/web/decorators');

var httpAction = _decorators.httpAction;
var httpGet = _decorators.httpGet;
var httpParam = _decorators.httpParam;
var httpController = _decorators.httpController;

var _consumers = require('../../../modules/@themost/web/consumers');

var HttpConsumer = _consumers.HttpConsumer;

var _errors = require('../../../modules/@themost/common/errors');

var HttpError = _errors.HttpError;

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

function httpNotImplemented() {
    return function (target, key, descriptor) {
        descriptor.value.notImplemented = new HttpConsumer(function () {
            return Q.reject(new HttpError(501));
        });
        return descriptor;
    };
}

/**
 * @class
 * @augments HttpController
 */
var RootController = (_dec = httpController(), _dec2 = httpGet(), _dec3 = httpGet(), _dec4 = httpGet(), _dec(_class = (_class2 = function (_HttpController) {
    _inherits(RootController, _HttpController);

    function RootController() {
        _classCallCheck(this, RootController);

        return _possibleConstructorReturn(this, (RootController.__proto__ || Object.getPrototypeOf(RootController)).call(this));
    }

    _createClass(RootController, [{
        key: 'index',
        value: function index() {
            return Q({
                title: "MOST Web Framework Codename Blueshift v2"
            });
        }
    }, {
        key: 'app',
        value: function app() {
            return Q();
        }
    }, {
        key: 'message',
        value: function message() {
            return Q();
        }
    }]);

    return RootController;
}(HttpController), (_applyDecoratedDescriptor(_class2.prototype, 'index', [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, 'index'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'app', [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, 'app'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'message', [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, 'message'), _class2.prototype)), _class2)) || _class);

//noinspection JSUnusedGlobalSymbols

exports.default = RootController;
module.exports = exports['default'];
//# sourceMappingURL=root-controller.js.map
