'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = undefined;

var _dec, _class;

var _service = require('../../../modules/@themost/web/controllers/service');

var HttpServiceController = _interopRequireDefault(_service).default;

var _decorators = require('../../../modules/@themost/web/decorators');

var httpController = _decorators.httpController;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ServiceController = (_dec = httpController(), _dec(_class = function (_HttpServiceControlle) {
    _inherits(ServiceController, _HttpServiceControlle);

    function ServiceController(context) {
        _classCallCheck(this, ServiceController);

        return _possibleConstructorReturn(this, (ServiceController.__proto__ || Object.getPrototypeOf(ServiceController)).call(this, context));
    }

    return ServiceController;
}(HttpServiceController)) || _class);
exports.default = ServiceController;
module.exports = exports['default'];
//# sourceMappingURL=service-controller.js.map
