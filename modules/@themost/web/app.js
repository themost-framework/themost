/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var HttpError = require('@themost/common/errors').HttpError;
var HttpServerError = require('@themost/common/errors').HttpServerError;
var HttpNotFoundError = require('@themost/common/errors').HttpNotFoundError;
var Args = require('@themost/common/utils').Args;
var TraceUtils = require('@themost/common/utils').TraceUtils;
var sprintf = require('sprintf').sprintf;
var _ = require('lodash');
var mvc = require('./mvc');
var LangUtils = require('@themost/common/utils').LangUtils;
var path = require("path");
var fs = require("fs");
var url = require('url');
var http = require('http');
var SequentialEventEmitter = require('@themost/common/emitter').SequentialEventEmitter;
var DataConfigurationStrategy = require('@themost/data/data-configuration').DataConfigurationStrategy;
var querystring = require('querystring');
var crypto = require('crypto');
var Symbol = require('symbol');
var HttpHandler = require('./types').HttpHandler;
var AuthStrategy = require('./handlers/auth').AuthStrategy;
var DefaultAuthStrategy = require('./handlers/auth').DefaultAuthStrategy;
var EncryptionStrategy = require('./handlers/auth').EncryptionStrategy;
var DefaultEncryptionStrategy = require('./handlers/auth').DefaultEncryptionStrategy;
var CacheStrategy = require('./cache').CacheStrategy;
var DefaultCacheStrategy = require('./cache').DefaultCacheStrategy;
var LocalizationStrategy = require('./localization').LocalizationStrategy;
var DefaulLocalizationStrategy = require('./localization').DefaultLocalizationStrategy;
var HttpConfiguration = require('./config').HttpConfiguration;
var HttpApplicationService = require('./types').HttpApplicationService;
var HttpContext = require('./context').HttpContext;
var StaticHandler = require('./handlers/static').StaticHandler;

var executionPathProperty = Symbol('executionPath');
var configPathProperty = Symbol('configPath');
var configProperty = Symbol('config');
var currentProperty = Symbol('current');
var servicesProperty = Symbol('services');

/**
 * @classdesc ApplicationOptions class describes the startup options of a MOST Web Framework application.
 * @class
 * @constructor
 * @property {number} port - The HTTP binding port number.
 * The default value is either PORT environment variable or 3000.
 * @property {string} bind - The HTTP binding ip address or hostname.
 * The default value is either IP environment variable or 127.0.0.1.
 * @property {number|string} cluster - A number which represents the number of clustered applications.
 * The default value is zero (no clustering). If cluster is 'auto' then the number of clustered applications
 * depends on hardware capabilities (number of CPUs).
 @example
 //load module
 var web = require("most-web");
 //start server
 web.current.start({ port:80, bind:"0.0.0.0",cluster:'auto' });
 @example
 //Environment variables already set: IP=198.51.100.0 PORT=80
 var web = require("most-web");
 web.current.start();
 */
// eslint-disable-next-line no-unused-vars
function ApplicationOptions() {

}

/**
 * Abstract class that represents a data context
 * @constructor
 */
function HttpDataContext() {
    //
}
/**
 * @returns {DataAdapter}
 */
HttpDataContext.prototype.db = function () {
    return null;
};

/**
 * @param {string} name
 * @returns {DataModel}
 */
// eslint-disable-next-line no-unused-vars
HttpDataContext.prototype.model = function (name) {
    return null;
};

/**
 * @param {string} type
 * @returns {*}
 */
// eslint-disable-next-line no-unused-vars
HttpDataContext.prototype.dataTypes = function (type) {
    return null;
};

/**
 *
 * @param {HttpApplication} app
 * @constructor
 */
function HttpContextProvider(app) {
    HttpContextProvider.super_.bind(this)(app);
}
LangUtils.inherits(HttpContextProvider,HttpApplicationService);
/**
 * @returns {HttpContext}
 */
HttpContextProvider.prototype.create = function(req,res) {
    var context = new HttpContext(req,res);
    //set context application
    context.application = this.getApplication();
    return context;
};
/**
 * @class
 * @constructor
 * @param {string=} executionPath
 * @augments SequentialEventEmitter
 * @augments IApplication
 */
