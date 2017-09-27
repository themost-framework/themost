/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import 'source-map-support/register';
import _ from 'lodash';
import Q from 'q';
import fs from 'fs';
import util from 'util';
import path from 'path';
import crypto from 'crypto';
import async from 'async';
import xml from 'most-xml';
import {HttpNotFoundError,HttpForbiddenError,HttpError} from '@themost/common/errors';
import {HtmlWriter} from '@themost/common/html';
import {HttpAnyResult} from "./results";

/**
 * @classdesc Represents a user-defined HTTP content result, typically an HTML or XML string.
 * @class
 * @augments HttpAnyResult
 * */
export class HttpContentResult extends HttpAnyResult {
    /**
     * @constructor
     * @param {string} content
     * @param {string=} contentType
     * @param {string=} contentEncoding
     */
    constructor(content, contentType, contentEncoding) {
        super();
        this.data = content;
        this.contentType = contentType || 'text/html';
        this.contentEncoding = contentEncoding || 'utf8';
    }

    /**
     *
     * @param {HttpContext} context
     */
    execute(context) {
        const self = this;
        return Q.nfcall(function(callback) {
            /**
             * @type ServerResponse
             * */
            const response = context.response;
            if (_.isNil(self.data)) {
                response.writeHead(204);
                return callback();
            }
            else {
                response.writeHead(200, { 'Content-Type': self.contentType });
                response.write(self.data,self.contentEncoding, function(err) {
                    return callback(err);
                });
            }
        });
    }

}

/**
 * @classdesc Represents an empty HTTP result.
 * @class
 * @augments HttpAnyResult
 */
export class HttpEmptyResult extends HttpAnyResult {
    /**
     * @param context
     * @returns {Promise}
     */
    execute(context) {
        //do nothing
        context.response.writeHead(204);
        return Q();
    }
}

/**
 * @param {string} key
 * @param {*} value
 * @returns {*}
 * @private
 */
function _json_ignore_null_replacer(key, value) {
    if (value===null)
        return undefined;
    return value;
}

/**
 * @classdesc Represents an action that is used to send JSON-formatted content.
 * @class
 * @augments HttpAnyResult
 */
export class HttpJsonResult extends HttpAnyResult {
    /**
     * @constructor
     * @param {*} data
     */
    constructor(data) {
        super();
        if (data instanceof String)
            this.data = data;
        else {
            this.data = JSON.stringify(data, _json_ignore_null_replacer);
        }
        this.contentType = 'application/json;charset=utf-8';
        this.contentEncoding = 'utf8';
    }
    /**
     * @param context
     * @returns {Promise}
     */
    execute(context) {
        const self = this;
        return Q.nfcall(function(callback) {
            /**
             * @type ServerResponse
             * */
            const response = context.response;
            if (_.isNil(self.data)) {
                response.writeHead(204);
                return callback();
            }
            response.writeHead(200, { 'Content-Type': self.contentType });
            response.write(self.data,self.contentEncoding, function(err) {
                return callback(err);
            });
        });
    }

}

/**
 * @classdesc Represents an action that is used to send Javascript-formatted content.
 * @class
 * @augments HttpAnyResult
 */
export class HttpJavascriptResult extends HttpAnyResult {
    /**
     * @constructor
     * @param {*} data
     */
    constructor(data) {
        super();
        if (typeof data === 'string')
            this.data = data;
        this.contentType = 'text/javascript;charset=utf-8';
        this.contentEncoding = 'utf8';
    }

    /**
     * @param context
     * @returns {Promise}
     */
    execute(context) {
        const self = this;
        return Q.nfcall(function(callback) {
            /**
             * @type ServerResponse
             * */
            const response = context.response;
            if (_.isNil(self.data)) {
                response.writeHead(204);
                return callback();
            }
            response.writeHead(200, { 'Content-Type': self.contentType });
            response.write(self.data,self.contentEncoding, function(err) {
                return callback(err);
            });
        });
    }
}

/**
 * @classdesc Represents an action that is used to send XML-formatted content.
 * @class
 * @augments HttpAnyResult
 */
export class HttpXmlResult extends HttpAnyResult {
    /**
     * @constructor
     * @param {*} data
     */
    constructor(data) {
        super();
        this.contentType = 'text/xml';
        this.contentEncoding = 'utf8';
        if (typeof data === 'undefined' || data === null)
            return;
        if (typeof data === 'object')
            this.data= xml.serialize(data).outerXML();
        else
            this.data=data;
    }
}

