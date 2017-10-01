'use strict';

require('source-map-support/register');

var _path = require('path');

var path = _interopRequireDefault(_path).default;

var _config = require('../../modules/@themost/common/config');

var ConfigurationBase = _config.ConfigurationBase;

var _config2 = require('../../modules/@themost/data/config');

var DataConfigurationStrategy = _config2.DataConfigurationStrategy;

var _context = require('../../modules/@themost/data/context');

var DefaultDataContext = _context.DefaultDataContext;

var _utils = require('../../modules/@themost/common/utils');

var TraceUtils = _utils.TraceUtils;

var _mostXml = require('most-xml');

var XDocument = _mostXml.XDocument;

var _lodash = require('lodash');

var _ = _interopRequireDefault(_lodash).default;

var _xmlFormatter = require('xml-formatter');

var format = _interopRequireDefault(_xmlFormatter).default;

var _odata = require('../../modules/@themost/data/odata');

var ODataConventionModelBuilder = _odata.ODataConventionModelBuilder;
var ODataModelBuilder = _odata.ODataModelBuilder;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TestDataContext = function (_DefaultDataContext) {
    _inherits(TestDataContext, _DefaultDataContext);

    /**
     * @param {DataConfigurationStrategy=} configuration
     */
    function TestDataContext(configuration) {
        _classCallCheck(this, TestDataContext);

        var _this = _possibleConstructorReturn(this, (TestDataContext.__proto__ || Object.getPrototypeOf(TestDataContext)).call(this));

        _this.getConfiguration = function () {
            return configuration;
        };
        return _this;
    }

    return TestDataContext;
}(DefaultDataContext);

describe('most data common tests', function () {
    var config = new ConfigurationBase(path.resolve(process.cwd(), "./test/app/config"));
    config.useStrategy(DataConfigurationStrategy, DataConfigurationStrategy);
    it('should use query resolver', function (done) {
        //initialize
        var context = new TestDataContext(config.getStrategy(DataConfigurationStrategy));
        context.model('User').where('name').equal('victoria.hartley@example.com').expand('groups').getTypedItem().then(function (user) {
            TraceUtils.log(user);
            context.finalize(function () {
                return done();
            });
        }).catch(function (err) {
            context.finalize(function () {
                return done(err);
            });
        });
    });

    it('should use OData model builder', function (done) {
        config.useStrategy(ODataModelBuilder, ODataConventionModelBuilder);
        /**
         * @type {ODataConventionModelBuilder|*}
         */
        var builder = config.getStrategy(ODataModelBuilder);
        builder.addEntity("User");
        builder.getEdm().then(function (edm) {
            console.log(JSON.stringify(edm, null, 4));
            return done();
        }).catch(function (err) {
            return done(err);
        });
    });

    it('should export metadata', function (done) {
        config.useStrategy(ODataModelBuilder, ODataConventionModelBuilder);
        /**
         * @type {ODataConventionModelBuilder|*}
         */
        var builder = config.getStrategy(ODataModelBuilder);

        builder.initialize().then(function () {
            return builder.getEdmDocument().then(function (doc) {
                console.log(format(doc.outerXML()));
                return done();
            });
        }).catch(function (err) {
            return done(err);
        });
    });
});