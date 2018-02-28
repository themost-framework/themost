/**
 * @augments {Error}
 */
export declare interface DecoratorError extends Error {
    constructor();
}
/**
 * @class
 */
export declare interface HttpParamAttributeOptions {
    name: string;
    type?: string;
    pattern?: any;
    minValue?: any;
    maxValue?: any;
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    message?: string;
}

/**
 * Defines an HTTP action that accepts any HTTP method
 */
export declare function httpAny();

/**
 * Defines an HTTP GET action
 */
export declare function httpGet();

/**
 * Defines an HTTP POST action
 */
export declare function httpPost();

/**
 * Defines an HTTP PUT action
 */
export declare function httpPut();

/**
 * Defines an HTTP DELETE action
 */
export declare function httpDelete();

/**
 * Defines an HTTP APTCH action
 */
export declare function httpPatch();

/**
 * Defines an HTTP HEAD action
 */
export declare function httpHead();

/**
 * Defines an HTTP OPTIONS action
 */
export declare function httpOptions();

/**
 * Defines an HTTP action by declaring action name
 * @param {string} name - The name of the HTTP action
 */
export declare function httpAction(name: string);
/**
 * Defines an HTTP action parameter
 * @param {HttpParamAttributeOptions} attrs
 */
export declare function httpParam(attrs: HttpParamAttributeOptions);
/**
 * Defines an HTTP authorize attribute
 */
export declare function httpAuthorize();
/**
 * Defines an HTTP controller
 */
export declare function httpController();
/**
 *
 * @param {Object|Function} proto - The constructor function of a class or the prototype of a class
 * @param {string} key - The name of the property or method where the decorator will be included
 * @param {Function} decorator - The decorator to be included
 */
export declare function defineDecorator(proto: any, key: string, decorator: void);