/**
 * @classdesc Represents a redirect action to a specified URI.
 * @class
 * @augments HttpAnyResult
 */
export class HttpRedirectResult extends HttpAnyResult {
    /**
     * @constructor
     * @param {string|*} url
     */
    constructor(url) {
        super();
        this.url = url;
    }

    /**
     *
     * @param {HttpContext} context
     * @returns {Promise}
     */
    execute(context) {
        /**
         * @type ServerResponse
         * */
        const response = context.response;
        response.writeHead(302, { 'Location': this.url });
        return Q();
    }
}

/**
 * @classdesc Represents a static file result
 * @class
 * @augments HttpAnyResult
 */
export class HttpFileResult extends HttpAnyResult {
    /**
     *
     * @constructor
     * @param {string} physicalPath
     * @param {string=} fileName
     */
    constructor(physicalPath, fileName) {
        super();
        this.physicalPath = physicalPath;
        this.fileName = fileName;
    }

    /**
     *
     * @param {HttpContext} context
     * @returns {Promise}
     */
    execute(context) {

        return Q.nfcall(function(callback) {
            const physicalPath = this.physicalPath,
                fileName = this.fileName;
            fs.exists(physicalPath, function(exists) {
                if (!exists) {
                    callback(new HttpNotFoundError());
                }
                else {
                    try {
                        fs.stat(physicalPath, function (err, stats) {
                            if (err) {
                                callback(err);
                            }
                            else {
                                if (!stats.isFile()) {
                                    callback(new HttpNotFoundError());
                                }
                                else {
                                    //get if-none-match header
                                    const requestETag = context.request.headers['if-none-match'];
                                    //generate responseETag
                                    const md5 = crypto.createHash('md5');
                                    md5.update(stats.mtime.toString());
                                    const responseETag = md5.digest('base64');
                                    if (requestETag) {
                                        if (requestETag === responseETag) {
                                            context.response.writeHead(304);
                                            context.response.end();
                                            callback();
                                            return;
                                        }
                                    }
                                    let contentType = null;
                                    //get file extension
                                    const extensionName = path.extname(fileName || physicalPath);
                                    //get MIME collection
                                    const mimes = context.getApplication().config.mimes;
                                    let contentEncoding = null;
                                    //find MIME type by extension
                                    const mime = mimes.filter(function (x) {
                                        return x.extension === extensionName;
                                    })[0];
                                    if (mime) {
                                        contentType = mime.type;
                                        if (mime.encoding)
                                            contentEncoding = mime.encoding;
                                    }

                                    //throw exception (MIME not found or access denied)
                                    if (_.isNil(contentType)) {
                                        callback(new HttpForbiddenError())
                                    }
                                    else {
                                        //create read stream
                                        const source = fs.createReadStream(physicalPath);
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
        });



    }
}

/**
 * @param controller
 * @param view
 * @param extension
 * @param callback
 * @returns {*}
 * @private
 */
function queryDefaultViewPath(controller, view, extension, callback) {
    return queryAbsoluteViewPath.call(this, this.getApplication().mapExecutionPath('views'), controller, view, extension, callback);
}
/**
 * @param view
 * @param extension
 * @param callback
 * @returns {*}
 * @private
 */
function querySharedViewPath(view, extension, callback) {
    return queryAbsoluteViewPath.call(this, this.getApplication().mapExecutionPath('views'), 'shared', view, extension, callback);
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
    let result = path.resolve(search, util.format('%s/%s.html.%s', controller, view, extension));
    fs.exists(result, function(exists) {
        if (exists)
            return callback(null, result);
        //search for capitalized controller name e.g. person as Person
        const capitalizedController = controller.charAt(0).toUpperCase() + controller.substring(1);
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
    //var re = new RegExp('^' + p, 'i');
    //return re.test(path.resolve(process.cwd(), p));
    return path.normalize(p + '/') === path.normalize(path.resolve(p) + '/');
}

/**
 * Represents a class that is used to render a view.
 * @class
 * @param {string=} name - The name of the view.
 * @param {Array=} data - The data that are going to be used to render the view.
 * @augments HttpAnyResult
 */
export class HttpViewResult extends HttpAnyResult {
    constructor(name, data) {
        super();
        this.name = name;
        this.data = data || {};
        this.contentType = 'text/html;charset=utf-8';
        this.contentEncoding = 'utf8';
    }

    /**
     * Sets or changes the name of this HttpViewResult instance.
     * @param {string} s
     * @returns {HttpViewResult}
     */
    setName(s) {
        this.name = s;
        return this;
    }

    /**
     * @param {HttpContext} context
     * @returns {Promise}
     * */
    execute(context) {
        const self = this;

        return Q.nfcall(function(callback) {
            /**
             * @type ServerResponse
             * */
            const response = context.response;
            //if the name is not defined get the action name of the current controller
            if (!self.name)
            //get action name
                self.name = context.request.routeData['action'];
            //validate [path] route param in order to load a view that is located in a views' sub-directory (or in another absolute path)
            let routePath;
            if (context.request.route) {
                routePath =  context.request.route.path;
            }
            //get view name
            let viewName = self.name;
            if (/^partial/.test(viewName)) {
                //partial view
                viewName = viewName.substr(7).replace(/^-/,'');
                context.request.route.partial = true;
            }

            //and of course controller's name
            const controllerName = context.request.routeData['controller'];
            //enumerate existing view engines e.g /views/controller/index.[html].ejs or /views/controller/index.[html].xform etc.
            /**
             * {HttpViewEngineReference|*}
             */
            let viewPath, viewEngine;
            async.eachSeries(context.getApplication().getConfiguration().engines, function(engine, cb) {
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
                    let searchViewName = viewName;
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
                if (err) { return callback(err); }
                if (viewEngine) {
                    try {
                        let EngineCtor = require(viewEngine.type);
                        if (!_.isFunction(EngineCtor)) {
                            return callback(new ReferenceError(util.format('The specified engine %s module does not export default class', viewEngine.type)));
                        }
                        /**
                         * @type {HttpViewEngine|*}
                         */
                        const engineInstance = new EngineCtor(context);
                        return engineInstance.render(viewPath, self.data, function(err, result) {
                            if (err) {
                                return callback(err);
                            }
                            else {
                                response.writeHead(200, {"Content-Type": self.contentType});
                                response.write(result, self.contentEncoding);
                                return callback();
                            }
                        });
                    }
                    catch(err) {
                        return callback(err);
                    }
                }
                else {
                    const err1 = new HttpNotFoundError();
                    if (context.request && context.request.url) {
                        err1.resource = context.request.url;
                    }
                    return callback(err1);
                }
            });
        });
    }
}

/**
 * @classdesc Provides methods that respond to HTTP requests that are made to a web application
 * @class
 * @constructor
 * @param {HttpContext} context - The executing HTTP context.
 * @property {HttpContext} context - Gets or sets the HTTP context associated with this controller
 * @property {string} name - Gets or sets the internal name for this controller
 * */
export class HttpController {
    constructor(context) {
        this.context = context;
    }

    /**
     * Creates a view result object for the given request.
     * @param {*=} data
     * @returns {Promise}
     */
    view(data) {
        return (new HttpViewResult(null, data)).toPromise();
    }

    forbidden(callback) {
        callback(new HttpForbiddenError());
    }
    /**
     * Creates a view result object for the given request.
     * @param {*=} data
     * @returns HttpViewResult
     * */
    html(data) {
        return new HttpViewResult(null, data);
    }

    /**
     * Creates a view result object for the given request.
     * @param {*=} data
     * @returns HttpViewResult
     * */
    htm(data) {
        return new HttpViewResult(null, data);
    }

    /**
     * Creates a view result object for the given request.
     * @param {String=} data
     * @returns HttpJavascriptResult
     * */
    js(data) {
        return new HttpJavascriptResult(data);
    }

    /**
     * Creates a view result object that represents a client javascript object.
     * This result may be used for sharing specific objects stored in memory or server filesystem
     * e.g. serve a *.json file as a client variable with name window.myVar1 or
     * serve user settings object ({ culture: 'en-US', notifyMe: false}) as a variable with name window.settings
     * @param {String} name
     * @param {String|*} obj
     * @returns HttpAnyResult
     * */
    jsvar(name, obj) {
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
    }

    /**
     * Invokes a default action and returns an HttpViewResult instance
     * @returns {Promise}
     */
    action() {
        return this.view();
    }

    /**
     * Creates a content result object by using a string.
     * @returns HttpContentResult
     * */
    content(content) {
        return new HttpContentResult(content);
    }

    /**
     * Creates a JSON result object by using the specified data.
     * @returns HttpJsonResult
     * */
    json(data) {
        return new HttpJsonResult(data);
    }

    /**
     * Creates a XML result object by using the specified data.
     * @returns HttpXmlResult
     * */
    xml(data) {
        return new HttpXmlResult(data);
    }

    /**
     * Creates a binary file result object by using the specified path.
     * @param {string}  physicalPath
     * @param {string=}  fileName
     * @returns {HttpFileResult|HttpAnyResult}
     * */
    file(physicalPath, fileName) {
        return new HttpFileResult(physicalPath, fileName);
    }

    /**
     * Creates a redirect result object that redirects to the specified URL.
     * @returns HttpRedirectResult
     * */
    redirect(url) {
        return new HttpRedirectResult(url);
    }

    /**
     * Creates an empty result object.
     * @returns HttpEmptyResult
     * */
    empty() {
        return new HttpEmptyResult();
    }
}

/**
 * Creates a view result object for the given request.
 * @param {*=} data
 * @returns HttpViewResult
 * */
HttpController.prototype.htm = HttpController.prototype.html;

/**
 * Encapsulates information that is related to rendering a view.
 * @class
 * @param {HttpContext} context
 * @property {DataModel} model
 * @property {HtmlViewHelper} html
 * @constructor
 * @augments {EventEmitter}
 */
export class HttpViewContext {
    constructor(context) {
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

        let writer = null;
        Object.defineProperty(this, 'writer', {
            get:function() {
                if (writer)
                    return writer;
                writer = new HtmlWriter();
                writer.indent = false;
                return writer;
            }, configurable:false, enumerable:false
        });

        const self = this;
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

    /**
     * @param {string} url
     * @returns {Promise}
     */
    render(url) {
        //get response cookie, if any
        let requestCookie = this.context.response.getHeader('set-cookie');
        if (typeof this.context.request.headers.cookie !== 'undefined')
            requestCookie = this.context.request.headers.cookie;
        return this.context.getApplication().executeRequest({ url: url, cookie: requestCookie }).then((result)=> {
            if ((result.statusCode>=200) && (result.statusCode<300))
                return Q(result.body);
            else
                return Q.reject(new HttpError(result.statusCode));
        });
    }

    init() {
        //
    }

    /**
     *
     * @param {String} s
     * @param {String=} lib
     * @returns {String}
     */
    translate(s, lib) {
        return this.context.translate(s, lib);
    }

    /**
     * @param {HttpViewContext} $view
     * @returns {*}
     * @private
     */
    static HtmlViewHelper($view) {
        let doc;
        return {
            antiforgery: function() {
            //create token
                const context = $view.context, value = context.application.encrypt(JSON.stringify({ id: Math.floor(Math.random() * 1000000), url:context.request.url, date:new Date() }));
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
                const context = $view.context, c= context.getCulture();
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
}

/**
 * @classdesc A helper class for an instance of HttpViewContext class
 * @class
 * @property {HttpViewContext} parent - The parent HTTP View Context
 * @property {HTMLDocument|*} document - The in-process HTML Document
 */
export class HtmlViewHelper {
    /**
     * @constructor
     * @param {HttpViewContext} view
     */
    constructor(view) {
        let document;
        const self = this;
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

    antiforgery() {
        const $view = this.parent;
        //create token
        const context = $view.context, value = context.application.encrypt(JSON.stringify({ id: Math.floor(Math.random() * 1000000), url:context.request.url, date:new Date() }));
        //try to set cookie
        context.response.setHeader('Set-Cookie','.CSRF='.concat(value));
        return $view.writer.writeAttribute('type', 'hidden')
            .writeAttribute('id', '_CSRFToken')
            .writeAttribute('name', '_CSRFToken')
            .writeAttribute('value', value)
            .writeFullBeginTag('input')
            .toString();
    }

    element(obj) {
        return this.document.parentWindow.angular.element(obj);
    }

    lang() {
        const $view = this.parent;
        const context = $view.context, c= context.getCulture();
        if (typeof c === 'string') {
            if (c.length>=2) {
                return c.toLowerCase().substring(0,2);
            }
        }
        //in all cases return default culture
        return 'en';
    }
}




