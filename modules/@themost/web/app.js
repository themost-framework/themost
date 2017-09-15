/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';

var RandomUtils = require('@themost/common/utils').RandomUtils;
var Args = require('@themost/common/utils').Args;
var HttpHandler = require('./common').HttpHandler;
var HttpApplicationStrategy = require('./common').HttpApplicationStrategy;
var HttpError = require('@themost/common/errors').HttpError;
var HttpNotFoundError = require('@themost/common/errors').HttpNotFoundError;
var HttpServerError = require('@themost/common/errors').HttpServerError;
var TraceUtils = require('@themost/common/utils').TraceUtils;
var sprintf = require('sprintf').sprintf;
var _ = require('lodash');
var HttpJsonResult = require('./mvc').HttpJsonResult;
var HttpRedirectResult = require('./mvc').HttpRedirectResult;
var path = require("path");
var fs = require("fs");
var url = require('url');
var http = require('http');
var LangUtils = require('@themost/common/utils').LangUtils;
var SequentialEventEmitter = require('@themost/common/emitter').SequentialEventEmitter;
var querystring = require('querystring');
var crypto = require('crypto');
var ConfigurationBase = require('@themost/common/config').ConfigurationBase;
var DataConfigurationStrategy = require('@themost/data/config').DataConfigurationStrategy;
var HttpConfiguration = require('./config').HttpConfiguration;
var Symbol = require('symbol');
var DefaultEncryptionStrategy = require("./strategies/encyption").DefaultEncryptionStrategy;
var EncryptionStrategy = require("./strategies/encyption").EncryptionStrategy;
var configProperty = Symbol('config');
var executionPathProperty = Symbol('executionPath');
var configPathProperty = Symbol('configPath');
var strategiesProperty = Symbol('strategies');
var currentApplicationProperty = Symbol('currentApplication');
var DefaultAuthStrategy = require("./strategies/auth").DefaultAuthStrategy;
var AuthStrategy = require("./strategies/auth").AuthStrategy;

/**
 * @class
 * @constructor
 * @param {string} executionPath
 * @augments SequentialEventEmitter
 * @property {HttpConfiguration} config - Gets application configuration settings
 */
