import {IncomingMessage, ServerResponse, RequestListener} from "http";
import {HttpContext} from "./context";
import {HttpConfiguration} from "./config";
import {AuthStrategy, EncryptionStrategy} from "./handlers/auth";
import {LocalizationStrategy} from "./localization";
import {SequentialEventEmitter} from "@themost/common/emitter";

declare interface ApplicationOptions {
    port?: number|string;
    bind?: string;
    cluster?: number|string;
}

export declare interface HttpControllerConfiguration {
    configure(app:HttpApplication);
}

export declare class HttpContextProvider {
    constructor (app:HttpApplication);
    create(req:IncomingMessage, res: ServerResponse):HttpContext;
}

export declare class HttpApplication extends SequentialEventEmitter {
    constructor (executionPath:string);

    static getCurrent():HttpApplication;

    getConfiguration():HttpConfiguration;
    getEncryptionStrategy(): EncryptionStrategy;
    getAuthStrategy(): AuthStrategy;
    getLocalizationStrategy(): LocalizationStrategy;
    getExecutionPath(): string;
    mapExecutionPath(arg: string): string;
    useStaticContent(rootDir: string): HttpApplication;
    getConfigurationPath(): string;
    init(): HttpApplication;
    mapPath(arg: string): string;
    resolveUrl(appRelativeUrl: string): string;
    resolveETag(file: string, callback: (err?: Error, res?: string) => void);
    resolveMime(request: IncomingMessage): string;
    processRequest(context: HttpContext, callback: (err?: Error) => void);
    db(): any;
    getContextProvider(): HttpContextProvider;
    createContext(request: IncomingMessage, response: ServerResponse): HttpContext;
    executeExternalRequest(options: any,data: any, callback: (err?: Error, res?: any) => void);
    execute (fn: (context: HttpContext) => void);
    unattended (fn: (context: HttpContext) => void);
    executeRequest(options: any,  callback: (err?: Error, res?: any) => void);
    start(options?: ApplicationOptions);
    runtime(): RequestListener;
    useController(name: string, controllerCtor: Function);
    useStrategy(serviceCtor: Function, strategyCtor: Function);
    useService(serviceCtor: Function);
    hasStrategy(serviceCtor: Function);
    hasService(serviceCtor: Function);
    getStrategy(serviceCtor: Function);
    getService(serviceCtor: Function);
}
