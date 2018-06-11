/**
 * @class
 */
export declare class Args {
    /**
     * Checks the expression and throws an exception if the condition is not met.
     * @param {*} expr
     * @param {string|Error} err
     */
    static check(expr: any, err: string | Error): void;
    /**
     *
     * @param {*} arg
     * @param {string} name
     */
    static notNull(arg: any, name: string): void;
    /**
     * @param {*} arg
     * @param {string} name
     */
    static notString(arg: any, name: string): void;
    /**
     * @param {*} arg
     * @param {string} name
     */
    static notFunction(arg: any, name: string): void;
    /**
     * @param {*} arg
     * @param {string} name
     */
    static notNumber(arg: any, name: string): void;
    /**
     * @param {string|*} arg
     * @param {string} name
     */
    static notEmpty(arg: any, name: any): void;
    /**
     * @param {number|*} arg
     * @param {string} name
     */
    static notNegative(arg: any, name: any): void;
    /**
     * @param {number|*} arg
     * @param {string} name
     */
    static notPositive(arg: any, name: any): void;
}
export declare class Base26Number {
    static toBase26(x: number): string;
    static fromBase26(s: string): number;
    private value;
    constructor(value: any);
    toString(): string;
}
export declare class TextUtils {
    /**
     * Converts the given parameter to MD5 hex string
     * @static
     * @param {*} value
     * @returns {string|undefined}
     */
    static toMD5(value: any): string;
    /**
     * Converts the given parameter to SHA1 hex string
     * @static
     * @param {*} value
     * @returns {string|undefined}
     */
    static toSHA1(value: any): string;
    /**
     * Converts the given parameter to SHA256 hex string
     * @static
     * @param {*} value
     * @returns {string|undefined}
     */
    static toSHA256(value: any): string;
    /**
     * Returns a random GUID/UUID string
     * @static
     * @returns {string}
     */
    static newUUID(): string;
}
/**
 *
 */
export declare class Guid {
    /**
     * @param {string} s
     * @returns {boolean}
     */
    static isGuid(s: string): boolean;
    /**
     * @returns {Guid}
     */
    static newGuid(): Guid;
    private value;
    /**
     * @constructor
     * @param {string} value
     */
    constructor(value?: string);
    /**
     * @returns {string}
     */
    toString(): string;
    /**
     * @returns {string}
     */
    valueOf(): string;
    toJSON(): string;
}
/**
 * @class
 */
export declare class RandomUtils {
    /**
     * Returns a random string based on the length specified
     * @param {Number} length
     */
    static randomChars(length: number): string;
    /**
     * Returns a random integer between a minimum and a maximum value
     * @param {number} min
     * @param {number} max
     */
    static randomInt(min: number, max: number): number;
    /**
     * Returns a random string based on the length specified
     * @static
     * @param {number} length
     * @returns {string}
     */
    static randomHex(length: number): string;
}
export interface IConvertOptions {
    convertValues: boolean;
}
/**
 * @class
 */
export declare class LangUtils {
    /**
     * Returns an array of strings which represents the arguments' names of the given function
     * @param {Function} fn
     * @returns {Array}
     */
    static getFunctionParams(fn: any): any[] | RegExpMatchArray;
    /**
     * Parses HTTP form formatted values (e.g. "user[name]", user[password], user[options][rememberMe] etc ) and returns the equivalent native object
     * @param {*} form
     * @param {IConvertOptions} options
     * @returns {*}
     * @example
     *
     */
    static parseForm(form: any, options?: IConvertOptions): {};
    /**
     * Parses value value or string and returns the resulted object.
     * @param {*} value
     * @returns {*}
     */
    static parseValue(value: any): any;
    /**
     * Parses value value and returns the equivalent integer.
     * @param {*} value
     * @returns {*}
     */
    static parseInt(value: any): number;
    /**
     * Parses value value and returns the equivalent float number.
     * @param {*} value
     * @returns {*}
     */
    static parseFloat(value: any): number;
    /**
     * Parses value value and returns the equivalent boolean.
     * @param {*} value
     * @returns {*}
     */
    static parseBoolean(value: any): boolean;
    /**
     * @param {string} value
     */
    private static convert(value);
    /**
     *
     * @param {*} origin
     * @param {string} expr
     * @param {string} value
     * @param {IConvertOptions=} options
     * @returns {*}
     */
    private static extend(origin, expr, value, options?);

    /**
     * Checks if the given value is a valid date
     * @param {*} value
     * @returns {boolean}
     */
    static isDate(value):boolean;

    /**
     * @param constructor
     * @param superConstructor
     */
    static inherits(constructor: any, superConstructor: any): void;

}
/**
 * @class
 */
export declare class PathUtils {
    /**
     *
     * @param {...string} part
     * @returns {string}
     */
    static join(...part: any[]): string;
}
export interface ITraceLogger {
    level(level: string): ITraceLogger;
    /**
     * @param {...*} data
     */
    log(...data: any[]): any;
    /**
     * @param {...*} data
     */
    info(...data: any[]): any;
    /**
     * @param {...*} data
     */
    error(...data: any[]): any;
    /**
     * @param {...*} data
     */
    warn(...data: any[]): any;
    /**
     * @param {...*} data
     */
    debug(...data: any[]): any;
}
export interface ITraceLoggerOptions {
    colors: boolean;
    level: string;
}
export declare class TraceLogger implements ITraceLogger {
    private options;
    constructor(options?: ITraceLoggerOptions);
    level(level: string): this;
    log(...data: any[]): void;
    info(...data: any[]): void;
    error(...data: any[]): void;
    warn(...data: any[]): void;
    verbose(...data: any[]): void;
    debug(...data: any[]): void;
    private timestamp();
    private write(level, text);
}
export declare class TraceUtils {

    static level(level: string): void;

    static useLogger(logger: ITraceLogger): void;
    /**
     * @static
     * @param {...*} data
     */
    static log(...data: any[]): void;
    /**
     * @static
     * @param {...*} data
     */
    static error(...data: any[]): void;
    /**
     *
     * @static
     * @param {...*} data
     */
    static info(...data: any[]): void;
    /**
     *
     * @static
     * @param {*} data
     */
    static warn(...data: any[]): void;
    /**
     *
     * @static
     * @param {...*} data
     */
    static debug(...data: any[]): void;
}

/**
 * @class
 * @augments TypeError
 */
export declare class ArgumentError extends TypeError {
    /**
     * Gets or sets a string which may be used to identify this error e.g. ECHECK, ENULL etc
     */
    code: string;
    constructor(message: any, code?: string);
}
