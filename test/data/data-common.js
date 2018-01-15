'use strict';

require('source-map-support/register');

var _path = require('path');

var path = _interopRequireDefault(_path).default;

var _chai = require('chai');

var assert = _chai.assert;

var _dataConfiguration = require('../../modules/@themost/data/data-configuration');

var DataConfiguration = _dataConfiguration.DataConfiguration;

var _dataContext = require('../../modules/@themost/data/data-context');

var DefaultDataContext = _dataContext.DefaultDataContext;

var _utils = require('../../modules/@themost/common/utils');

var TraceUtils = _utils.TraceUtils;

var _xmlFormatter = require('xml-formatter');

var format = _interopRequireDefault(_xmlFormatter).default;

var _odata = require('../../modules/@themost/data/odata');

var ODataConventionModelBuilder = _odata.ODataConventionModelBuilder;
var ODataModelBuilder = _odata.ODataModelBuilder;

var _randoms = require('./randoms');

var Randoms = _interopRequireDefault(_randoms).default;

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
    var config = new DataConfiguration(path.resolve(process.cwd(), "./test/app/config"));
    it('should use query resolver', function (done) {
        //initialize
        var context = new TestDataContext(config);
        context.model('User').where('name').equal('victoria.hartley@example.com').expand('groups').getTypedItem().then(function (user) {
            TraceUtils.log(JSON.stringify(user, null, 2));
            context.finalize(function () {
                return done();
            });
        }).catch(function (err) {
            context.finalize(function () {
                return done(err);
            });
        });
    });

    it('should infer a many-to-many association', function (done) {
        //initialize
        var context = new TestDataContext(config);
        var field = context.model('Person').field('children');
        TraceUtils.log("DataField");
        TraceUtils.log(JSON.stringify(field, null, 2));
        var mapping = context.model('Person').inferMapping('children');
        TraceUtils.log("DataAssociationMapping");
        TraceUtils.log(JSON.stringify(mapping, null, 2));
        assert.equal(mapping.associationType, 'junction');
        return done();
    });

    it('should infer a one-to-many association', function (done) {
        //initialize
        var context = new TestDataContext(config);
        var field = context.model('PaymentMethod').field('orders');
        TraceUtils.log("DataField");
        TraceUtils.log(JSON.stringify(field, null, 2));
        var mapping = context.model('PaymentMethod').inferMapping('orders');
        TraceUtils.log("DataAssociationMapping");
        TraceUtils.log(JSON.stringify(mapping, null, 2));
        assert.equal(mapping.associationType, 'association');
        return done();
    });

    it('should infer a many-to-one association', function (done) {
        //initialize
        var context = new TestDataContext(config);
        var field = context.model('Order').field('paymentMethod');
        TraceUtils.log("DataField");
        TraceUtils.log(JSON.stringify(field, null, 2));
        var mapping = context.model('Order').inferMapping('paymentMethod');
        TraceUtils.log("DataAssociationMapping");
        TraceUtils.log(JSON.stringify(mapping, null, 2));
        assert.equal(mapping.associationType, 'association');
        return done();
    });

    it('should infer a one-to-one association', function (done) {
        //initialize
        var context = new TestDataContext(config);
        var field = context.model('Person').field('spouse');
        TraceUtils.log("DataField");
        TraceUtils.log(JSON.stringify(field, null, 2));
        var mapping = context.model('Person').inferMapping('spouse');
        TraceUtils.log("DataAssociationMapping");
        TraceUtils.log(JSON.stringify(mapping, null, 2));
        assert.equal(mapping.associationType, 'association');
        return done();
    });

    it('should infer a many-to-many association #2', function (done) {
        //initialize
        var context = new TestDataContext(config);
        var field = context.model('Person').field('children');
        TraceUtils.log("DataField");
        TraceUtils.log(JSON.stringify(field, null, 2));
        var mapping = context.model('Person').inferMapping('children');
        TraceUtils.log("DataAssociationMapping");
        TraceUtils.log(JSON.stringify(mapping, null, 2));
        assert.equal(mapping.associationType, 'junction');
        return done();
    });

    it('should use infer a many-to-many mapping', function (done) {
        //initialize
        var context = new TestDataContext(config);
        var mapping = context.model('Person').inferMapping('children');
        TraceUtils.log(JSON.stringify(mapping, null, 2));
        assert.equal(mapping.associationType, 'junction');
        return done();
    });

    it.only('should use DataModel.save() and DataModel.remove() methods', function (done) {
        //initialize
        var context = new TestDataContext(config);
        var newPerson = Randoms.person();
        TraceUtils.log("New Person Data");
        TraceUtils.log(JSON.stringify(newPerson, null, 2));
        context.model('Person').silent().save(newPerson).then(function () {
            var id = newPerson.id;
            assert.isNumber(id, "Object identifier must be a number");
            TraceUtils.log(JSON.stringify(newPerson, null, 2));
            return context.model('Person').silent().remove(newPerson).then(function () {
                //try to find person again
                return context.model('Person').silent().where('id').equal(id).count().then(function (exists) {
                    assert.equal(exists, 0, 'The object must have been deleted');
                    context.finalize(function () {
                        return done();
                    });
                });
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
            TraceUtils.log(JSON.stringify(edm, null, 4));
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
                TraceUtils.log(format(doc.outerXML()));
                return done();
            });
        }).catch(function (err) {
            return done(err);
        });
    });
});
//# sourceMappingURL=data-common.js.map
