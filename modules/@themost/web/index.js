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
 * @private
 */
var common = require('./common'),
    files = require('./files'),
    _ = require('lodash'),
    mvc = require('./http-mvc'),
    html = require('./html'), util = require('util'), array = require('most-array'),
    async = require('async'), path = require("path"), fs = require("fs"),
    url = require('url'),
    http = require('http'),
    EventEmitter2 = require('@themost/data').types.EventEmitter2,
    DataConfiguration = require('@themost/data').cfg.DataConfiguration,
    querystring = require('querystring'),
    HttpContext= require('./http-context').HttpContext,
    DataException = require('most-data/types').DataException,
    decorators = require('./decorators'),
    crypto = require('crypto');
var Symbol = require('symbol');
var executionPathProperty = Symbol('executionPath');
var configPathProperty = Symbol('configPath');
var strategiesProperty = Symbol('strategies');

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
function ApplicationOptions() {

}

/**
 * Represents a configuration file that is applicable to an application or service.
 * @constructor
 */
function ApplicationConfig() {
    /**
     * Gets an array of data adapters.
     * @type {Array}
     */
    this.adapters = [];
    /**
     * Gets an array of HTTP view engines configuration
     * @type {Array}
     */
    this.engines = [];
    /**
     *  Gets an array of all registered MIME types
     * @type {Array}
     */
    this.mimes = [];
    /**
     * Gets an array of all registered HTTP handlers.
     * @type {Array}
     */
    this.handlers = [];
    /**
     * Gets an array of all registered HTTP routes.
     * @type {Array}
     */
    this.routes = [];
    /**
     * Gets or sets a collection of data adapter types that are going to be use in data operation
     * @type {Array}
     */
    this.adapterTypes = null;
    /**
     * Gets or sets a collection of data types that are going to be use in data operation
     * @type {Array}
     */
    this.dataTypes = null;
    /**
     * Gets or sets an object that holds application settings
     * @type {Array}
     */
    this.settings = { };
    /**
     * Gets or sets an object that holds application locales
     * @type {*}
     */
    this.locales = { };

}

/**
 * Abstract class that represents a data context
 * @constructor
 */
function HttpDataContext() {
    //
}
/**
 * @returns {AbstractAdapter}
 */
HttpDataContext.prototype.db = function () {
    return null;
};

/**
 * @param {string} name
 * @returns {DataModel}
 */
HttpDataContext.prototype.model = function (name) {
    return null;
};

/**
 * @param {string} type
 * @returns {*}
 */
HttpDataContext.prototype.dataTypes = function (type) {
    return null;
};

/**
 * @classdesc An abstract class that represents an HTTP Handler
 * @class HttpHandler
 * @abstract
 * @constructor
 */
function HttpHandler() {
    //
}

/**
 * @type {string[]}
 * @private
 */
HttpHandler.Events = ['beginRequest', 'validateRequest', 'authenticateRequest',
    'authorizeRequest', 'mapRequest', 'postMapRequest', 'preExecuteResult', 'postExecuteResult', 'endRequest'];

/**
 * Occurs as the first event in the HTTP execution
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.beginRequest = function (context, callback) {
    callback = callback || function () {
    };
    callback.call(context);
};

/**
 * Occurs when a handler is going to validate current HTTP request.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.validateRequest = function (context, callback) {
    callback = callback || function () {
    };
    callback.call(context);
};

/**
 * Occurs when a handler is going to set current user identity.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.authenticateRequest = function (context, callback) {
    callback = callback || function () {
    };
    callback.call(context);
};

/**
 * Occurs when a handler has established the identity of the current user.
 * @param {HttpContext} context
 * @param {Function} callback
 */
/*HttpHandler.prototype.postAuthenticateRequest = function(context, callback) {
 callback = callback || function() {};
 callback.call(context);
 };*/


