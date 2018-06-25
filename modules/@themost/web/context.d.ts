/**
 * Creates an instance of HttpContext class.
 * @class
 * @property {{extension:string,type:string}} mime - Gets an object which represents the mime type associated with this context.
 * @property {string} format - Gets a string which represents the response format of this context (e.g html, json, js etc).
 * @constructor
 * @augments DataContext
 * @augments SequentialEventEmitter
 * @param {ClientRequest} httpRequest
 * @param {ServerResponse} httpResponse
 * @returns {HttpContext}
 */
export declare interface HttpContext {
		
	/**
	 * 
	 * @param httpRequest 
	 * @param httpResponse 
	 * @return  
	 */
	new (httpRequest : /* HttpContext.request */ any, httpResponse : any): HttpContext;
		
	/**
	 * Get an instance of HttpApplication class which represents the parent application of this context
	 * @returns {HttpApplication}
	 * @return  
	 */
	getApplication(): /* !this.application */ any;
		
	/**
	 * Get an instance of HttpApplication class which represents the parent application of this context
	 * @returns {ConfigurationBase|*}
	 */
	getConfiguration(): void;
		
	/**
	 * 
	 * @param name 
	 * @return  
	 */
	getParam(name : any): /* !this.params.<i> */ any;
		
	/**
	 * 
	 * @param name 
	 * @return  
	 */
	hasParam(name : any): boolean;
		
	/**
	 * 
	 */
	init(): void;
		
	/**
	 * @param {string} name
	 * @param {*=} value
	 * @param {Date=} expires
	 * @param {string=} domain
	 * @param {string=} cookiePath
	 * @returns {string|*}
	 * @param name 
	 * @param value 
	 * @param expires? 
	 * @param domain? 
	 * @param cookiePath? 
	 */
	cookie(name : string, value : any, expires? : Date, domain? : string, cookiePath? : string): void;
		
	/**
	 * @param {string} name
	 * @returns {*}
	 * @param name 
	 */
	getCookie(name : string): void;
		
	/**
	 * @param {*} p
	 * @param p 
	 */
	moment(p : any): void;
		
	/**
	 * @param {string} name - The name of the cookie to be added
	 * @param {string|*} value - The value of the cookie
	 * @param {Date=} expires - An optional parameter which sets cookie's expiration date. If this parameters is missing or is null a session cookie will be set.
	 * @param {string=} domain - An optional parameter which sets the cookie's domain.
	 * @param {string=} cpath - An optional parameter which sets the cookie's path. The default value is the root path.
	 * @param name 
	 * @param value 
	 * @param expires? 
	 * @param domain? 
	 * @param cpath? 
	 */
	setCookie(name : string, value : any, expires? : Date, domain? : string, cpath? : string): void;
		
	/**
	 * Set a permanent cookie for user preferred language
	 * @param lang - A string which represents the user preferred language e.g. en-US, en-GB etc
	 * @param lang 
	 */
	setLangCookie(lang : any): void;
		
	/**
	 * @param {string} name - The name of the cookie to be deleted
	 * @param {string=} domain - An optional parameter which indicates cookie's domain.
	 * @param {string=} cpath - An optional parameter which indicates cookie's path. The default value is the root path.
	 * @returns {string|undefined}
	 * @param name 
	 * @param domain? 
	 * @param cpath? 
	 * @return  
	 */
	removeCookie(name : string, domain? : string, cpath? : string): string;
		
	/**
	 * Executes the specified code in unattended mode.
	 * @param {Function} fn
	 * @param {Function} callback
	 * @param fn 
	 * @param callback 
	 */
	unattended(fn : Function, callback : Function): void;
		
	/**
	 * Gets or sets the current culture
	 * @param {String=} value
	 * @param value? 
	 * @return  
	 */
	culture(value? : string): /* !this._culture */ any;
		
	/**
	 * Performs cross-site request forgery validation against the specified token
	 * @param {string=} csrfToken
	 * @param csrfToken? 
	 */
	validateAntiForgeryToken(csrfToken? : string): void;
		
	/**
	 * @param {string} file
	 * @param file 
	 */
	writeFile(file : string): void;
		
	/**
	 * Checks whether the HTTP method of the current request is equal or not to the given parameter.
	 * @param {String|Array} method - The HTTP method (GET, POST, PUT, DELETE)
	 * @param method 
	 * @return  
	 */
	is(method : string | Array<any>): boolean;
		
	/**
	 * 
	 * @return  
	 */
	isPost(): boolean;
		
	/**
	 * @param {String|Array} method
	 * @param {Function} fn
	 * @returns {HttpContext}
	 * @param method 
	 * @param fn 
	 * @return  
	 */
	handle(method : string | Array<any>, fn : Function): /* !this */ any;
		
	/**
	 * Handles context error by executing the given callback
	 * @param {Function} callback
	 * @param callback 
	 * @return  
	 */
	catch(callback : (() => void) | Function): /* !this */ any;
		
	/**
	 * @param {Function} fn
	 * @returns {HttpContext}
	 * @param fn 
	 * @return  
	 */
	unhandle(fn : Function): HttpContext;
		
	/**
	 * Invokes the given function if the current HTTP method is equal to POST
	 * @param {Function} fn
	 * @returns {HttpContext}
	 * @param fn 
	 * @return  
	 */
	handlePost(fn : Function): HttpContext;
		
	/**
	 * Invokes the given function if the current HTTP method is equal to GET
	 * @param {Function} fn
	 * @returns {HttpContext}
	 * @param fn 
	 * @return  
	 */
	handleGet(fn : Function): HttpContext;
		
	/**
	 * Invokes the given function if the current HTTP method is equal to PUT
	 * @param {Function} fn
	 * @returns {HttpContext}
	 * @param fn 
	 * @return  
	 */
	handlePut(fn : Function): HttpContext;
		
	/**
	 * Invokes the given function if the current HTTP method is equal to PUT
	 * @param {Function} fn
	 * @param fn 
	 * @return  
	 */
	handleDelete(fn : Function): HttpContext;
		
	/**
	 * Gets or sets the current HTTP handler
	 * @param {Object=} value
	 * @returns {Function|Object}
	 * @param value? 
	 * @return  
	 */
	currentHandler(value? : any): /* !this.request.currentHandler */ any;
		
	/**
	 * Translates the given string to the language specified in this context
	 * @param {string} text - The string to translate
	 * @param {string=} lib - A string that represents the library which contains the source string. This arguments is optional. If this argument is missing, then the operation will use the default (global) library.
	 * @returns {*}
	 * @param text 
	 * @param lib? 
	 */
	translate(text : string, lib? : string): void;
		
	/**
	 * Creates an instance of a view engine based on the given extension (e.g. ejs, md etc)
	 * @param {string} extension
	 * @returns {*}
	 * @param extension 
	 */
	engine(extension : string): void;
	
	/**
	 * @type {ClientRequest}
	 */
	request : {
	}
	
	/**
	 * Gets an object that represents route data variables
	 * @type {*}
	 */
	data : {
	}
	
	/**
	 * @property {*} cookies - Gets a collection of HTTP Request cookies
	 */
	cookies : {
	}

}

