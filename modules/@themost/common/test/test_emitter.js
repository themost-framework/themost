var assert = require("chai").assert;
var TraceUtils = require('../utils').TraceUtils;
var LangUtils = require('../utils').LangUtils;
var Q = require('q');
var SequentialEventEmitter = require('../emitter').SequentialEventEmitter;
describe("test sequential event emitter", function () {
    /**
     * @constructor
     * @augments {EventEmitter}
     */
    function Messenger() {
        Messenger.super_.bind(this)();
    }
    LangUtils.inherits(Messenger, SequentialEventEmitter);

    Messenger.prototype.send = function(to, message) {
        var self = this;
        return Q.Promise(function (resolve, reject) {
            self.emit("message.new", to, message, function (err) {
                if (err) {
                    return reject(err);
                }
                self.emit("message.sent", function () {
                    return resolve();
                });
            });
        });
    };

    it("should emit event", function () {
        var msg = new Messenger();
        msg.on("message.new", function (to, message, cb) {
            TraceUtils.log("Message Event #1 (To:" + to + "): " + message);
            setTimeout(function () {
                return cb();
            }, 1000);
        });

        msg.prependListener("message.new", function (to, message, cb) {
            TraceUtils.log("Message Event #0 (To:" + to + "): " + message);
            setTimeout(function () {
                return cb();
            }, 2000);
        });

        msg.on("message.new", function (to, message, cb) {
            TraceUtils.log("Message Event #2 (To:" + to + "): " + message);
            setTimeout(function () {
                return cb();
            }, 2000);
        });
        msg.once("message.sent", function (cb) {
            TraceUtils.log("Message was succesfully sent");
            setTimeout(function () {
                return cb();
            }, 2000);
        });
        return msg.send("George", "Hello!");
    });

    it("should add and remove listener", function () {
        var msg = new Messenger();
        msg.on("message.new", function (to, message, cb) {
            TraceUtils.log("Message Event #1 (To:" + to + "): " + message);
            setTimeout(function () {
                return cb();
            }, 1000);
        });

        msg.on("message.new", function (to, message, cb) {
            TraceUtils.log("Message Event #2 (To:" + to + "): " + message);
            setTimeout(function () {
                return cb();
            }, 2000);
        });

        var onMessageNew = function onMessageNew(to, message, cb) {
            TraceUtils.log("Message Event #3 (To:" + to + "): " + message);
            setTimeout(function () {
                return cb();
            }, 2000);
        };

        msg.on("message.new", onMessageNew);
        msg.removeListener("message.new", onMessageNew);
        assert.equal(msg.listenerCount("message.new"), 2, "Invalid number of event listeners");

        msg.once("message.sent", function (cb) {
            TraceUtils.log("Message was succesfully sent");
            setTimeout(function () {
                return cb();
            }, 2000);
        });

        return msg.send("George", "Hello!");
    });

    it("should throw error on first emitter", function () {
        var msg = new Messenger();

        msg.on("message.new", function (to, message, cb) {
            TraceUtils.log("Message Event #1 (To:" + to + "): " + message);
            setTimeout(function () {
                return cb(new Error("Operation cancelled"));
            }, 1000);
        });

        msg.on("message.new", function (to, message, cb) {
            TraceUtils.log("Message Event #2 (To:" + to + "): " + message);
            setTimeout(function () {
                return cb();
            }, 2000);
        });
        assert.equal(msg.listenerCount("message.new"), 2, "Invalid number of event listeners");
        msg.once("message.sent", function (cb) {
            TraceUtils.log("Message was succesfully sent");
            setTimeout(function () {
                return cb();
            }, 2000);
        });
        return msg.send("George", "Hello!");
    });
});