/**
 * Occurs when a handler has verified user authorization.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.authorizeRequest = function (context, callback) {
    callback = callback || function () {
    };
    callback.call(context);
};

/**
 * Occurs when the handler is selected to respond to the request.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.mapRequest = function (context, callback) {
    callback = callback || function () {
    };
    callback.call(context);
};

/**
 * Occurs when application has mapped the current request to the appropriate handler.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.postMapRequest = function(context, callback) {
    callback = callback || function() {};
    callback.call(context);
};

/**
 * Occurs just before application starts executing a handler.
 * @param {HttpContext} context
 * @param {Function} callback
 */
/*HttpHandler.prototype.preRequestHandlerExecute = function(context, callback) {
 callback = callback || function() {};
 callback.call(context);
 };*/

/**
 * Occurs when application starts processing current HTTP request.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.processRequest = function (context, callback) {
    callback = callback || function () {
    };
    callback.call(context);
};

/**
 * Occurs when application starts executing an HTTP Result.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.preExecuteResult = function (context, callback) {
    callback = callback || function () {
    };
    callback.call(context);
};

/**
 * Occurs when application was succesfully executes an HTTP Result.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.postExecuteResult = function (context, callback) {
    callback = callback || function () {
    };
    callback.call(context);
};

/**
 * Occurs when the handler finishes execution.
 * @param {HttpContext} context
 * @param {Function} callback
 */
/*HttpHandler.prototype.postRequestHandlerExecute = function(context, callback) {
 callback = callback || function() {};
 callback.call(context);
 };*/

/**
 * Occurs as the last event in the HTTP execution
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.endRequest = function (context, callback) {
    callback = callback || function () {
    };
    callback.call(context);
};

/**
 * @class HttpApplication
 * @constructor
 * @param {string} executionPath
 * @augments EventEmitter
 */