function HttpApplication(executionPath) {
    HttpApplication.super_.bind(this)();
    var self = this;
    /**
     * sets the current execution path
     */
    self[executionPathProperty] = _.isNil(executionPath) ? path.resolve(process.cwd()) : path.resolve(executionPath);
    /**
     * Gets the current application configuration path
     * @type {*}
     */
    self[configPathProperty] = path.resolve(self[executionPathProperty], 'config');
    self[configProperty] = new HttpConfiguration(self[configPathProperty]);
    self[configProperty].useStrategy(DataConfigurationStrategy, function() {
        return new DataConfigurationStrategy(self[configProperty]);
    });

    self[strategiesProperty] = { };

    //add default strategies
    this.useStrategy(EncryptionStrategy, DefaultEncryptionStrategy);
    this.useStrategy(AuthStrategy, DefaultAuthStrategy);

    Object.defineProperty(self, 'config', {
        get: function() {
            return this[configProperty];
        }, configurable:false, enumerable:false
    });
    ConfigurationBase.setCurrent(self.config);
    /**
     * Gets or sets a collection of application handlers
     * @type {Array}
     */
    this.handlers = [];

    //initialize angular server module
    var ng = require('./angular-server-module');
    /**
     * @type {AngularServerModule}
     */
    this.module = null;
    //init module
    ng.init(this);
    //register auth service
    self.module.service('$auth', function($context) {
        //ensure settings
        self.config.settings.auth = self.config.settings.auth || { };
        var providerPath = self.config.settings.auth.provider || './auth-service';
        //get auth provider
        if (providerPath.indexOf('/')===0)
            providerPath = self.mapPath(providerPath);
        var svc = require(providerPath);
        if (typeof svc.createInstance !== 'function')
            throw new Error('Invalid authentication provider module.');
        return svc.createInstance($context);
    });
    /**
     * @type {HttpCache}
     */
    var $cache;
    self.module.service('$cache', function() {
        try {
            return self.cache;
        }
        catch (e) {
            throw e;
        }
    });

    Object.defineProperty(self, 'cache', {
        get: function () {
            if (!_.isNil($cache))
                return $cache;
            var HttpCache = require( "./cache" );
            /**
             * @type {HttpCache|*}
             */
            $cache = new HttpCache();
            return $cache;
        },
        set: function(value) {
            $cache = value;
        },
        configurable: false,
        enumerable: false
    });
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

HttpApplication.prototype.getExecutionPath = function() {
    return this[executionPathProperty];
};

HttpApplication.prototype.getConfigurationPath = function() {
    return this[configPathProperty];
};

/**
 * @returns {HttpConfiguration}
 */
HttpApplication.prototype.getConfiguration = function() {
    return this[configProperty];
};

/**
 * Initializes application configuration.
 * @return {HttpApplication}
 */
HttpApplication.prototype.init = function () {

    /**
     * Gets or sets application configuration settings
     */
        //get node environment
    var env = process.env['NODE_ENV'] || 'production', str;
    //first of all try to load environment specific configuration
    try {
        TraceUtils.log(sprintf('Init: Loading environment specific configuration file (app.%s.json)', env));
        str = path.join(this.getConfigurationPath(), 'app.' + env + '.json');
        this.config = require(str);
        TraceUtils.log(sprintf('Init: Environment specific configuration file (app.%s.json) was succesfully loaded.', env));
    }
    catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
            TraceUtils.log(sprintf('Init: Environment specific configuration file (app.%s.json) is missing.', env));
            //try to load default configuration file
            try {
                TraceUtils.log('Init: Loading environment default configuration file (app.json)');
                str = path.join(this.getConfigurationPath(), 'app.json');
                this.config = require(str);
                TraceUtils.log('Init: Default configuration file (app.json) was succesfully loaded.');
            }
            catch (e) {
                if (e.code === 'MODULE_NOT_FOUND') {
                    TraceUtils.log('Init: An error occured while loading default configuration (app.json). Configuration cannot be found or is inaccesible.');
                    //load internal configuration file
                    this.config = require('./resources/app.json');
                    this.config.settings.crypto = {
                        "algorithm": "aes256",
                        "key": RandomUtils.randomHex(32)
                    };
                    TraceUtils.log('Init: Internal configuration file (app.json) was succesfully loaded.');
                }
                else {
                    TraceUtils.log('Init: An error occured while loading default configuration (app.json)');
                    throw e;
                }
            }
        }
        else {
            TraceUtils.log(sprintf('Init: An error occured while loading application specific configuration (app).', env));
            throw e;
        }
    }
    //load routes (if empty)
    if (_.isNil(this.config.routes)) {
        try {
            this.config.routes = require(path.resolve(this.getConfigurationPath(),'routes.json'));
        }
        catch(e) {
            if (e.code === 'MODULE_NOT_FOUND') {
                //load internal default route file
                TraceUtils.log('Init: Application specific routes configuration cannot be found. The default routes configuration will be loaded instead.');
                this.config.routes = require('./resources/routes.json');
            }
            else {
                TraceUtils.log('Init: An error occured while trying to load application routes configuration.');
                throw e;
            }
        }
    }
    //load data types (if empty)
    if (_.isNil(this.config.dataTypes))
    {
        try {
            var dataConfiguration = new DataConfiguration(this[configPathProperty]);
            this.config.dataTypes = dataConfiguration.dataTypes;
        }
        catch(e) {
            TraceUtils.log('Init: An error occured while trying to load application data types configuration.');
            throw e;
        }
    }

    //initialize handlers list
    //important note: Applications handlers are static classes (they will be initialized once),
    //so they should not hold information about http context and execution lifecycle.
    var self = this;

    var handlers = self.getConfiguration().handlers || [], defaultApplicationConfig = require('./resources/app.json');
    //default handlers
    var defaultHandlers = defaultApplicationConfig.handlers;
    for (var i = 0; i < defaultHandlers.length; i++) {
        (function(item) {
            if (typeof _.find(handlers, function(x) { return x.name === item.name; }) === 'undefined') {
                handlers.push(item);
            }
        })(defaultHandlers[i]);
    }
    _.forEach(handlers,function (h) {
        try {
            var handlerPath = h.type;
            if (handlerPath.indexOf('/')===0)
                handlerPath = self.mapPath(handlerPath);
            var handlerModule = require(handlerPath), handler = null;
            if (handlerModule) {
                if (typeof handlerModule.createInstance !== 'function') {
                    TraceUtils.log(sprintf('The specified handler (%s) cannot be instantiated. The module does not export createInstance() function.', h.name));
                    return;
                }
                handler = handlerModule.createInstance();
                if (handler)
                    self.getConfiguration().handlers.push(handler);
            }
        }
        catch (e) {
            throw new Error(sprintf('The specified handler (%s) cannot be loaded. %s', h.name, e.message));
        }
    });
    /**
     * initialize basic directives collection
     * @type {Function}
     */
    var directives = require("./angular-server-directives");
    directives.bind(this)();
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
 * Resolves ETag header for the given file. If the specifed does not exist or is invalid returns null.
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
/**
 * @param {HttpContext} context
 * @param {string} executionPath
 * @param {function(Error, Boolean)} callback
 */
