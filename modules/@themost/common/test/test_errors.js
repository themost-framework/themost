var assert = require("chai").assert;
var HttpError = require('../errors').HttpError;
var DataError = require('../errors').DataError;
var HttpBadRequestError = require('../errors').HttpBadRequestError;
var AccessDeniedError = require('../errors').AccessDeniedError;
var DataNotFoundError = require('../errors').DataNotFoundError;

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
});