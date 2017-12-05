var assert = require("chai").assert;
var Args = require("../utils").Args;
var Base26Number = require("../utils").Base26Number;
var Guid = require("../utils").Guid;
var LangUtils = require("../utils").LangUtils;
var PathUtils = require("../utils").PathUtils;
var RandomUtils = require("../utils").RandomUtils;
var TextUtils = require("../utils").TextUtils;
var TraceUtils = require("../utils").TraceUtils;

describe("test common errors", function () {
    it("should use Args", function () {

        assert.doesNotThrow(function () {
            var a = 5;
            Args.check(typeof a === "number", "Expected number");
        });

        assert.throws(function () {
            var a = 5;
            Args.check(typeof a === "string", "Expected string");
        });

        assert.doesNotThrow(function () {
            var a = "test";
            Args.notString(a, "Argument");
        });

        assert.throws(function () {
            var a = 5;
            Args.notString(a, "Argument");
        });

        assert.doesNotThrow(function () {
            var a = "test";
            Args.notEmpty(a, "Argument");
        });

        assert.throws(function () {
            var a = null;
            Args.notEmpty(a, "Argument");
        });

        assert.doesNotThrow(function () {
            var a = 100;
            Args.notNegative(a, "Argument");
        });

        assert.throws(function () {
            var a = -100;
            Args.notNegative(a, "Argument");
        });

        assert.doesNotThrow(function () {
            var a = function a() {
                //
            };
            Args.notFunction(a, "Argument");
        });

        assert.throws(function () {
            var a = -100;
            Args.notFunction(a, "Argument");
        });

        assert.doesNotThrow(function () {
            var a = 100;
            Args.notNumber(a, "Argument");
        });

        assert.throws(function () {
            var a = "test";
            Args.notNumber(a, "Argument");
        });

        assert.doesNotThrow(function () {
            var a = new Date();
            Args.notNull(a, "Argument");
        });

        assert.throws(function () {
            var a = undefined;
            Args.notNull(a, "Argument");
        });

        assert.doesNotThrow(function () {
            var a = 100;
            Args.notPositive(a, "Argument");
        });

        assert.throws(function () {
            var a = 0;
            Args.notPositive(a, "Argument");
        });
    });

    it("should use Base26 numbers", function () {
        var x = Base26Number.toBase26(100);
        assert.equal("wdaaaaaa", x);
        var y = new Base26Number(100);
        assert.equal(y.toString(), "wdaaaaaa");
        assert.equal(Base26Number.fromBase26("wdaaaaaa"), 100);
    });

    it("should use TextUtils.toMD5", function () {
        var x = TextUtils.toMD5("Hello");
        assert.equal(x, "8b1a9953c4611296a827abf8c47804d7");
        TraceUtils.log("MD5", "Hello", x);
    });

    it("should use TextUtils.toSHA1", function () {
        var x = TextUtils.toSHA1("Hello");
        assert.equal(x, "f7ff9e8b7bb2e09b70935a5d785e0cc5d9d0abf0");
        TraceUtils.log("SHA1", "Hello", x);
    });

    it("should use TextUtils.toSHA256", function () {
        var x = TextUtils.toSHA256("Hello");
        assert.equal(x, "185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969");
        TraceUtils.log("SHA256", "Hello", x);
    });

    it("should use Guid class", function () {
        var x = new Guid("71BE4D98-3873-4648-9154-C7F79D89E19D");
        assert.equal(x.toString(), "71BE4D98-3873-4648-9154-C7F79D89E19D");
    });

    it("should get random Guids", function () {
        for (var i = 1; i <= 10; i++) {
            TraceUtils.log("#" + i, Guid.newGuid().toString());
        }
    });

    it("should use RandomUtils class", function () {

        var x = RandomUtils.randomChars(12);
        assert.equal(x.length, 12);
        TraceUtils.log("Random characters", x);
        for (var i = 1; i <= 10; i++) {
            TraceUtils.log("#" + i, RandomUtils.randomChars(12));
        }
        var y = RandomUtils.randomInt(0, 10);
        TraceUtils.log("Random int", y);
        assert.isOk(y >= 0 && y <= 10, "Invalid random int");

        var z = RandomUtils.randomHex(6);
        TraceUtils.log("Random hex", z);
        for (var _i = 1; _i <= 10; _i++) {
            TraceUtils.log("#" + _i, RandomUtils.randomHex(6));
        }
        assert.isOk(/^[0-9a-fA-F]+$/i.test(z), "Invalid random hex");
    });

    it("should use LangUtils.getFunctionParams", function () {
        var params = LangUtils.getFunctionParams(function (a, b) {
            return a + b;
        });
        assert.equal(params.length, 2);
        assert.equal(params[0], "a");
        assert.equal(params[1], "b");
    });

    it("should use LangUtils.convert", function () {
        var x = LangUtils.parseValue("true");
        assert.isOk(typeof x === "boolean", "Expected boolean");
        x = LangUtils.parseValue("12.4");
        assert.isOk(typeof x === "number", "Expected number");
        x = LangUtils.parseValue("2017-12-22");
        assert.isOk(x instanceof Date, "Expected date");
    });

    it("should use LangUtils.parseForm", function () {
        var x = LangUtils.parseForm({
            "user[name]": "user1",
            "user[password]": "pass",
            "user[rememberMe]": "true"
        });
        assert.isOk(x.hasOwnProperty("user"), "User property is missing");
        TraceUtils.log("Data", x);
    });

    it("should use LangUtils.parseForm with options", function () {
        var x = LangUtils.parseForm({
            "user[name]": "user1",
            "user[password]": "pass",
            "user[options][rememberMe]": "true"
        }, {
            convertValues: true
        });
        assert.isOk(x.hasOwnProperty("user"), "User property is missing");
        assert.isOk(typeof x.user.options.rememberMe === "boolean", "Invalid property value");
        TraceUtils.log("Data", x);
    });

    it("should use PathUtils.join", function () {
        var joined = PathUtils.join(__dirname, "test-utils.ts");
        TraceUtils.log(joined);
        assert.isOk(/test-utils.ts$/.test(joined));
    });

    it("should use TraceUtils", function () {
        TraceUtils.level("debug");
        TraceUtils.log("GivenName:%s, FamilyName:%s", "Peter", "Thomas");
        TraceUtils.info("GivenName:%s, FamilyName:%s", "Peter", "Thomas");
        TraceUtils.warn("GivenName:%s, FamilyName:%s", "Peter", "Thomas");
        TraceUtils.error("An internal server error occurred!");
        TraceUtils.level("debug");
        TraceUtils.debug("Application is running in debug mode");
    });
});