HttpApplication.prototype.unmodifiedRequest = function(context, executionPath, callback) {
    try {
        var requestETag = context.request.headers['if-none-match'];
        if (typeof requestETag === 'undefined' || requestETag === null) {
            callback(null, false);
            return;
        }
        HttpApplication.prototype.resolveETag(executionPath, function(err, result) {
            callback(null, (requestETag===result));
        });
    }
    catch (e) {
        TraceUtils.log(e);
        callback(null, false);
    }
};

/**
 * @param request {String|IncomingMessage}
 * */
HttpApplication.prototype.resolveMime = function (request) {
    var extensionName;
    if (typeof request=== 'string') {
        //get file extension
        extensionName = path.extname(request);
        return _.find(this.config.mimes, function(x) {
            return (x.extension === extensionName);
        });
    }
    else if (typeof request=== 'object') {
        //get file extension
        extensionName = path.extname(request.url);
        return _.find(this.config.mimes, function(x) {
            return (x.extension === extensionName);
        });
    }
};

/**
 * Sets the authentication cookie that is associated with the given user.
 * @param {HttpContext} context
 * @param {String} username
 * @param {*=} options
 * @deprecated Use HttpApplication.getStrategy(AuthStrategy).setAuthCookie(context, username, options) instead
 */
HttpApplication.prototype.setAuthCookie = function (context, username, options)
{
    this.getStrategy(AuthStrategy).setAuthCookie(context, username, options);
};

/**
 * Gets the authentication cookie that is associated with the given user.
 * @param {HttpContext} context
 * @deprecated Use HttpApplication.getStrategy(AuthStrategy).getAuthCookie(context) instead
 */
HttpApplication.prototype.getAuthCookie = function (context)
{
    return this.getStrategy(AuthStrategy).getAuthCookie(context);
};


/**
 *
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpApplication.prototype.processRequest = function (context, callback) {
    if (_.isNil(context)) {
        return callback();
    }
    else {
        //1. beginRequest
        context.emit('beginRequest', context, function (err) {
            if (err) {
                return callback(err);
            }
            else {
                //2. validateRequest
                context.emit('validateRequest', context, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    else {
                        //3. authenticateRequest
                        context.emit('authenticateRequest', context, function (err) {
                            if (err) {
                                return callback(err);
                            }
                            else {
                                //4. authorizeRequest
                                context.emit('authorizeRequest', context, function (err) {
                                    if (err) {
                                        return callback(err);
                                    }
                                    else {
                                        //5. mapRequest
                                        context.emit('mapRequest', context, function (err) {
                                            if (err) {
                                                return callback(err);
                                            }
                                            else {
                                                //5b. postMapRequest
                                                context.emit('postMapRequest', context, function(err) {
                                                    if (err) {
                                                        return callback(err);
                                                    }
                                                    else {
                                                        //process HEAD request
                                                        if (context.request.method==='HEAD') {
                                                            //7. endRequest
                                                            context.emit('endRequest', context, function (err) {
                                                                return callback(err);
                                                            });
                                                        }
                                                        else {
                                                            //6. processRequest
                                                            if (_.isObject(context.request.currentHandler))
                                                                context.request.currentHandler.processRequest(context, function (err) {
                                                                    if (err) {
                                                                        return callback(err);
                                                                    }
                                                                    else {
                                                                        //7. endRequest
                                                                        context.emit('endRequest', context, function (err) {
                                                                            return callback(err);
                                                                        });
                                                                    }
                                                                });
                                                            else {
                                                                var er = new HttpNotFoundError();
                                                                if (context.request && context.request.url) {
                                                                    er.resource = context.request.url;
                                                                }
                                                                return callback(er);
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
 * @returns {*}
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
    if (_.isNil(adapter))
        throw new Error('There is no default data adapter or the configuration is incorrect.');
    //try to instantiate adapter
    if (!adapter.invariantName)
        throw new Error('The default data adapter has no invariant name.');
    var adapterType = this.config.adapterTypes[adapter.invariantName];
    if (_.isNil(adapterType))
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

HttpApplication.prototype.setContextProvider = function(provider) {
    if (typeof provider === 'undefined' || provider === null) {
        throw new TypeError('Context provider may not be null.');
    }
    if (typeof provider.createInstance !== 'function') {
        throw new TypeError('Context provider does not implement createInstance() method.');
    }
    this.module.service('contextProvider', function() {
        return provider;
    });
};

HttpApplication.prototype.getContextProvider = function() {
    var contextProviderSvc = this.module.service('contextProvider');
    if (typeof contextProviderSvc !== 'function') {
        var httpContext = require('./http-context');
        this.module.service('contextProvider', function() {
            return httpContext;
        });
        return httpContext;
    }
    return contextProviderSvc();
};


/**
 * Creates an instance of HttpContext class.
 * @param {ClientRequest} request
 * @param {ServerResponse} response
 * @returns {HttpContext}
 */
