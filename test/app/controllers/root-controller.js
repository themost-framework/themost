
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _class, _desc, _value, _class2;

var _httpMvc = require('@themost/web/http-mvc');

var HttpController = _httpMvc.HttpController;

var _q = require('q');

var Q = _interopRequireDefault(_q).default;

var _decorators = require('@themost/web/decorators');

var httpAction = _decorators.httpAction;
var httpGet = _decorators.httpGet;
var httpController = _decorators.httpController;

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

var RootController = (_dec = httpController(), _dec2 = httpGet(), _dec3 = httpGet(), _dec4 = httpAction('hello'), _dec5 = httpGet(), _dec6 = httpAction('helloMarkdown'), _dec7 = httpGet(), _dec8 = httpAction('helloJade'), _dec9 = httpGet(), _dec10 = httpAction('helloVash'), _dec(_class = (_class2 = function (_HttpController) {
    _inherits(RootController, _HttpController);

    function RootController() {
        _classCallCheck(this, RootController);

        return _possibleConstructorReturn(this, (RootController.__proto__ || Object.getPrototypeOf(RootController)).call(this));
    }

    _createClass(RootController, [{
        key: 'index',
        value: function index() {
            return this.content('Hello World').toPromise();
        }
    }, {
        key: 'getHello',
        value: function getHello() {
            return this.json({
                message: 'Hello World'
            }).toPromise();
        }
    }, {
        key: 'getHelloMarkdown',
        value: function getHelloMarkdown() {
            return this.view().toPromise();
        }
    }, {
        key: 'getHelloJade',
        value: function getHelloJade() {
            return this.view().toPromise();
        }
    }, {
        key: 'getHelloVash',
        value: function getHelloVash() {
            return this.view({ "name": "Peter" }).toPromise();
        }
    }]);

    return RootController;
}(HttpController), (_applyDecoratedDescriptor(_class2.prototype, 'index', [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, 'index'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'getHello', [_dec3, _dec4], Object.getOwnPropertyDescriptor(_class2.prototype, 'getHello'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'getHelloMarkdown', [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, 'getHelloMarkdown'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'getHelloJade', [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, 'getHelloJade'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'getHelloVash', [_dec9, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, 'getHelloVash'), _class2.prototype)), _class2)) || _class);
exports.default = RootController;
module.exports = exports['default'];
//# sourceMappingURL=root-controller.js.map