function HttpApplication(executionPath) {

    //Sets the current execution path
    this[executionPathProperty] = _.isNil(executionPath) ? path.join(process.cwd()) : path.resolve(executionPath);
    //Gets the current application configuration path
    this[configPathProperty] = _.isNil(executionPath) ? path.join(process.cwd(), 'config') : path.resolve(executionPath, 'config');
    //initialize services
    this[servicesProperty] = { };
    //set configuration
    this[configProperty] = new HttpConfiguration(this[configPathProperty]);
    /**
     * Gets or sets a collection of application handlers
     * @type {Array}
     */
    this.handlers = [];
    var self = this;
    //initialize handlers collection
    var configurationHandlers = this.getConfiguration().handlers;
    var defaultHandlers = require('./resources/app.json').handlers;
    for (var i = 0; i < defaultHandlers.length; i++) {
        (function(item) {
            if (typeof configurationHandlers.filter(function(x) { return x.name === item.name; })[0] === 'undefined') {
                configurationHandlers.push(item);
            }
        })(defaultHandlers[i]);
    }
    var reModule = /^@themost\/web\//i;
    _.forEach(configurationHandlers, function (handlerConfiguration) {
        try {
            var handlerPath = handlerConfiguration.type;
            if (reModule.test(handlerPath)) {
                handlerPath = handlerPath.replace(reModule,'./');
            }
            else if (/^\//.test(handlerPath)) {
                handlerPath = self.mapPath(handlerPath);
            }
            var handlerModule = require(handlerPath), handler = null;
            if (handlerModule) {
                //if module exports a constructor
                if (typeof handlerModule === 'function') {
                    self.handlers.push(new handlerModule());
                }
                //else if module exports a method called createInstance()
                else if (typeof handlerModule.createInstance === 'function') {
                    //call createInstance
                    handler = handlerModule.createInstance();
                    if (handler) {
                        self.handlers.push(handler);
                    }
                }
                else {
                    TraceUtils.log('The specified handler (%s) cannot be instantiated. The module does not export a class constructor or createInstance() function.', handlerConfiguration.name);
                }
            }
        }
        catch (err) {
            throw new Error(sprintf('The specified handler (%s) cannot be loaded. %s', handlerConfiguration.name, err.message));
        }
    });
    //set default context provider
    self.useService(HttpContextProvider);
    //set authentication strategy
    self.useStrategy(AuthStrategy, DefaultAuthStrategy);
    //set cache strategy
    self.useStrategy(CacheStrategy, DefaultCacheStrategy);
    //set encryption strategy
    self.useStrategy(EncryptionStrategy, DefaultEncryptionStrategy);
    //set localization strategy
    self.useStrategy(LocalizationStrategy, DefaulLocalizationStrategy);
    //set authentication strategy
    self.getConfiguration().useStrategy(DataConfigurationStrategy, DataConfigurationStrategy);
    /**
     * Gets or sets a boolean that indicates whether the application is in development mode
     * @type {string}
     */
    this.development = (process.env.NODE_ENV === 'development');
    /**
     *
     * @type {{html, text, json, unauthorized}|*}
     */
    this.errors = httpApplicationErrors(this);

}
LangUtils.inherits(HttpApplication, SequentialEventEmitter);

/**
 * @returns {HttpApplication}
 */
HttpApplication.getCurrent = function() {
    if (typeof HttpApplication[currentProperty] === 'object') {
        return HttpApplication[currentProperty];
    }
    HttpApplication[currentProperty] = new HttpApplication();
    return HttpApplication[currentProperty];
};
/**
 * @returns {HttpConfiguration}
 */
HttpApplication.prototype.getConfiguration = function() {
    return this[configProperty];
};

/**
 * @returns {EncryptionStrategy}
 */
HttpApplication.prototype.getEncryptionStrategy = function() {
    return this.getStrategy(EncryptionStrategy);
};

/**
 * @returns {AuthStrategy}
 */
HttpApplication.prototype.getAuthStrategy = function() {
    return this.getStrategy(AuthStrategy);
};

/**
 * @returns {LocalizationStrategy}
 */
HttpApplication.prototype.getLocalizationStrategy = function() {
    return this.getStrategy(LocalizationStrategy);
};


HttpApplication.prototype.getExecutionPath = function() {
    return this[executionPathProperty];
};

/**
 * Resolves the given path
 * @param {string} arg
 */
HttpApplication.prototype.mapExecutionPath = function(arg) {
    Args.check(_.isString(arg),'Path must be a string');
    return path.resolve(this.getExecutionPath(), arg);
};

/**
 * Sets static content root directory
 * @param {string} rootDir
 */
HttpApplication.prototype.useStaticContent = function(rootDir) {
    /**
     * @type {StaticHandler}
     */
    var staticHandler = _.find(this.handlers, function(x) {
       return x.constructor === StaticHandler;
    });
    if (typeof staticHandler === 'undefined') {
        throw new Error('An instance of StaticHandler class cannot be found in application handlers');
    }
    staticHandler.rootDir = rootDir;
    return this;
};


HttpApplication.prototype.getConfigurationPath = function() {
    return this[configPathProperty];
};

/**
 * Initializes application configuration.
 * @return {HttpApplication}
 */
HttpApplication.prototype.init = function () {

    //initialize basic directives collection
    var directives = require("./angular/directives");
    directives.apply(this);
    return this;
};

/**
 * Returns the path of a physical file based on a given URL.
 * @param {string} s
 */