HttpApplication.prototype.createContext = function (request, response) {
    var context = this.getContextProvider().createInstance(request, response);
    //set context application
    context.application = this;
    //set handler events
    for (var i = 0; i < HttpHandler.Events.length; i++) {
        var ev = HttpHandler.Events[i], handlers = this.getConfiguration().handlers;
        for (var j = 0; j < handlers.length; j++) {
            var handler = handlers[j];
            if (typeof handler[ev] === 'function') {
                context.on(ev, handler[ev]);
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
 * @param {function(HttpContext)} fn
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
    var request = createRequestInternal.bind(this)(), context =  this.createContext(request, createResponseInternal.bind(this)(request));
    //get unattended account
    /**
     * @type {{unattendedExecutionAccount:string}|*}
     */
    this.config.settings.auth = this.config.settings.auth || {};
    var account = this.config.settings.auth.unattendedExecutionAccount;
    //set unattended execution account
    if (typeof account !== 'undefined' || account!==null) {
        context.user = { name: account, authenticationType: 'Basic'};
    }
    //execute internal process
    fn.bind(this)(context);
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
    var request = createRequestInternal.bind(this)(opts),
        response = createResponseInternal.bind(this)(request);
    if (!opts.url) {
        callback(new Error('Internal request url cannot be empty at this context.'));
        return;
    }
    if (opts.url.indexOf('/')!==0)
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
        in earlier version of node.js <0.11.9 the response contains by default a hexademical number that
        represents the content length. This number appears exactly after response headers and before response body.
        If the content length is defined the operation omits this hexademical value
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
        'accept-language': 'en-US,en;q=0.5',
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
        if (/text\/html/g.test(request.headers.accept)) {
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
                response.writeHead(err.status || 500 , { "Content-Type": "text/html" });
                response.write(str);
                response.end();
                callback();
            });
        }
        else {
            callback(err);
        }
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
                response.writeHead(err.status || 500, {"Content-Type": "text/plain"});
                //if error is an HTTP Exception
                if (err instanceof HttpError) {
                    response.write(err.status + ' ' + err.message + "\n");
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
 * Register an application strategy
 * @param {Function} baseStrategyCtor
 * @param {Function} strategyCtor
 * @returns HttpApplication
 */
HttpApplication.prototype.useStrategy = function(baseStrategyCtor, strategyCtor) {
    Args.notFunction(baseStrategyCtor,"Base strategy constructor");
    Args.notFunction(strategyCtor,"Strategy constructor");
    this[strategiesProperty]["$".concat(baseStrategyCtor.name)] = new strategyCtor(this);
    return this;
};
/**
 * Checks if the given strategy already exists in application strategies
 * @param strategyCtor
 * @returns {boolean}
 */
HttpApplication.prototype.hasStrategy = function(strategyCtor) {
    Args.notFunction(strategyCtor,"Service constructor");
    return this[strategiesProperty].hasOwnProperty("$".concat(strategyCtor.name));
};
/**
 * @param strategyCtor
 * @returns {HttpApplicationStrategy|*}
 */
HttpApplication.prototype.getStrategy = function(strategyCtor) {
    Args.notFunction(strategyCtor,"Service constructor");
    return this[strategiesProperty]["$".concat(strategyCtor.name)];
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
 * @param {*} options
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
         * @memberof {HttpApplication}
         * @returns {Server|*}
         */
        self.getServer = function() {
            return server_;
        };

        //start listening
        server_.listen(opts.port, opts.bind);
        TraceUtils.log(sprintf('Web application is running at http://%s:%s/', opts.bind, opts.port));
        //do callback
        return callback();
    } catch (e) {
        TraceUtils.log(e);
    }
}

/**
 * @param {*=} options
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
                var debug = _.filter(process.execArgv, function(x) { return /^--debug(-brk)?=\d+$/.test(x); })[0], debugPort;
                if (debug) {
                    //get debug port
                    debugPort = parseInt(/^--debug(-brk)?=(\d+)$/.exec(debug)[2]);
                    cluster.setupMaster({
                        execArgv: _.filter(process.execArgv, function(x) { return !/^--debug(-brk)?=\d+$/.test(x); })
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
 * @param {string} name
 * @param {function=} ctor - The class constructor associated with this controller
 * @returns {HttpApplication|function()}
 */
HttpApplication.prototype.service = function(name, ctor) {
    if (typeof ctor === 'undefined')
        return this.module.service(name);
    this.module.service(name, ctor);
    return this;
};

/**
 * @param {string} name
 * @param {function} ctor - The class constructor associated with this controller
 * @returns {HttpApplication|function()}
 */
HttpApplication.prototype.directive = function(name, ctor) {
    this.module.directive(name, ctor);
    return this;
};

/**
 * Get or sets an HTTP controller
 * @param {string} name
 * @param {Function|*} ctor
 * @returns {*}
 */
HttpApplication.prototype.controller = function(name, ctor) {
    this.config.controllers = this.config.controllers || {};
    var er;
    if (typeof ctor === 'undefined') {
        var c = this.config.controllers[name];
        if (typeof c === 'string') {
            return require(c);
        }
        else if (typeof c === 'function') {
            return c;
        }
        else {
            er =  new Error('Invalid HTTP Controller constructor. Expected string or function.'); er.code='EARG';
            throw er;
        }
    }
    //if ctor is not a function (constructor) throw invalid argument exception
    if (typeof ctor !== 'function') {
        er =  new Error('Invalid HTTP Controller constructor. Expected function.'); er.code='EARG';
        throw er;
    }
    //append controller to application constroller (or override an already existing controller)
    this.config.controllers[name] = ctor;
    return this;
};

/**
 * Registers HttpApplication as express framework middleware
 * @example

 'use strict';
 import express from 'express';
 import {HttpApplication} from '@themost/web';
 const theApp = new HttpApplication(".");
 //initialize express app
 const app = express();
 //register @themost middleware
 app.use(theApp.runtime());
 //start application
 app.listen(process.env.PORT || 3000);

*/
HttpApplication.prototype.runtime = function() {
    var self = this;
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
                context.finalize(function() {
                    return next(err);
                });
            }
            else {
                context.finalize(function() {
                    context.response.end();
                });
            }
        });
    };
};
/**
 * @returns HttpApplication
 */
