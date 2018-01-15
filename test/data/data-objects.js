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

var _dataObject = require('../../modules/@themost/data/data-object');

var DataObject = _dataObject.DataObject;

var _personModel = require('../app/models/person-model');

var PersonModel = _interopRequireDefault(_personModel).default;

var _utils = require('../../modules/@themost/common/utils');

var TraceUtils = _utils.TraceUtils;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @augments DataContext
 * @extends DefaultDataContext
 */
var TestDataContext = function (_DefaultDataContext) {
    _inherits(TestDataContext, _DefaultDataContext);

    /**
     * @param {DataConfiguration=} configuration
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

describe('data object test', function () {

    /**
     * @type TestDataContext
     */
    var context = void 0;

    before(function (done) {
        var config = new DataConfiguration(path.resolve(process.cwd(), "./test/app/config"));
        context = new TestDataContext(config);
        return done();
    });

    after(function (done) {
        if (context) {
            return context.finalize(function () {
                return done();
            });
        }
        return done();
    });

    it('should get typed data object', function (done) {
        context.model('Person').where('email').equal('crystal.wright@example.com').silent().getTypedItem().then(function (person) {
            assert.isTrue(person instanceof PersonModel, 'Expected PersonModel instance');
            return done();
        }).catch(function (err) {
            return done(err);
        });
    });

    it('should call typed data object method', function (done) {
        context.model('Person').where('email').equal('crystal.wright@example.com').silent().getTypedItem().then(function (person) {
            return person.getPendingOrders().getItems().then(function (result) {
                TraceUtils.log(JSON.stringify(result, null, 4));
                result.forEach(function (x) {
                    assert.equal(x.orderStatus.alternateName, 'OrderProcessing', 'Invalid query.');
                });
                return done();
            });
        }).catch(function (err) {
            return done(err);
        });
    });

    it.only('should save typed data object', function (done) {

        context.model('Person').where('email').equal('crystal.wright@example.com').silent().getTypedItem().then(function (person) {
            TraceUtils.log(JSON.stringify(person, null, 4));
            person.jobTitle = "General Engineer";
            return person.silent().save().then(function () {
                return done();
            });
        }).catch(function (err) {
            return done(err);
        });
    });

    it('should get data object', function (done) {
        context.model('User').where('name').equal('crystal.wright@example.com').silent().getTypedItem().then(function (user) {
            assert.isTrue(user instanceof DataObject, 'Expected DataObject instance');
            return done();
        }).catch(function (err) {
            return done(err);
        });
    });
});
//# sourceMappingURL=data-objects.js.map
