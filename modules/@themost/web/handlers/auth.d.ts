/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {
    HttpApplicationService,
    PreExecuteResultHandler,
    AuthenticateRequestHandler,
    PreExecuteResultArgs
} from "../types";
import {HttpContext} from "../context";

export declare abstract class AuthStrategy extends HttpApplicationService {

    abstract setAuthCookie(thisContext: HttpContext, userName: string, options: any);

    abstract getAuthCookie(thisContext: HttpContext): any;

    abstract login(thisContext: HttpContext, userName: string, userPassword: string);

    abstract logout(thisContext: HttpContext);

    abstract getUnattendedExecutionAccount(): string;

    abstract getOptions(): any;
}

export declare class DefaultAuthStrategy extends AuthStrategy {

    getAuthCookie(thisContext: HttpContext): any;

    getOptions(): any;

    getUnattendedExecutionAccount(): string;

    login(thisContext: HttpContext, userName: string, userPassword: string);

    logout(thisContext: HttpContext);

    setAuthCookie(thisContext: HttpContext, userName: string, options: any);

}

export declare abstract class EncryptionStrategy extends HttpApplicationService {
    abstract encrypt(data: any);
    abstract decrypt(data: string);
}

export declare class DefaultEncryptionStrategy extends EncryptionStrategy {
    encrypt(data: any);
    decrypt(data: string);
}

export declare class AuthHandler implements AuthenticateRequestHandler, PreExecuteResultHandler {

    authenticateRequest(context: HttpContext, callback: (err?: Error) => void);

    preExecuteResult(args: PreExecuteResultArgs, callback: (err?: Error) => void);

}

export declare function createInstance(): AuthHandler;