function HttpApplication(executionPath) {
    /**
     * sets the current execution path
     */
    this[executionPathProperty] = _.isNil(executionPath) ? path.join(process.cwd(), 'app') : path.resolve(executionPath, 'app');
    /**
     * Gets the current application configuration path
     * @type {*}
     */
    this[configPathProperty] = _.isNil(executionPath) ? path.join(process.cwd(), 'config') : path.resolve(executionPath, 'config');
    /**
     * Gets or sets application configuration settings
     * @type {ApplicationConfig}
     */
    this.config = null;
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
    var self = this;
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
            if (!web.common.isNullOrUndefined($cache))
                return $cache;
            var HttpCache = require( "./http-cache" );
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

util.inherits(HttpApplication, EventEmitter2);

HttpApplication.prototype.getExecutionPath = function() {
    return this[executionPathProperty];
};

HttpApplication.prototype.getConfigurationPath = function() {
    return this[configPathProperty];
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
        common.log(util.format('Init: Loading environment specific configuration file (app.%s.json)', env));
        str = path.join(this.getConfigurationPath(), 'app.' + env + '.json');
        /**
         * @type {ApplicationConfig}
         */
        this.config = require(str);
        common.log(util.format('Init: Environment specific configuration file (app.%s.json) was succesfully loaded.', env));
    }
    catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
            common.log(util.format('Init: Environment specific configuration file (app.%s.json) is missing.', env));
            //try to load default configuration file
            try {
                common.log('Init: Loading environment default configuration file (app.json)');
                str = path.join(this.getConfigurationPath(), 'app.json');
                /**
                 * @type {ApplicationConfig}
                 */
                this.config = require(str);
                common.log('Init: Default configuration file (app.json) was succesfully loaded.');
            }
            catch (e) {
                if (e.code === 'MODULE_NOT_FOUND') {
                    common.log('Init: An error occured while loading default configuration (app.json). Configuration cannot be found or is inaccesible.');
                    //load internal configuration file
                    /**
                     * @type {ApplicationConfig}
                     */
                    this.config = require('./app.json');
                    this.config.settings.crypto = {
                        "algorithm": "aes256",
                        "key": common.randomHex(32)
                    };
                    common.log('Init: Internal configuration file (app.json) was succesfully loaded.');
                }
                else {
                    common.log('Init: An error occured while loading default configuration (app.json)');
                    throw e;
                }
            }
        }
        else {
            common.log(util.format('Init: An error occured while loading application specific configuration (app).', env));
            throw e;
        }
    }
    //load routes (if empty)
    if (web.common.isNullOrUndefined(this.config.routes)) {
        try {
            this.config.routes = require(path.resolve(this.getConfigurationPath(),'routes.json'));
        }
        catch(e) {
            if (e.code === 'MODULE_NOT_FOUND') {
                //load internal default route file
                web.common.log('Init: Application specific routes configuration cannot be found. The default routes configuration will be loaded instead.');
                this.config.routes = require('./routes.json');
            }
            else {
                web.common.log('Init: An error occured while trying to load application routes configuration.');
                throw e;
            }
        }
    }
    //load data types (if empty)
    if (web.common.isNullOrUndefined(this.config.dataTypes))
    {
        try {
            var dataConfiguration = new DataConfiguration(this[configPathProperty]);
            this.config.dataTypes = dataConfiguration.dataTypes;
        }
        catch(e) {
            web.common.log('Init: An error occured while trying to load application data types configuration.');
            throw e;
        }
    }

    //set settings default
    this.config.settings = this.config.settings || {};

    //initialize handlers list
    //important note: Applications handlers are static classes (they will be initialized once),
    //so they should not hold information about http context and execution lifecycle.
    var self = this;

    var handlers = self.config.handlers || [], defaultApplicationConfig = require('./app.json');
    //default handlers
    var defaultHandlers = defaultApplicationConfig.handlers;
    for (var i = 0; i < defaultHandlers.length; i++) {
        (function(item) {
            if (typeof handlers.filter(function(x) { return x.name === item.name; })[0] === 'undefined') {
                handlers.push(item);
            }
        })(defaultHandlers[i]);
    }
    array(handlers).each(function (h) {
        try {
            var handlerPath = h.type;
            if (handlerPath.indexOf('/')===0)
                handlerPath = self.mapPath(handlerPath);
            var handlerModule = require(handlerPath), handler = null;
            if (handlerModule) {
                if (typeof handlerModule.createInstance !== 'function') {
                    console.log(util.format('The specified handler (%s) cannot be instantiated. The module does not export createInstance() function.', h.name));
                    return;
                }
                handler = handlerModule.createInstance();
                if (handler)
                    self.handlers.push(handler);
            }
        }
        catch (e) {
            throw new Error(util.format('The specified handler (%s) cannot be loaded. %s', h.name, e.message));
        }
    });
    //initialize basic directives collection
    var directives = require("./angular-server-directives");
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
        if (typeof requestETag === 'undefined' || requestETag == null) {
            callback(null, false);
            return;
        }
        HttpApplication.prototype.resolveETag(executionPath, function(err, result) {
            callback(null, (requestETag==result));
        });
    }
    catch (e) {
        console.log(e);
        callback(null, false);
    }
};

/**
 * @param request {String|IncomingMessage}
 * */
HttpApplication.prototype.resolveMime = function (request) {
    if (typeof request=== 'string') {
        //get file extension
        var extensionName = path.extname(request);
        var arr = this.config.mimes.filter(function(x) {
            return (x.extension == extensionName);
        });
        if (arr.length>0)
            return arr[0];
        return null;
    }
    else if (typeof request=== 'object') {
        //get file extension
        var extensionName = path.extname(request.url);
        var arr = this.config.mimes.filter(function(x) {
            return (x.extension == extensionName);
        });
        if (arr.length>0)
            return arr[0];
        return null;
    }
};

/**
 * Encrypts the given data
 * */
HttpApplication.prototype.encrypt = function (data)
{
    if (typeof data === 'undefined' || data===null)
        return null;
    //validate settings
    if (!this.config.settings.crypto)
        throw new Error('Data encryption configuration section is missing. The operation cannot be completed');
    if (!this.config.settings.crypto.algorithm)
        throw new Error('Data encryption algorithm is missing. The operation cannot be completed');
    if (!this.config.settings.crypto.key)
        throw new Error('Data encryption key is missing. The operation cannot be completed');
    //encrypt
    var cipher = crypto.createCipher(this.config.settings.crypto.algorithm, this.config.settings.crypto.key);
    return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
};

/**
 * Decrypts the given data.
 * */
