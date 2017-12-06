var assert = require("chai").assert;
var HttpError = require('../errors').HttpError;
var DataError = require('../errors').DataError;
var HttpBadRequestError = require('../errors').HttpBadRequestError;
var AccessDeniedError = require('../errors').AccessDeniedError;
var DataNotFoundError = require('../errors').DataNotFoundError;
var AbstractClassError = require('../errors').AbstractClassError;
var AbstractMethodError = require('../errors').AbstractMethodError;
var LangUtils = require('../utils').LangUtils;

describe("test common errors", function () {
    it("should use new HttpError", function () {

        var err = new HttpError(500);
        assert.isOk(err instanceof Error, "Expected HttpError");
        assert.isOk(err instanceof HttpError, "Expected HttpError");
        assert.equal(err.statusCode, 500, "Expected Error 500");
    });

    it("should use new DataError", function () {

        var err = new DataError("EMSG", "A data error occured");
        assert.isOk(err instanceof Error, "Expected Error");
        assert.isOk(err instanceof DataError, "Expected DataError");
        assert.equal(err.code, "EMSG", "Expected EMSG code");
    });

    it("should use new HttpBadRequestError", function () {

        var err = new HttpBadRequestError();
        assert.isOk(err instanceof Error, "Expected HttpError");
        assert.isOk(err instanceof HttpError, "Expected HttpError");
        assert.isOk(err instanceof HttpBadRequestError, "Expected HttpError");
    });

    it("should use new AccessDeniedError", function () {

        var err = new AccessDeniedError();
        assert.isOk(err instanceof Error, "Expected Error");
        assert.isOk(err instanceof DataError, "Expected DataError");
        assert.isOk(err instanceof AccessDeniedError, "Expected DataError");
        assert.equal(err.code, "EACCESS", "Expected EACCESS code");
        assert.equal(err.statusCode, 401, "Expected statusCode 401");
    });

    it("should use new DataNotFoundError", function () {

        var err = new DataNotFoundError();
        assert.isOk(err instanceof Error, "Expected Error");
        assert.isOk(err instanceof DataError, "Expected DataError");
        assert.isOk(err instanceof DataNotFoundError, "Expected DataError");
        assert.equal(err.code, "EFOUND", "Expected EFOUND code");
        assert.equal(err.statusCode, 404, "Expected statusCode 404");
    });

    /**
     * @class
     * @param {string} name
     * @abstract
     * @constructor
     */
    function Animal(name) {
        if (this.constructor === Animal.prototype.constructor) {
            throw new AbstractClassError();
        }
        this.name = name;
    }

    /**
     * @abstract
     */
    Animal.prototype.getDescription = function() {
        throw new AbstractMethodError();
    };

    /**
     * @abstract
     */
    Animal.prototype.speak = function() {
        throw new AbstractMethodError();
    };

    /**
     * @class
     * @constructor
     * @param {string} name
     * @augments Animal
     */
    function Dog(name) {
        Dog.super_.bind(this)(name);
    }
    LangUtils.inherits(Dog, Animal);

    Dog.prototype.speak = function() {
        return this.name + ' barks.';
    };

    /**
     * @class
     * @constructor
     * @param {string} name
     * @augments Animal
     */
    function Cat(name) {
        Cat.super_.bind(this)(name);
    }
    LangUtils.inherits(Cat, Animal);


    it("should use abstract class and abstract method errors", function () {
        assert.throws(function() {
            return new Animal();
        });
        assert.doesNotThrow(function() {
            return new Dog();
        });
        assert.throws(function() {
            var a = new Cat();
            return a.speak();
        });
        assert.doesNotThrow(function() {
            var a = new Dog();
            return a.speak();
        });
    });


});