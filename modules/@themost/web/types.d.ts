import {IApplication, IApplicationService} from "@themost/common/app";
import {SequentialEventEmitter} from "../common";
import {HttpContext} from "./context";

export declare class HttpViewEngine extends SequentialEventEmitter {
    context: HttpContext;
    getContext():HttpContext;
    render(file: string, data: any, callback: (err?: Error) => void);
}

export declare class HttpApplicationService implements IApplicationService {
    constructor(app: IApplication);

    getApplication(): IApplication;
}

export declare interface PreExecuteResultArgs {
    context?: HttpContext;
    target?: any;
}

export declare interface BeginRequestHandler {
    beginRequest(context: HttpContext, callback: (err?: Error) => void)
}

export declare interface ValidateRequestHandler {
    validateRequest(context: HttpContext, callback: (err?: Error) => void)
}

export declare interface AuthenticateRequestHandler {
    authenticateRequest(context: HttpContext, callback: (err?: Error) => void)
}

export declare interface AuthorizeRequestHandler {
    authorizeRequest(context: HttpContext, callback: (err?: Error) => void)
}


export declare interface MapRequestHandler {
    mapRequest(context: HttpContext, callback: (err?: Error) => void)
}


export declare interface PostMapRequestHandler {
    postMapRequest(context: HttpContext, callback: (err?: Error) => void)
}

export declare interface ProcessRequestHandler {
    processRequest(context: HttpContext, callback: (err?: Error) => void)
}

export declare interface PreExecuteResultHandler {
    preExecuteResult(args: PreExecuteResultArgs, callback: (err?: Error) => void)
}

export declare interface PostExecuteResultHandler {
    postExecuteResult(args: PreExecuteResultArgs, callback: (err?: Error) => void)
}

export declare interface EndRequestHandler {
    endRequest(context: HttpContext, callback: (err?: Error) => void)
}


export declare interface HttpHandler extends BeginRequestHandler,
    ValidateRequestHandler, AuthenticateRequestHandler, AuthorizeRequestHandler,
    MapRequestHandler, PostMapRequestHandler, PreExecuteResultHandler, PostExecuteResultHandler,
    EndRequestHandler {

}