HttpApplication.prototype.mapPath = function (s) {
    var uri = url.parse(s).pathname;
    return path.join(this[executionPathProperty], uri);
};

/**
 * Converts an application URL into one that is usable on the requesting client. A valid application relative URL always start with "~/".
 * If the relativeUrl parameter contains an absolute URL, the URL is returned unchanged.
 * Note: An HTTP application base path may be set in settings/app/base configuration section. The default value is "/".
 * @param {string} appRelativeUrl - A string which represents an application relative URL like ~/login
 */
HttpApplication.prototype.resolveUrl = function (appRelativeUrl) {
    if (/^~\//.test(appRelativeUrl)) {
        var base = this.getConfiguration().getSourceAt("settings/app/base") || "/";
        base += /\/$/.test(base) ? '' : '/';
        return appRelativeUrl.replace(/^~\//, base);
    }
    return appRelativeUrl;
};

/**
 * Resolves ETag header for the given file. If the specified does not exist or is invalid returns null.
 * @param {string=} file - A string that represents the file we want to query
 * @param {function(Error,string=)} callback
 */
HttpApplication.prototype.resolveETag = function(file, callback) {
    fs.exists(file, function(exists) {
        try {
            if (exists) {
                fs.stat(file, function(err, stats) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        if (!stats.isFile()) {
                            callback(null);
                        }
                        else {
                            //validate if-none-match
                            var md5 = crypto.createHash('md5');
                            md5.update(stats.mtime.toString());
                            var result = md5.digest('base64');
                            callback(null, result);

                        }
                    }
                });
            }
            else {
                callback(null);
            }
        }
        catch (e) {
            callback(null);
        }
    });
};
// noinspection JSUnusedGlobalSymbols
/**
 * @param {HttpContext} context
 * @param {string} executionPath
 * @param {function(Error, Boolean)} callback
 */
HttpApplication.prototype.unmodifiedRequest = function(context, executionPath, callback) {
    try {
        var requestETag = context.request.headers['if-none-match'];
        if (typeof requestETag === 'undefined' || requestETag == null) {
            callback(null, false);
            return;
        }
        HttpApplication.prototype.resolveETag(executionPath, function(err, result) {
            callback(null, (requestETag===result));
        });
    }
    catch (err) {
        TraceUtils.error(err);
        callback(null, false);
    }
};

/**
 * @param request {string|IncomingMessage}
 * @returns {*}
 * */
HttpApplication.prototype.resolveMime = function (request) {
    var extensionName;
    if (typeof request=== 'string') {
        //get file extension
        extensionName = path.extname(request);
    }
    else if (typeof request=== 'object') {
        //get file extension
        extensionName = path.extname(request.url);
    }
    else {
        return;
    }
    return _.find(this.getConfiguration().mimes, function(x) {
        return (x.extension === extensionName);
    });
};



/**
 *
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpApplication.prototype.processRequest = function (context, callback) {
    var self = this;
    if (typeof context === 'undefined' || context == null) {
        callback.call(self);
    }
    else {
        //1. beginRequest
        context.emit('beginRequest', context, function (err) {
            if (err) {
                callback.call(context, err);
            }
            else {
                //2. validateRequest
                context.emit('validateRequest', context, function (err) {
                    if (err) {
                        callback.call(context, err);
                    }
                    else {
                        //3. authenticateRequest
                        context.emit('authenticateRequest', context, function (err) {
                            if (err) {
                                callback.call(context, err);
                            }
                            else {
                                //4. authorizeRequest
                                context.emit('authorizeRequest', context, function (err) {
                                    if (err) {
                                        callback.call(context, err);
                                    }
                                    else {
                                        //5. mapRequest
                                        context.emit('mapRequest', context, function (err) {
                                            if (err) {
                                                callback.call(context, err);
                                            }
                                            else {
                                                //5b. postMapRequest
                                                context.emit('postMapRequest', context, function(err) {
                                                    if (err) {
                                                        callback.call(context, err);
                                                    }
                                                    else {
                                                        //process HEAD request
                                                        if (context.request.method==='HEAD') {
                                                            //7. endRequest
                                                            context.emit('endRequest', context, function (err) {
                                                                callback.call(context, err);
                                                            });
                                                        }
                                                        else {
                                                            //6. processRequest
                                                            if (context.request.currentHandler != null)
                                                                context.request.currentHandler.processRequest(context, function (err) {
                                                                    if (err) {
                                                                        callback.call(context, err);
                                                                    }
                                                                    else {
                                                                        //7. endRequest
                                                                        context.emit('endRequest', context, function (err) {
                                                                            callback.call(context, err);
                                                                        });
                                                                    }
                                                                });
                                                            else {
                                                                var er = new HttpNotFoundError();
                                                                if (context.request && context.request.url) {
                                                                    er.resource = context.request.url;
                                                                }
                                                                callback.call(context, er);
                                                            }
                                                        }

                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
};

/**
 * Gets the default data context based on the current configuration
 * @returns {DataAdapter}
 */
