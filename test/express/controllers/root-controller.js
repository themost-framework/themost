'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dec, _dec2, _dec3, _dec4, _dec5, _class, _desc, _value, _class2;

var _mvc = require('../../../modules/@themost/web/mvc');

var HttpController = _mvc.HttpController;

var _decorators = require('./../../../modules/@themost/web/decorators');

var httpAction = _decorators.httpAction;
var httpGet = _decorators.httpGet;
var httpController = _decorators.httpController;

var _q = require('q');

var Q = _interopRequireDefault(_q).default;

require('source-map-support/register');

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

var RootController = (_dec = httpController(), _dec2 = httpGet(), _dec3 = httpAction("index"), _dec4 = httpGet(), _dec5 = httpAction("person"), _dec(_class = (_class2 = function (_HttpController) {
    _inherits(RootController, _HttpController);

    function RootController() {
        _classCallCheck(this, RootController);

        return _possibleConstructorReturn(this, (RootController.__proto__ || Object.getPrototypeOf(RootController)).call(this));
    }

    _createClass(RootController, [{
        key: 'index',
        value: function index() {
            return Q(this.content('<p>Hello World</p>'));
        }
    }, {
        key: 'person',
        value: function person() {
            return Q({
                givenName: 'Peter',
                familyName: 'Adams'
            });
        }
    }]);

    return RootController;
}(HttpController), (_applyDecoratedDescriptor(_class2.prototype, 'index', [_dec2, _dec3], Object.getOwnPropertyDescriptor(_class2.prototype, 'index'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'person', [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, 'person'), _class2.prototype)), _class2)) || _class);
exports.default = RootController;
module.exports = exports['default'];
//# sourceMappingURL=root-controller.js.map
