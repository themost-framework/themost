/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-06-10
 */
'use strict';
/**
 * @ignore
 */
var common = require('./common'),
    HttpNotFoundException = require('./common').HttpNotFoundException,
    HttpForbiddenException = require('./common').HttpForbiddenException,
    _ = require('lodash'),
    util = require('util'),
    htmlWriter = require('./html'),
    xml = require('most-xml'),
    path = require('path'),
    da = require("most-data"),
    fs = require('fs'),
    crypto = require('crypto'),
    Q = require('q'),
    async = require('async');
/**
 * @class
 * @constructor
 */
function HttpResult() {
    this.contentType = 'text/html';
    this.contentEncoding = 'utf8';
}
/**
 *
 * @param {Number=} status
 */
HttpResult.prototype.status = function(status) {
    this.responseStatus = status;
    return this;
};

HttpResult.prototype.toPromise = function() {
    var self = this;
    return Q.promise(function(resolve, reject) {
        return resolve(self);
    });
};

/**
 * Executes an HttpResult instance against an existing HttpContext.
 * @param {HttpContext} context
 * @param {Function} callback
 * */
HttpResult.prototype.execute = function(context, callback) {
    callback = callback || function() {};
    try {
        var response = context.response;
        if (typeof this.data === 'undefined' || this.data === null) {
            response.writeHead(204);
            return callback.call(context);
        }
        response.writeHead(this.responseStatus || 200, {"Content-Type": this.contentType});
       if (this.data)
            response.write(this.data, this.contentEncoding);
        callback.call(context);
    }
    catch(e) {
        callback.call(context, e);
    }
};
/**
 * Represents a user-defined content type that is a result of an action.
 * @class HttpContentResult
 * @param {string} content
 * @augments HttpResult
 * */
function HttpContentResult(content) {

    this.data = content;
    this.contentType = 'text/html';
    this.contentEncoding = 'utf8';
}
/**
 * Inherits HttpAction
 * */
util.inherits(HttpContentResult,HttpResult);

/**
 * Represents a content that does nothing.
 * @class HttpEmptyResult
 * @constructor
 * @augments HttpResult
 */
function HttpEmptyResult() {
    //
}

/**
 * Inherits HttpAction
 * */
util.inherits(HttpEmptyResult,HttpResult);

HttpEmptyResult.prototype.execute = function(context, callback)
{
    //do nothing
    callback = callback || function() {};
    callback.call(context);
};
/**
 * @param {string} key
 * @param {*} value
 * @returns {*}
 * @private
 */
function _json_ignore_null_replacer(key, value) {
    if (value==null)
        return undefined;
    return value;
}

/**
 * Represents an action that is used to send JSON-formatted content.
 * @class HttpJsonResult
 * @param {*} data
 * @constructor
 * @augments HttpResult
 */
function HttpJsonResult(data)
{
    if (data instanceof String)
        this.data = data;
    else {
        this.data = JSON.stringify(data, _json_ignore_null_replacer);
    }

    this.contentType = 'application/json;charset=utf-8';
    this.contentEncoding = 'utf8';
}
/**
 * Inherits HttpAction
 * */
util.inherits(HttpJsonResult,HttpResult);

/**
 * Represents an action that is used to send Javascript-formatted content.
 * @class HttpJavascriptResult
 * @param {*} data
 * @constructor
 * @augments HttpResult
 */
function HttpJavascriptResult(data)
{
    if (typeof data === 'string')
        this.data = data;
    this.contentType = 'text/javascript;charset=utf-8';
    this.contentEncoding = 'utf8';
}
/**
 * Inherits HttpAction
 * */
util.inherits(HttpJavascriptResult,HttpResult);


/**
 * Represents an action that is used to send XML-formatted content.
 * @class
 * @param data
 * @constructor
 * @augments HttpResult
 */
function HttpXmlResult(data)
{

    this.contentType = 'text/xml';
    this.contentEncoding = 'utf8';
    if (typeof data === 'undefined' || data == null)
        return;
    if (typeof data === 'object')
        this.data= xml.serialize(data, { item:'Item' }).outerXML();
    else
        this.data=data;
}

/**
 * Inherits HttpAction
 * */
util.inherits(HttpXmlResult,HttpResult);