HttpApplication.prototype.db = function () {
    if ((this.config.adapters === null) || (this.config.adapters.length === 0))
        throw new Error('Data adapters configuration settings are missing or cannot be accessed.');
    var adapter = null;
    if (this.config.adapters.length === 1) {
        //there is only one adapter so try to instantiate it
        adapter = this.config.adapters[0];
    }
    else {
        adapter = _.find(this.config.adapters,function (x) {
            return x.default;
        });
    }
    if (adapter === null)
        throw new Error('There is no default data adapter or the configuration is incorrect.');
    //try to instantiate adapter
    if (!adapter.invariantName)
        throw new Error('The default data adapter has no invariant name.');
    var adapterType = this.config.adapterTypes[adapter.invariantName];
    if (adapterType == null)
        throw new Error('The default data adapter type cannot be found.');
    if (typeof adapterType.createInstance === 'function') {
        return adapterType.createInstance(adapter.options);
    }
    else if (adapterType.require) {
        var m = require(adapterType.require);
        if (typeof m.createInstance === 'function') {
            return m.createInstance(adapter.options);
        }
        throw new Error('The default data adapter cannot be instantiated. The module provided does not export a function called createInstance().')
    }
};

/**
 * @returns {HttpContextProvider}
 */
HttpApplication.prototype.getContextProvider = function() {
    return this.getService(HttpContextProvider);
};


/**
 * Creates an instance of HttpContext class.
 * @param {ClientRequest} request
 * @param {ServerResponse} response
 * @returns {HttpContext}
 */
HttpApplication.prototype.createContext = function (request, response) {
    var context = this.getContextProvider().create(request, response);
    //set context application
    context.application = this;
    //set handler events
    for (var i = 0; i < HttpHandler.Events.length; i++) {
        var eventName = HttpHandler.Events[i];
        for (var j = 0; j < this.handlers.length; j++) {
            var handler = this.handlers[j];
            if (typeof handler[eventName] === 'function') {
                context.on(eventName, handler[eventName].bind(handler));
            }
        }
    }
    return context;
};
/**
 * @param {*} options
 * @param {*} data
 * @param {Function} callback
 */
HttpApplication.prototype.executeExternalRequest = function(options,data, callback) {
    //make request
    var https = require('https'),
        opts = (typeof options==='string') ? url.parse(options) : options,
        httpModule = (opts.protocol === 'https:') ? https : http;
    var req = httpModule.request(opts, function(res) {
        res.setEncoding('utf8');
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function(){
            var result = {
                statusCode: res.statusCode,
                headers: res.headers,
                body:data,
                encoding:'utf8'
            };
            /**
             * destroy sockets (manually close an unused socket) ?
             */
            callback(null, result);
        });
    });
    req.on('error', function(e) {
        //return error
        callback(e);
    });
    if(data)
    {
        if (typeof data ==="object" )
            req.write(JSON.stringify(data));
        else
            req.write(data.toString());
    }
    req.end();
};

/**
 * Executes an internal process
 * @param {Function(HttpContext)} fn
 */
HttpApplication.prototype.execute = function (fn) {
    var request = createRequestInternal.call(this);
    fn.call(this, this.createContext(request, createResponseInternal.call(this,request)));
};

/**
 * Executes an unattended internal process
 * @param {Function} fn
 */
HttpApplication.prototype.unattended = function (fn) {
    //create context
    var request = createRequestInternal.call(this), context =  this.createContext(request, createResponseInternal.call(this,request));
    //get unattended account
    var account = this.getAuthStrategy().getUnattendedExecutionAccount();
    //set unattended execution account
    if (typeof account !== 'undefined' || account!==null) {
        context.user = { name: account, authenticationType: 'Basic'};
    }
    //execute internal process
    fn.call(this, context);
};

/**
 * Load application extension
 */
HttpApplication.prototype.extend = function (extension) {
    if (typeof extension === 'undefined')
    {
        //register all application extensions
        var extensionFolder = this.mapPath('/extensions');
        if (fs.existsSync(extensionFolder)) {
            var arr = fs.readdirSync(extensionFolder);
            for (var i = 0; i < arr.length; i++) {
                if (path.extname(arr[i])==='.js')
                    require(path.join(extensionFolder, arr[i]));
            }
        }
    }
    else {
        //register the specified extension
        if (typeof extension === 'string') {
            var extensionPath = this.mapPath(sprintf('/extensions/%s.js', extension));
            if (fs.existsSync(extensionPath)) {
                //load extension
                require(extensionPath);
            }
        }
    }
    return this;
};

/**
 *
 * @param {*|string} options
 * @param {Function} callback
 */
