/**
 * Created by kbarbounakis on 2/9/16.
 */
/**
 * @private
 */
var StaticHandler = require("./static").StaticHandler,
    util = require("util"),
    fs = require("fs"),
    url = require("url"),
    path = require("path");

function NodeModulesHandler() {

}

util.inherits(NodeModulesHandler, StaticHandler);

NodeModulesHandler.prototype.mapRequest = function(context, callback) {
    callback = callback || function() {};
    try {
        //get file path
        var uri = url.parse(context.request.url);
        if (!/^\/node_modules\//i.test(uri.pathname)) {
            return callback();
        }
        var p = path.join(process.cwd(), uri.pathname);
        fs.stat(p, function(err, stats) {
            if (err) {
                //requested file does not exists
                if (err.code === "ENOENT") { return callback(); }
                return callback(err);
            }
            else {
                //if file exists
                if (stats && stats.isFile()) {
                    //set request current handler
                    context.request.currentHandler = new NodeModulesHandler();
                    //set current execution path
                    context.request.currentExecutionPath = p;
                    //set file stats
                    context.request.currentExecutionFileStats = stats;
                }
                callback(null);
            }
        });
    } catch (e) {
        callback(e);
    }
};

if (typeof exports !== 'undefined') {
    module.exports = {
        NodeModulesHandler:NodeModulesHandler,
        createInstance : function() {
            return new NodeModulesHandler();
        }
    };
}