/**
 * Represents a redirect action to a specified URI.
 * @class HttpRedirectResult
 * @param {string|*} url
 * @constructor
 * @augments HttpResult
 */
function HttpRedirectResult(url) {
    this.url = url;
}

/**
 * Inherits HttpAction
 * */
util.inherits(HttpRedirectResult,HttpResult);
/**
 *
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpRedirectResult.prototype.execute = function(context, callback)
{
    /**
     * @type ServerResponse
     * */
    var response = context.response;
    response.writeHead(302, { 'Location': this.url });
    //response.end();
    callback.call(context);
};

/**
 * Represents a static file result
 * @class HttpFileResult
 * @param {string} physicalPath
 * @param {string=} fileName
 * @constructor
 * @augments HttpResult
 */
function HttpFileResult(physicalPath, fileName) {
    //
    this.physicalPath = physicalPath;
    this.fileName = fileName;
}

/**
 * Inherits HttpAction
 * */
util.inherits(HttpFileResult,HttpResult);
/**
 *
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpFileResult.prototype.execute = function(context, callback)
{
    callback = callback || function() {};
    var physicalPath = this.physicalPath, fileName = this.fileName,  app = require('./index');
    fs.exists(physicalPath, function(exists) {
        if (!exists) {
            callback(new HttpNotFoundException());
        }
        else {
            try {
                fs.stat(physicalPath, function (err, stats) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        if (!stats.isFile()) {
                            callback(new HttpNotFoundException());
                        }
                        else {
                            //get if-none-match header
                            var requestETag = context.request.headers['if-none-match'];
                            //generate responseETag
                            var md5 = crypto.createHash('md5');
                            md5.update(stats.mtime.toString());
                            var responseETag = md5.digest('base64');
                            if (requestETag) {
                                if (requestETag === responseETag) {
                                    context.response.writeHead(304);
                                    context.response.end();
                                    callback();
                                    return;
                                }
                            }
                            var contentType = null;
                            //get file extension
                            var extensionName = path.extname(fileName || physicalPath);
                            //get MIME collection
                            var mimes = context.application.config.mimes;
                            var contentEncoding = null;
                            //find MIME type by extension
                            var mime = mimes.filter(function (x) {
                                return x.extension === extensionName;
                            })[0];
                            if (mime) {
                                contentType = mime.type;
                                if (mime.encoding)
                                    contentEncoding = mime.encoding;
                            }

                            //throw exception (MIME not found or access denied)
                            if (_.isNil(contentType)) {
                                callback(new HttpForbiddenException())
                            }
                            else {
                                /*//finally process request
                                fs.readFile(physicalPath, 'binary', function (err, data) {
                                    if (err) {
                                        callback(e);
                                    }
                                    else {
                                        //add Content-Disposition: attachment; filename="<file name.ext>"
                                        context.response.writeHead(200, {
                                            'Content-Type': contentType + (contentEncoding ? ';charset=' + contentEncoding : ''),
                                            'ETag': responseETag
                                        });
                                        context.response.write(data, "binary");
                                        callback();
                                    }
                                });*/
                                //create read stream
                                var source = fs.createReadStream(physicalPath);
                                //add Content-Disposition: attachment; filename="<file name.ext>"
                                context.response.writeHead(200, {
                                    'Content-Type': contentType + (contentEncoding ? ';charset=' + contentEncoding : ''),
                                    'ETag': responseETag
                                });
                                //copy file
                                source.pipe(context.response);
                                source.on('end', function() {
                                    callback();
                                });
                                source.on('error', function(err) {
                                    callback(err);
                                });
                            }
                        }
                    }
                });
            }
            catch (e) {
                callback(e);
            }
        }
    });

};
/**
 * @param controller
 * @param view
 * @param extension
 * @param callback
 * @returns {*}
 * @private
 */
function queryDefaultViewPath(controller, view, extension, callback) {
   return queryAbsoluteViewPath.call(this, this.application.mapPath('/views'), controller, view, extension, callback);
}
/**
 * @param view
 * @param extension
 * @param callback
 * @returns {*}
 * @private
 */
function querySharedViewPath(view, extension, callback) {
    return queryAbsoluteViewPath.call(this, this.application.mapPath('/views'), 'shared', view, extension, callback);
}