HttpApplication.prototype.executeRequest = function (options, callback) {
    var opts = { };
    if (typeof options === 'string') {
        _.assign(opts, { url:options });
    }
    else {
        _.assign(opts, options);
    }
    var request = createRequestInternal.call(this,opts),
        response = createResponseInternal.call(this,request);
    if (!opts.url) {
        callback(new Error('Internal request url cannot be empty at this context.'));
        return;
    }
    if (opts.url.indexOf('/') !== 0)
    {
        var uri = url.parse(opts.url);
        opts.host = uri.host;
        opts.hostname = uri.hostname;
        opts.path = uri.path;
        opts.port = uri.port;
        //execute external request
        this.executeExternalRequest(opts,null, callback);
    }
    else {
        //todo::set cookie header (for internal requests)
        /*
        IMPORTANT: set response Content-Length to -1 in order to force the default HTTP response format.
        if the content length is unknown (server response does not have this header)
        in earlier version of node.js <0.11.9 the response contains by default a hexadecimal number that
        represents the content length. This number appears exactly after response headers and before response body.
        If the content length is defined the operation omits this hexadecimal value
        e.g. the wrong or custom formatted response
        HTTP 1.1 Status OK
        Content-Type: text/html
        ...
        Connection: keep-alive

        6b8

        <html><body>
        ...
        </body></html>
        e.g. the standard format
         HTTP 1.1 Status OK
         Content-Type: text/html
         ...
         Connection: keep-alive


         <html><body>
         ...
         </body></html>
        */
        response.setHeader('Content-Length',-1);
        handleRequestInternal.call(this, request, response, function(err) {
            if (err) {
                callback(err);
            }
            else {
                try {
                    //get statusCode
                    var statusCode = response.statusCode;
                    //get headers
                    var headers = {};
                    if (response._header) {
                        var arr = response._header.split('\r\n');
                        for (var i = 0; i < arr.length; i++) {
                            var header = arr[i];
                            if (header) {
                                var k = header.indexOf(':');
                                if (k>0) {
                                    headers[header.substr(0,k)] = header.substr(k+1);
                                }
                            }
                        }
                    }
                    //get body
                    var body = null;
                    var encoding = null;
                    if (_.isArray(response.output)) {
                        if (response.output.length>0) {
                            body = response.output[0].substr(response._header.length);
                            encoding = response.outputEncodings[0];
                        }
                    }
                    //build result (something like ServerResponse)
                    var result = {
                        statusCode: statusCode,
                        headers: headers,
                        body:body,
                        encoding:encoding
                    };
                    callback(null, result);
                }
                catch (e) {
                    callback(e);
                }
            }
        });
    }
};

/**
 * @private
 * @this HttpApplication
 * @param {ClientRequest} request
 * @param {ServerResponse} response
 * @param callback
 */
function handleRequestInternal(request, response, callback)
{
    var self = this, context = self.createContext(request, response);
    //add query string
    if (request.url.indexOf('?') > 0)
        _.assign(context.params, querystring.parse(request.url.substring(request.url.indexOf('?') + 1)));
    //add form
    if (request.form)
        _.assign(context.params, request.form);
    //add files
    if (request.files)
        _.assign(context.params, request.files);

    self.processRequest(context, function (err) {
        if (err) {
            if (self.listeners('error').length === 0) {
                self.onError(context, err, function () {
                    response.end();
                    callback();
                });
            }
            else {
                //raise application error event
                self.emit('error', { context:context, error:err } , function () {
                    response.end();
                    callback();
                });
            }
        }
        else {
            context.finalize(function() {
                response.end();
                callback();
            });
        }
    });
}
/**
 * @private
 * @param {*} options
 */
function createRequestInternal(options) {
    var opt = options ? options : {};
    var request = new http.IncomingMessage();
    request.method = (opt.method) ? opt.method : 'GET';
    request.url = (opt.url) ? opt.url : '/';
    request.httpVersion = '1.1';
    request.headers = (opt.headers) ? opt.headers : {
        host: 'localhost',
        'user-agent': 'Mozilla/5.0 (X11; Linux i686; rv:10.0) Gecko/20100101 Firefox/22.0',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en,en-US;q=0.5',
        'accept-encoding': 'gzip, deflate',
        connection: 'keep-alive',
        'cache-control': 'max-age=0' };
    if (opt.cookie)
        request.headers.cookie = opt.cookie;
    request.cookies = (opt.cookies) ? opt.cookies : {};
    request.session = (opt.session) ? opt.session : {};
    request.params = (opt.params) ? opt.params : {};
    request.query = (opt.query) ? opt.query : {};
    request.form = (opt.form) ? opt.form : {};
    request.body = (opt.body) ? opt.body : {};
    request.files = (opt.files) ? opt.files : {};
    return request;
}