HttpApplication.prototype.decrypt = function (data)
{
    if (typeof data === 'undefined' || data==null)
        return null;
    //validate settings
    if (!this.config.settings.crypto)
        throw new Error('Data encryption configuration section is missing. The operation cannot be completed');
    if (!this.config.settings.crypto.algorithm)
        throw new Error('Data encryption algorithm is missing. The operation cannot be completed');
    if (!this.config.settings.crypto.key)
        throw new Error('Data encryption key is missing. The operation cannot be completed');
    //decrypt
    var decipher = crypto.createDecipher(this.config.settings.crypto.algorithm, this.config.settings.crypto.key);
    return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
};
/**
 * Sets the authentication cookie that is associated with the given user.
 * @param {HttpContext} context
 * @param {String} username
 * @param {*=} options
 */
HttpApplication.prototype.setAuthCookie = function (context, username, options)
{
    var defaultOptions = { user:username, dateCreated:new Date()}, value, expires;
    if (typeof options !== 'undefined' && options != null) {
        value = JSON.stringify(util._extend(options, defaultOptions));
        if (util.isDate(options.expires)) {
            expires = options.expires.toUTCString();
        }
    }
    else {
        value = JSON.stringify(defaultOptions);
    }
    var settings = this.config.settings ? (this.config.settings.auth || { }) : { } ;
    settings.name = settings.name || '.MAUTH';
    var str = settings.name.concat('=', this.encrypt(value)) + ';path=/';
    if (typeof expires === 'string') {
        str +=';expires=' + expires;
    }
    context.response.setHeader('Set-Cookie',str);
};

/**
 * Sets the authentication cookie that is associated with the given user.
 * @param {HttpContext} context
 * @param {String} username
 */