/**
 * @param search
 * @param controller
 * @param view
 * @param extension
 * @param callback
 * @private
 */
function queryAbsoluteViewPath(search, controller, view, extension, callback) {
    var self = this,
        result = path.resolve(search, util.format('%s/%s.html.%s', controller, view, extension));
    fs.exists(result, function(exists) {
        if (exists)
            return callback(null, result);
        //search for capitalized controller name e.g. person as Person
        var capitalizedController = controller.charAt(0).toUpperCase() + controller.substring(1);
        result = path.resolve(search, util.format('%s/%s.html.%s', capitalizedController, view, extension));
        fs.exists(result, function(exists) {
            if (exists)
                return callback(null, result);
            callback();
        });
    });
}
/**
 * @param {string} p
 * @returns {boolean}
 * @private
 */
function isAbsolute(p) {
    return path.normalize(p + '/') === path.normalize(path.resolve(p) + '/');
}

/**
 * Represents a class that is used to render a view.
 * @class
 * @param {string=} name - The name of the view.
 * @param {*=} data - The data that are going to be used to render the view.
 * @augments HttpResult
 */
function HttpViewResult(name, data)
{
    this.name = name;
    this.data = data===undefined? []: data;
    this.contentType = 'text/html;charset=utf-8';
    this.contentEncoding = 'utf8';
}
/**
 * Inherits HttpAction
 * */
util.inherits(HttpViewResult,HttpResult);

/**
 * Sets or changes the name of this HttpViewResult instance.
 * @param {string} s
 * @returns {HttpViewResult}
 */
HttpViewResult.prototype.setName = function(s) {
    this.name = s;
    return this;
};

/**
 * @param {function(Error=,*=)} callback
 * @param {HttpContext} context - The HTTP context
 * */
HttpViewResult.prototype.execute = function(context, callback)
{
    var self = this;
    callback = callback || function() {};
    var app = require('./index'),
        array = require('most-array'),
        util = require('util'),
        fs = require('fs');
    /**
     * @type ServerResponse
     * */
    var response = context.response;
    //if the name is not defined get the action name of the current controller
    if (!this.name)
        //get action name
        this.name = context.data['action'];
    //validate [path] route param in order to load a view that is located in a views' sub-directory (or in another absolute path)
    var routePath;
    if (context.request.route) {
        routePath =  context.request.route.path;
    }
    //get view name
    var viewName = this.name;
    if (/^partial/.test(viewName)) {
        //partial view
        viewName = viewName.substr(7).replace(/^-/,'');
        context.request.route.partial = true;
    }

    //and of course controller's name
    var controllerName = context.data['controller'];
    //enumerate existing view engines e.g /views/controller/index.[html].ejs or /views/controller/index.[html].xform etc.
    /**
     * {HttpViewEngineReference|*}
     */
    var viewPath, viewEngine;
    async.eachSeries(context.application.config.engines, function(engine, cb) {
        if (viewPath) { cb(); return; }
        if (routePath && isAbsolute(routePath)) {
            queryAbsoluteViewPath.call(context, routePath, controllerName, viewName, engine.extension, function(err, result) {
                if (err) { return cb(err); }
                if (result) {
                    viewPath = result;
                    viewEngine = engine;
                    return cb();
                }
                else {
                    return cb();
                }
            });
        }
        else {
            var searchViewName = viewName;
            if (routePath) {
                searchViewName = path.join(routePath, viewName);
            }
            //search by relative path
            queryDefaultViewPath.call(context, controllerName, searchViewName, engine.extension, function(err, result) {
                if (err) { return cb(err); }
                if (result) {
                    viewPath = result;
                    viewEngine = engine;
                    return cb();
                }
                else {
                    querySharedViewPath.call(context, searchViewName, engine.extension, function(err, result) {
                        if (err) { return cb(err); }
                        if (result) {
                            viewPath = result;
                            viewEngine = engine;
                            return cb();
                        }
                        cb();
                    });
                }
            });
        }

    }, function(err) {
        if (err) { callback(err); return; }
        if (viewEngine) {
            var engine = require(viewEngine.type);
            /**
             * @type {HttpViewEngine|*}
             */
            var engineInstance = engine.createInstance(context);
            //render
            var e = { context:context, target:self };
            context.emit('preExecuteResult', e, function(err) {
                if (err) {
                    callback(err);
                }
                else {
                    engineInstance.render(viewPath, self.data, function(err, result) {
                        if (err) {
                            callback.call(context, err);
                        }
                        else {
                            //HttpViewResult.result or data (?)
                            self.result = result;
                            context.emit('postExecuteResult', e, function(err) {
                                if (err) {
                                    callback.call(context, err);
                                }
                                else {
                                    response.writeHead(200, {"Content-Type": self.contentType});
                                    response.write(self.result, self.contentEncoding);
                                    callback.call(context);
                                }
                            });
                        }
                    });
                }
            });

        }
        else {
            var er = new common.HttpNotFoundException();
            if (context.request && context.request.url) {
                er.resource = context.request.url;
            }
            callback.call(context, er);
        }
    });




};