/**
 * Creates a mock-up server response
 * @param {ClientRequest} req
 * @returns {ServerResponse|*}
 * @private
 */
function createResponseInternal(req) {
    return new http.ServerResponse(req);
}

/**
 *
 * @param {HttpContext} context
 * @param {Error|*} err
 * @param {function(Error=)} callback
 * @private
 */
function onHtmlError(context, err, callback) {
    try {
        if (_.isNil(context)) {
            callback(err);
            return;
        }
        var request = context.request, response = context.response, ejs = require('ejs');
        if (_.isNil(request) || _.isNil(response)) {
            callback(err);
            return;
        }
        //HTML custom errors
        fs.readFile(path.join(__dirname, './http-error.html.ejs'), 'utf8', function (readErr, data) {
            if (readErr) {
                //log process error
                TraceUtils.log(readErr);
                //continue error execution
                callback(err);
                return;
            }
            //compile data
            var str;
            try {
                if (err instanceof HttpError) {
                    str = ejs.render(data, { error:err });
                }
                else {
                    var httpErr = new HttpError(500, null, err.message);
                    httpErr.stack = err.stack;
                    str = ejs.render(data, {error: httpErr});
                }
            }
            catch (e) {
                TraceUtils.log(e);
                //continue error execution
                callback(err);
                return;
            }
            //write status header
            response.writeHead(err.statusCode || 500 , { "Content-Type": "text/html" });
            response.write(str);
            response.end();
            callback();
        });
    }
    catch (e) {
        //log process error
        TraceUtils.log(e);
        //and continue execution
        callback(err);
    }

}

/**
 *
 * @param {HttpContext} context
 * @param {Error|HttpError} err
 * @param {Function} callback
 */
HttpApplication.prototype.onError = function (context, err, callback) {
    callback = callback || function () { };
    try {

        if (_.isNil(err)) {
            return callback.bind(this)();
        }
        //always log error
        TraceUtils.log(err);
        //get response object
        var response = context.response;
        if (_.isNil(response)) {
            return callback.bind(this)();
        }
        if (response._headerSent) {
            return callback.bind(this)();
        }
        onHtmlError(context, err, function(err) {
            if (err) {
                //send plain text
                response.writeHead(err.statusCode || 500, {"Content-Type": "text/plain"});
                //if error is an HTTP Exception
                if (err instanceof HttpError) {
                    response.write(err.statusCode + ' ' + err.message + "\n");
                }
                else {
                    //otherwise send status 500
                    response.write('500 ' + err.message + "\n");
                }
                //send extra data (on development)
                if (process.env.NODE_ENV === 'development') {
                    if (!_.isEmpty(err.innerMessage)) {
                        response.write(err.innerMessage + "\n");
                    }
                    if (!_.isEmpty(err.stack)) {
                        response.write(err.stack + "\n");
                    }
                }
            }
            return callback.bind(this)();
        });
    }
    catch (err) {
        TraceUtils.log(err);
        if (context.response) {
            context.response.writeHead(500, {"Content-Type": "text/plain"});
            context.response.write("500 Internal Server Error");
            return callback.bind(this)();
        }
    }
};
/**
 * @private
 * @type {string}
 */
var HTTP_SERVER_DEFAULT_BIND = '127.0.0.1';
/**
 * @private
 * @type {number}
 */
var HTTP_SERVER_DEFAULT_PORT = 3000;

/**
 * @private
 * @param {Function=} callback
 * @param {ApplicationOptions|*} options
 */
function startInternal(options, callback) {
    var self = this;
    callback = callback || function() { };
    try {
        //validate options

        if (self.config === null)
            self.init();
        /**
         * @memberof process.env
         * @property {number} PORT
         * @property {string} IP
         * @property {string} NODE_ENV
         */
        var opts = {
            bind:(process.env.IP || HTTP_SERVER_DEFAULT_BIND),
            port:(process.env.PORT ? process.env.PORT: HTTP_SERVER_DEFAULT_PORT)
        };
        //extend options
        _.assign(opts, options);

        var server_ = http.createServer(function (request, response) {
            var context = self.createContext(request, response);
            //begin request processing
            self.processRequest(context, function (err) {
                if (err) {
                    //handle context error event
                    if (context.listeners('error').length>0) {
                        return context.emit('error', { error:err }, function() {
                            context.finalize(function() {
                                if (context.response) { context.response.end(); }
                            });
                        });
                    }
                    if (self.listeners('error').length === 0) {
                        self.onError(context, err, function () {
                            if (_.isNil(context)) { return; }
                            context.finalize(function() {
                                if (context.response) { context.response.end(); }
                            });
                        });
                    }
                    else {
                        //raise application error event
                        self.emit('error', { context:context, error:err }, function() {
                            if (typeof context === 'undefined' || context === null) { return; }
                            context.finalize(function() {
                                if (context.response) { context.response.end(); }
                            });
                        });
                    }
                }
                else {
                    if (_.isNil(context)) { return; }
                    context.finalize(function() {
                        if (context.response) { context.response.end(); }
                    });
                }
            });
        });
        /**
         * @name HttpApplication#getServer
         * @type {Function}
         * @returns {Server|*}
         */
        self.getServer = function() {
            return server_;
        };

        //start listening
        server_.listen(opts.port, opts.bind);
        TraceUtils.log('Web application is running at http://%s:%s/', opts.bind, opts.port);
        //do callback
        callback.call(self);
    } catch (err) {
        TraceUtils.error(err);
    }
}