HttpApplication.prototype.getAuthCookie = function (context)
{
    try {
        var settings = this.config.settings ? (this.config.settings.auth || { }) : { } ;
        settings.name = settings.name || '.MAUTH';
        var cookie = context.cookie(settings.name);
        if (cookie) {
            return this.decrypt(cookie);
        }
        return null;
    }
    catch(e) {
        console.log('GetAuthCookie failed.');
        console.log(e.message);
        return null;
    }
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
                                                                var er = new common.HttpNotFoundException();
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
 * @returns {AbstractAdapter}
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
        adapter = array(this.config.adapters).firstOrDefault(function (x) {
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
        var ev = HttpHandler.Events[i];
        for (var j = 0; j < this.handlers.length; j++) {
            var handler = this.handlers[j];
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
    var request = createRequestInternal.call(this), context =  this.createContext(request, createResponseInternal.call(this,request));
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
                if (path.extname(arr[i])=='.js')
                    require(path.join(extensionFolder, arr[i]));
            }
        }
    }
    else {
        //register the specified extension
        if (typeof extension === 'string') {
            var extensionPath = this.mapPath(util.format('/extensions/%s.js', extension));
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
        util._extend(opts, { url:options });
    }
    else {
        util._extend(opts, options);
    }
    var request = createRequestInternal.call(this,opts),
        response = createResponseInternal.call(this,request);
    if (!opts.url) {
        callback(new Error('Internal request url cannot be empty at this context.'));
        return;
    }
    if (opts.url.indexOf('/')!=0)
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
                    if (util.isArray(response.output)) {
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
        util._extend(context.params, querystring.parse(request.url.substring(request.url.indexOf('?') + 1)));
    //add form
    if (request.form)
        util._extend(context.params, request.form);
    //add files
    if (request.files)
        util._extend(context.params, request.files);

    self.processRequest(context, function (err) {
        if (err) {
            if (self.listeners('error').length == 0) {
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
        if (common.isNullOrUndefined(context)) {
            callback(err);
            return;
        }
        var request = context.request, response = context.response, ejs = require('ejs');
        if (common.isNullOrUndefined(request) || common.isNullOrUndefined(response)) {
            callback(err);
            return;
        }
        //HTML custom errors
        if (/text\/html/g.test(request.headers.accept)) {
            fs.readFile(path.join(__dirname, './http-error.html.ejs'), 'utf8', function (readErr, data) {
                if (readErr) {
                    //log process error
                    common.log(readErr);
                    //continue error execution
                    callback(err);
                    return;
                }
                //compile data
                var str;
                try {
                    if (err instanceof common.HttpException) {
                        str = ejs.render(data, { error:err });
                    }
                    else {
                        var httpErr = new common.HttpException(500, null, err.message);
                        httpErr.stack = err.stack;
                        str = ejs.render(data, {error: httpErr});
                    }
                }
                catch (e) {
                    common.log(e);
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
        web.common.log(e);
        //and continue execution
        callback(err);
    }

}

/**
 *
 * @param {HttpContext} context
 * @param {Error|HttpException} err
 * @param {function()} callback
 */
HttpApplication.prototype.onError = function (context, err, callback) {
    callback = callback || function () { };
    try {

        if (_.isNil(err)) {
            return callback.bind(this)();
        }
        //always log error
        common.log(err);
        //get response object
        var response = context.response, ejs = require('ejs');
        if (common.isNullOrUndefined(response)) {
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
                if (err instanceof common.HttpException) {
                    response.write(err.status + ' ' + err.message + "\n");
                }
                else {
                    //otherwise send status 500
                    response.write('500 ' + err.message + "\n");
                }
                //send extra data (on development)
                if (process.env.NODE_ENV === 'development') {
                    if (!common.isEmptyString(err.innerMessage)) {
                        response.write(err.innerMessage + "\n");
                    }
                    if (!common.isEmptyString(err.stack)) {
                        response.write(err.stack + "\n");
                    }
                }
            }
            return callback.bind(this)();
        });
    }
    catch (err) {
        common.log(err);
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
        util._extend(opts, options);

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
        web.common.log(util.format('Web application is running at http://%s:%s/', opts.bind, opts.port));
        //do callback
        callback.call(self);
    } catch (e) {
        console.log(e);
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
            clusters = common.parseInt(options.cluster);
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
                response.writeHead(error.status || 500, {"Content-Type": "text/plain"});
                //if error is an HTTP Exception
                if (error instanceof common.HttpException) {
                    response.write(error.status + ' ' + error.message + "\n");
                }
                else {
                    //otherwise send status 500
                    response.write('500 ' + error.message + "\n");
                }
                //send extra data (on development)
                if (process.env.NODE_ENV === 'development') {
                    if (!common.isEmptyString(error.innerMessage)) {
                        response.write(error.innerMessage + "\n");
                    }
                    if (!common.isEmptyString(error.stack)) {
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
                if (error instanceof common.HttpException) {
                    result = new mvc.HttpJsonResult(error);
                    result.responseStatus = error.status;
                }
                else if (process.env.NODE_ENV === 'development') {
                    result = new mvc.HttpJsonResult(error);
                    result.responseStatus = error.status || 500;
                }
                else {
                    result = new mvc.HttpJsonResult(new common.HttpServerError());
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
            if (common.isNullOrUndefined(context) || common.isNullOrUndefined(context)) {
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


var web = { };

web.HttpApplication = HttpApplication;
web.HttpContext = HttpContext;
/**
 * @type {HttpApplication}
 */
web.current = undefined;
/**
 * Most Web Framework Express Parser
 * @param {*=} options
 */
web.runtime = function(options) {
    return web.current.runtime();
};

/**
 * Expression handler for Access Denied HTTP errors (401).
 * @param {*=} options
 */
web.unauthorized = function(options) {
    return function(err, req, res, next)
    {
        try {
            if (err.status===401)  {
                if (/text\/html/g.test(req.get('accept'))) {
                    if (web.current.config.settings) {
                        if (web.current.config.settings.auth) {
                            var page = web.current.config.settings.auth.loginPage || '/login.html';
                            res.set('Location', page.concat('?returnUrl=', encodeURIComponent(req.url)));
                            res.status(302).end();
                            return;
                        }
                    }
                }
            }
            next(err);
        }
        catch(e) {
            console.log(e);
            next(err);
        }
    };
};
/**
 * Expression handler for HTTP errors.
 */
web.error = function() {
    return function(err, request, response, next)
    {
        try {
            var ejs = require('ejs');
            if (common.isNullOrUndefined(response) || common.isNullOrUndefined(request)) {
                next(err);
            }
            if (!/text\/html/g.test(request.get('accept'))) {
                next(err);
            }
            else {
                if (response._headerSent) {
                    next(err);
                    return;
                }
                fs.readFile(path.join(__dirname, './http-error.html.ejs'), 'utf8', function (readErr, data) {
                    if (readErr) {
                        //log process error
                        common.log(readErr);
                        next(err);
                        return;
                    }
                    //compile data
                    var str;
                    try {
                        if (err instanceof common.HttpException) {
                            str = ejs.render(data, { error:err });
                        }
                        else {
                            var httpErr = new common.HttpException(500, null, err.message);
                            httpErr.stack = err.stack;
                            str = ejs.render(data, {error: httpErr});
                        }
                    }
                    catch (e) {
                        common.log(e);
                        next(err);
                        return;
                    }
                    //write status header
                    response.writeHead(err.status || 500 , { "Content-Type": "text/html" });
                    response.write(str);
                    response.end();
                });
            }
        }
        catch(e) {
            console.log(e);
            next(err);
        }
    };
};

web.controllers = {
        HttpController: mvc.HttpController,
        HttpBaseController: require('./base-controller'),
        HttpDataController: require('./data-controller'),
        HttpLookupController: require('./lookup-controller')
};

web.views = {
    /**
     * Creates an empty HTTP response.
     * @returns {HttpEmptyResult}
     */
    createEmptyResult: function () {
        return new mvc.HttpEmptyResult();
    },
    /**
     * Creates a basic HTTP response with the data provided
     * @param s {string}
     * @returns {HttpContentResult}
     */
    createContentResult: function (s) {
        return new mvc.HttpContentResult(s);
    },
    /**
     * Creates a new HTTP view context that is going to be used in view controllers
     * @param context {HttpContext=} - The current HTTP context
     * @returns {HttpViewContext} - The newly create HTTP view context
     */
    createViewContext: function (context) {
        return new mvc.HttpViewContext(context);
    },
    /**
     * Creates a JSON response with the given data
     * @param data
     * @returns {HttpJsonResult}
     */
    createJsonResult: function (data) {
        return new mvc.HttpJsonResult(data);
    },
    /**
     * Creates a HTTP redirect to given url.
     * @param url
     * @returns {HttpRedirectResult}
     */
    createRedirectResult: function (url) {
        return new mvc.HttpRedirectResult(url);
    },
    /**
     * Creates an XML response with the data provided.
     * @param data
     * @returns {HttpXmlResult}
     */
    createXmlResult: function (data) {
        return new mvc.HttpXmlResult(data);
    },
    /**
     * Creates an HTML response with the data provided.
     * @param {string} name
     * @param {*} data
     * @returns {HttpViewResult}
     */
    createViewResult: function (name, data) {
        return new mvc.HttpViewResult(name, data);
    },
    /**
     * Inherit the prototype methods from HttpController into the given class
     * @param {function} ctor Constructor function which needs to inherit the HttpController
     */
    inheritsController: function (ctor) {
        util.inherits(ctor, mvc.HttpController);
    },
    HttpController: mvc.HttpController,
        HttpViewContext:mvc.HttpViewContext
};

web.html = html;
web.mvc = mvc;
web.common = common;
web.files= files;
web.decorators = decorators;

/**
 * @type HttpApplication
 * @private
 */
var __current__ = null;

if (typeof global !== 'undefined' && global!==null) {
    if (typeof global.application === 'undefined') {
        //set current application as global property (globals.application)
        Object.defineProperty(global, 'application', {
            get: function () {
                return web.current;
            },
            configurable: false,
            enumerable: false
        });
    }
}

Object.defineProperty(web, 'current', {
    get: function () {
        if (__current__ !== null)
            return __current__;
        //instantiate HTTP application
        __current__ = new HttpApplication();
        //initialize current application
        if (__current__.config === null)
            __current__.init();
        //extend current application
        __current__.extend();
        //and finally return it
        return __current__;
    },
    configurable: false,
    enumerable: false
});

if (typeof exports !== 'undefined')
{
    module.exports = web;
}