/**
 * @classdesc Provides methods that respond to HTTP requests that are made to a web application
 * @class
 * @constructor
 * @param {HttpContext} context - The executing HTTP context.
 * @property {HttpContext} context - Gets or sets the HTTP context associated with this controller
 * @property {string} name - Gets or sets the internal name for this controller
 * */
function HttpController(context) {
    this.context = context;
}

/**
 * Creates a view result object for the given request.
 * @param {*=} data
 * @returns {HttpViewResult}
 */
HttpController.prototype.view = function(data)
{
    return new HttpViewResult(null, data);
};

/**
 * Creates a view result based on the context content type
 * @param {*=} data
 * @returns HttpViewResult
 * */
HttpController.prototype.result = function(data)
{
    if (this.context) {
         var fn = this[this.context.format];
        if (typeof fn !== 'function')
            throw new common.HttpException(400,'Not implemented.');
        return fn.call(this, data);
    }
    else
        throw new Error('Http context cannot be empty at this context.');
};

HttpController.prototype.forbidden = function (callback) {
    callback(new common.HttpForbiddenException());
};

/**
 * Creates a view result object for the given request.
 * @param {*=} data
 * @returns HttpViewResult
 * */
HttpController.prototype.html = function(data)
{
    return new HttpViewResult(null, data);
};
/**
 * Creates a view result object for the given request.
 * @param {*=} data
 * @returns HttpViewResult
 * */
HttpController.prototype.htm = HttpController.prototype.html;

/**
 * Creates a view result object for the given request.
 * @param {String=} data
 * @returns HttpJavascriptResult
 * */
HttpController.prototype.js = function(data)
{
    return new HttpJavascriptResult(data);
};

/**
 * Creates a view result object that represents a client javascript object.
 * This result may be used for sharing specific objects stored in memory or server filesystem
 * e.g. serve a *.json file as a client variable with name window.myVar1 or
 * serve user settings object ({ culture: 'en-US', notifyMe: false}) as a variable with name window.settings
 * @param {String} name
 * @param {String|*} obj
 * @returns HttpResult
 * */
HttpController.prototype.jsvar = function(name, obj)
{
    if (typeof name !== 'string')
        return new HttpEmptyResult();
    if (name.length===0)
        return new HttpEmptyResult();
    if (typeof obj === 'undefined' || obj === null)
        return new HttpJavascriptResult(name.concat(' = null;'));
    else if (obj instanceof Date)
        return new HttpJavascriptResult(name.concat(' = new Date(', obj.valueOf(), ');'));
    else if (typeof obj === 'string')
        return new HttpJavascriptResult(name.concat(' = ', obj, ';'));
    else
        return new HttpJavascriptResult(name.concat(' = ', JSON.stringify(obj), ';'));
};

/**
 * Invokes a default action and returns an HttpViewResult instance
 * @param {String} action
 * @param {Function} callback
 */
HttpController.prototype.action = function(callback)
{
    var self = this;
    self.context.handleGet(function() {
        return callback(null, self.view());
    }).unhandle(function() {
        return callback(new common.HttpMethodNotAllowed());
    });

};

/**
 * Creates a content result object by using a string.
 * @returns HttpContentResult
 * */
HttpController.prototype.content = function(content)
{
     return new HttpContentResult(content);
};
/**
 * Creates a JSON result object by using the specified data.
 * @returns HttpJsonResult
 * */
HttpController.prototype.json = function(data)
{
    return new HttpJsonResult(data);
};