/**
 * @param {ApplicationOptions|*=} options
 * @param {Function=} callback
 */
HttpApplication.prototype.start = function (options, callback) {
    callback = callback || function() { };
    options = options || { };
    if (options.cluster) {
        var clusters = 1;
        //check if options.cluster="auto"
        if (/^auto$/i.test(options.cluster)) {
            clusters = require('os').cpus().length;
        }
        else {
            //get cluster number
            clusters = LangUtils.parseInt(options.cluster);
        }
        if (clusters>1) {
            var cluster = require('cluster');
            if (cluster.isMaster) {
                //get debug argument (if any)
                var debug = process.execArgv.filter(function(x) { return /^--debug(-brk)?=\d+$/.test(x); })[0], debugPort;
                if (debug) {
                    //get debug port
                    debugPort = parseInt(/^--debug(-brk)?=(\d+)$/.exec(debug)[2]);
                    cluster.setupMaster({
                        execArgv: process.execArgv.filter(function(x) { return !/^--debug(-brk)?=\d+$/.test(x); })
                    });
                }
                for (var i = 0; i < clusters; i++) {
                    if (debug) {
                        if (/^--debug-brk=/.test(debug))
                            cluster.settings.execArgv.push('--debug-brk=' + (debugPort + i));
                        else
                            cluster.settings.execArgv.push('--debug=' + (debugPort + i));
                    }
                    cluster.fork();
                    if (debug) cluster.settings.execArgv.pop();
                }
            } else {
                startInternal.bind(this)(options, callback);
            }
        }
        else {
            startInternal.bind(this)(options, callback);
        }
    }
    else {
        startInternal.bind(this)(options, callback);
    }
};

/**
 * Registers HttpApplication as express framework middleware
 */
HttpApplication.prototype.runtime = function() {
    var self = this;

    function nextError(context, err) {
        //handle context error event
        if (context.listeners('error').length>0) {
            return context.emit('error', { error:err }, function() {
                context.finalize(function() {
                    if (context.response) { context.response.end(); }
                });
            });
        }
        if (self.listeners('error').length === 0) {
            self.onError(context, err, function () {
                if (_.isNil(context)) { return; }
                context.finalize(function() {
                    if (context.response) { context.response.end(); }
                });
            });
        }
        else {
            //raise application error event
            self.emit('error', { context:context, error:err }, function() {
                if (typeof context === 'undefined' || context === null) { return; }
                context.finalize(function() {
                    if (context.response) { context.response.end(); }
                });
            });
        }
    }

    return function runtimeParser(req, res, next) {
        //create context
        var context = self.createContext(req,res);
        context.request.on('close', function() {
            //finalize data context
            if (_.isObject(context)) {
                context.finalize(function() {
                    if (context.response) {
                        //if response is alive
                        if (context.response.finished === false) {
                            //end response
                            context.response.end();
                        }
                    }
                });
            }
        });
        //process request
        self.processRequest(context, function(err) {
            if (err) {
                if (typeof next === 'function') {
                    return context.finalize(function() {
                        return next(err);
                    });
                }
                return nextError(context, err);
            }
            return context.finalize(function() {
                context.response.end();
            });
        });
    };
};

/**
 * Registers an application controller
 * @param {string} name
 * @param {Function} controllerCtor
 * @returns HttpApplication
 */
HttpApplication.prototype.useController = function(name, controllerCtor) {
    Args.notString(name,"Controller Name");
    Args.notFunction(controllerCtor,"Controller constructor");
    //get application controllers or default
    var controllers = this.getConfiguration().getSourceAt('controllers') || { };
    //set application controller
    controllers[name] = controllerCtor;
    //apply changes
    this.getConfiguration().setSourceAt('controllers', controllers);
    return this;
};

/**
 * Registers an application strategy e.g. an singleton service which to be used in application contextr
 * @param {Function} serviceCtor
 * @param {Function} strategyCtor
 * @returns HttpApplication
 */
HttpApplication.prototype.useStrategy = function(serviceCtor, strategyCtor) {
    Args.notFunction(strategyCtor,"Service constructor");
    Args.notFunction(strategyCtor,"Strategy constructor");
    this[servicesProperty][serviceCtor.name] = new strategyCtor(this);
    return this;
};
/**
 * Register a service type in application services
 * @param {Function} serviceCtor
 * @returns HttpApplication
 */