HttpApplication.getCurrent = function() {
    if (_.isObject(HttpApplication[currentApplicationProperty]))
        return HttpApplication[currentApplicationProperty];
    //instantiate HTTP application
    var current_ = new HttpApplication(process.cwd());
    //initialize current application
    if (current_.config === null) {
        current_.init();
    }
    //extend current application
    current_.extend();
    HttpApplication[currentApplicationProperty] = current_;
    //and finally return it
    return HttpApplication[currentApplicationProperty];
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
                return callback(err);
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
                response.writeHead(error.status || 500, {"Content-Type": "text/plain"});
                //if error is an HTTP Exception
                if (error instanceof HttpError) {
                    response.write(error.status + ' ' + error.message + "\n");
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
                    result = new HttpJsonResult(error);
                    result.responseStatus = error.status;
                }
                else if (process.env.NODE_ENV === 'development') {
                    result = new HttpJsonResult(error);
                    result.responseStatus = error.status || 500;
                }
                else {
                    result = new HttpJsonResult(new HttpServerError());
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
            if (_.isNil(context) || _.isNil(context)) {
                return callback.call(self);
            }
            if (error.status !== 401) {
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
                        var result = new HttpRedirectResult(page.concat('?returnUrl=', encodeURIComponent(context.request.url)));
                        //execute redirect result
                        result.execute(context, function(err) {
                            return callback(err);
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


if (typeof exports !== 'undefined') {
    module.exports.HttpApplication = HttpApplication;
}