/**
 * Creates a XML result object by using the specified data.
 * @returns HttpXmlResult
 * */
HttpController.prototype.xml = function(data)
{
    return new HttpXmlResult(data);
};

/**
 * Creates a binary file result object by using the specified path.
 * @param {string}  physicalPath
 * @param {string=}  fileName
 * @returns {HttpFileResult|HttpResult}
 * */
HttpController.prototype.file = function(physicalPath, fileName)
{
    return new HttpFileResult(physicalPath, fileName);
};

/**
 * Creates a redirect result object that redirects to the specified URL.
 * @returns HttpRedirectResult
 * */
HttpController.prototype.redirect = function(url)
{
    return new HttpRedirectResult(url);
};

/**
 * Creates an empty result object.
 * @returns HttpEmptyResult
 * */
HttpController.prototype.empty = function()
{
    return new HttpEmptyResult();
};

/**
 * Promise resolver function
 * @callback PromiseResolverFunction
 * @param {Function} resolve
 * @param {Function=} reject
 * @param {Function=} notify
 */

/**
 * Returns a promise by executing the given resolver function
 * @param {PromiseResolverFunction} resolver
 * @returns {Promise|*}
 * */
HttpController.prototype.toPromise = function(resolver)
{
    return Q.promise(resolver.bind(this));
};
/**
 * Abstract view engine class
 * @class HttpViewEngine
 * @param {HttpContext} context
 * @constructor
 * @augments {EventEmitter}
 */
function HttpViewEngine(context) {
    //
}
util.inherits(HttpViewEngine, da.types.EventEmitter2);

/**
 * Renders the specified view with the options provided
 * @param url
 * @param options
 * @param {Function} callback
 */
HttpViewEngine.prototype.render = function(url, options, callback) {
    //
};


/**
 * Defines an HTTP view engine in application configuration
 * @class
 * @constructor
 */
function HttpViewEngineReference()
{
    /**
     * Gets or sets the class associated with an HTTP view engine
     * @type {String}
     */
    this.type = null;
    /**
     * Gets or sets the name of an HTTP view engine
     * @type {String}
     */
    this.name = null;
    /**
     * Gets or sets the layout extension associated with an HTTP view engine
     * @type {null}
     */
    this.extension = null;
}

/**
 * Encapsulates information that is related to rendering a view.
 * @class
 * @param {HttpContext} context
 * @property {DataModel} model
 * @property {HtmlViewHelper} html
 * @constructor
 * @augments {EventEmitter}
 */
function HttpViewContext(context) {
    /**
     * Gets or sets the body of the current view
     * @type {String}
     */
    this.body='';
    /**
     * Gets or sets the title of the page if the view will be fully rendered
     * @type {String}
     */
    this.title='';
    /**
     * Gets or sets the view layout page if the view will be fully rendered
     * @type {String}
     */
    this.layout = null;
    /**
     * Gets or sets the view data
     * @type {String}
     */
    this.data = null;
    /**
     * Represents the current HTTP context
     * @type {HttpContext}
     */
    this.context = context;

    /**
     * @type {HtmlWriter}
     */
    this.writer = undefined;

    var writer = null;
    Object.defineProperty(this, 'writer', {
        get:function() {
            if (writer)
                return writer;
            writer = htmlWriter.createInstance();
            writer.indent = false;
            return writer;
        }, configurable:false, enumerable:false
    });

    var self = this;
    Object.defineProperty(this, 'model', {
        get:function() {
            if (self.context.params)
                if (self.context.params.controller)
                    return self.context.model(self.context.params.controller);
            return null;
        }, configurable:false, enumerable:false
    });

    this.html = new HtmlViewHelper(this);
    //class extension initiators
    if (typeof this.init === 'function') {
        //call init() method
        this.init();
    }
}
util.inherits(HttpViewContext, da.types.EventEmitter2);
/**
 * @param {string} url
 * @param {Function} callback
 * @returns {string}
 */
HttpViewContext.prototype.render = function(url, callback) {
    callback = callback || function() {};
    var app = require('./index');
    //get response cookie, if any
    var requestCookie = this.context.response.getHeader('set-cookie');
    if (typeof this.context.request.headers.cookie !== 'undefined')
        requestCookie = this.context.request.headers.cookie;
    this.context.application.executeRequest( { url: url, cookie: requestCookie }, function(err, result) {
        if (err) {
            callback(err);
        }
        else {
            callback(null, result.body);
        }
    });
};