HttpApplication.prototype.useService = function(serviceCtor) {
    Args.notFunction(serviceCtor,"Service constructor");
    this[servicesProperty][serviceCtor.name] = new serviceCtor(this);
    return this;
};

/**
 * @param {Function} serviceCtor
 * @returns {boolean}
 */
HttpApplication.prototype.hasStrategy = function(serviceCtor) {
    Args.notFunction(serviceCtor,"Service constructor");
    return this[servicesProperty].hasOwnProperty(serviceCtor.name);
};

/**
 * @param {Function} serviceCtor
 * @returns {boolean}
 */
HttpApplication.prototype.hasService = function(serviceCtor) {
    Args.notFunction(serviceCtor,"Service constructor");
    return this[servicesProperty].hasOwnProperty(serviceCtor.name);
};

/**
 * Gets an application strategy based on the given base service type
 * @param {Function} serviceCtor
 * @return {*}
 */
HttpApplication.prototype.getStrategy = function(serviceCtor) {
    Args.notFunction(serviceCtor,"Service constructor");
    return this[servicesProperty][serviceCtor.name];
};

/**
 * Gets an application service based on the given base service type
 * @param {Function} serviceCtor
 * @return {*}
 */
HttpApplication.prototype.getService = function(serviceCtor) {
    Args.notFunction(serviceCtor,"Service constructor");
    return this[servicesProperty][serviceCtor.name];
};

/**
 * @param {HttpApplication} application
 * @returns {{html: Function, text: Function, json: Function, unauthorized: Function}}
 * @private
 */
function httpApplicationErrors(application) {
    var self = application;
    return {
        html: function(context, error, callback) {
            callback = callback || function () { };
            if (_.isNil(error)) { return callback(); }
            onHtmlError(context, error, function(err) {
                callback.call(self, err);
            });
        },
        text: function(context, error, callback) {
            callback = callback || function () { };
            if (_.isNil(error)) { return callback(); }
            /**
             * @type {ServerResponse}
             */
            var response = context.response;
            if (error) {
                //send plain text
                response.writeHead(error.statusCode || 500, {"Content-Type": "text/plain"});
                //if error is an HTTP Exception
                if (error instanceof HttpError) {
                    response.write(error.statusCode + ' ' + error.message + "\n");
                }
                else {
                    //otherwise send status 500
                    response.write('500 ' + error.message + "\n");
                }
                //send extra data (on development)
                if (process.env.NODE_ENV === 'development') {
                    if (!_.isEmpty(error.innerMessage)) {
                        response.write(error.innerMessage + "\n");
                    }
                    if (!_.isEmpty(error.stack)) {
                        response.write(error.stack + "\n");
                    }
                }
            }
            return callback.bind(self)();
        },
        json: function(context, error, callback) {
            callback = callback || function () { };
            if (_.isNil(error)) { return callback(); }
            context.request.headers = context.request.headers || { };
            if (/application\/json/g.test(context.request.headers.accept) || (context.format === 'json')) {
                var result;
                if (error instanceof HttpError) {
                    result = new mvc.HttpJsonResult(error);
                    result.responseStatus = error.statusCode;
                }
                else if (process.env.NODE_ENV === 'development') {
                    result = new mvc.HttpJsonResult(error);
                    result.responseStatus = error.statusCode || 500;
                }
                else {
                    result = new mvc.HttpJsonResult(new HttpServerError());
                    result.responseStatus = 500;
                }
                //execute redirect result
                return result.execute(context, function(err) {
                    return callback.bind(self)(err);
                });
            }
            //go to next error if any
            callback.bind(self)(error);
        },
        unauthorized: function(context, error, callback) {
            callback = callback || function () { };
            if (_.isNil(error)) { return callback(); }
            if (_.isNil(context)) {
                return callback.call(self);
            }
            if (error.statusCode !== 401) {
                //go to next error if any
                return callback.call(self, error);
            }
            context.request.headers = context.request.headers || { };
            if (/text\/html/g.test(context.request.headers.accept)) {
                if (self.config.settings) {
                    if (self.config.settings.auth) {
                        //get login page from configuration
                        var page = self.config.settings.auth.loginPage || '/login.html';
                        //prepare redirect result
                        var result = new mvc.HttpRedirectResult(page.concat('?returnUrl=', encodeURIComponent(context.request.url)));
                        //execute redirect result
                        result.execute(context, function(err) {
                            callback.call(self, err);
                        });
                        return;
                    }
                }
            }
            //go to next error if any
            callback.bind(self)(error);
        }
    }
}

if (typeof exports !== 'undefined')
{
    module.exports.HttpApplication = HttpApplication;
    module.exports.HttpContextProvider = HttpContextProvider;
}