HttpViewContext.prototype.init = function() {
    //
};

/**
 *
 * @param {String} s
 * @param {String=} lib
 * @returns {String}
 */
HttpViewContext.prototype.translate = function(s, lib) {
    return this.context.translate(s, lib);
};
/**
 *
 * @param {String} s
 * @param {String=} lib
 * @returns {String}
 */
HttpViewContext.prototype.$T = function(s, lib) {
    return this.translate(s, lib);
};

/**
 * @param {HttpViewContext} $view
 * @returns {*}
 * @private
 */
HttpViewContext.HtmlViewHelper = function($view)
{
    var doc;
    return {
    antiforgery: function() {
        //create token
        var context = $view.context,  value = context.application.encrypt(JSON.stringify({ id: Math.floor(Math.random() * 1000000), url:context.request.url, date:new Date() }));
        //try to set cookie
        context.response.setHeader('Set-Cookie','.CSRF='.concat(value));
        return $view.writer.writeAttribute('type', 'hidden')
            .writeAttribute('id', '_CSRFToken')
            .writeAttribute('name', '_CSRFToken')
            .writeAttribute('value', value)
            .writeFullBeginTag('input')
            .toString();
    },
    element: function(obj) {
        if (typeof doc === 'undefined') { doc = $view.context.application.document(); }
        return doc.parentWindow.angular.element(obj);
    },
    lang: function() {
        var context = $view.context, c= context.culture();
        if (typeof c === 'string') {
            if (c.length>=2) {
                return c.toLowerCase().substring(0,2);
            }
        }
        //in all cases return default culture
        return 'en';
    }
};
}

/**
 * @class
 * @param {HttpViewContext} view
 * @constructor
 * @property {HttpViewContext} parent - The parent HTTP View Context
 * @property {HTMLDocument|*} document - The in-process HTML Document
 */
function HtmlViewHelper(view) {
    var document, self = this;
    Object.defineProperty(this, 'parent', {
        get: function() {
            return view;
        } , configurable:false, enumerable:false
    });
    Object.defineProperty(this, 'document', {
        get: function() {
            if (typeof document !== 'undefined') { return document; }
            document = self.view.context.application.document();
            return document;
        } , configurable:false, enumerable:false
    });
}
HtmlViewHelper.prototype.antiforgery = function() {
    var $view = this.parent;
    //create token
    var context = $view.context,  value = context.application.encrypt(JSON.stringify({ id: Math.floor(Math.random() * 1000000), url:context.request.url, date:new Date() }));
    //try to set cookie
    context.response.setHeader('Set-Cookie','.CSRF='.concat(value));
    return $view.writer.writeAttribute('type', 'hidden')
        .writeAttribute('id', '_CSRFToken')
        .writeAttribute('name', '_CSRFToken')
        .writeAttribute('value', value)
        .writeFullBeginTag('input')
        .toString();
};

HtmlViewHelper.prototype.element = function(obj) {
    return this.document.parentWindow.angular.element(obj);
};

HtmlViewHelper.prototype.lang = function() {
    var $view = this.parent;
    var context = $view.context, c= context.culture();
    if (typeof c === 'string') {
        if (c.length>=2) {
            return c.toLowerCase().substring(0,2);
        }
    }
    //in all cases return default culture
    return 'en';
};


if (typeof exports !== 'undefined')
{
    module.exports.HttpResult  = HttpResult;
    module.exports.HttpContentResult  = HttpContentResult;
    module.exports.HttpJsonResult = HttpJsonResult;
    module.exports.HttpEmptyResult = HttpEmptyResult;
    module.exports.HttpXmlResult = HttpXmlResult;
    module.exports.HttpRedirectResult = HttpRedirectResult;
    module.exports.HttpFileResult = HttpFileResult;
    module.exports.HttpViewResult = HttpViewResult;
    module.exports.HttpViewContext = HttpViewContext;
    module.exports.HtmlViewHelper = HtmlViewHelper;
    module.exports.HttpController = HttpController;
    module.exports.HttpViewEngine = HttpViewEngine;
    module.exports.HttpViewEngineReference = HttpViewEngineReference;
}



