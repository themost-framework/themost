/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {HttpContext} from "./context";
import {HtmlWriter} from "@themost/common/html";
import {HttpViewEngineConfiguration} from "./config";


export declare class HttpResult {
    /**
     * @constructor
     */
    constructor();
    contentType?: string;
    contentEncoding?: string;

    status(status?: number): HttpResult;

    public execute(context: HttpContext, callback: (err?: Error) => void);
}

export declare class HttpContentResult extends HttpResult {

    constructor(content: string|Buffer);

    data: any;
}

export declare class HttpJsonResult extends HttpResult {

    constructor(data: any);

    data: any;
}

export declare class HttpXmlResult extends HttpResult {

    constructor(data: any);

    data: any;
}

export declare class HttpJavascriptResult extends HttpResult {

    constructor(data: any);

    data: any;
}

export declare class HttpViewResult extends HttpResult {
    constructor(name?: string, data?: any);
    setName(name: string): HttpViewResult;
    static resolveViewPath(context: HttpContext, controller: string, view: string, engine: HttpViewEngineConfiguration, callback: (err?: Error, res?: string) => void);
}


export declare class HttpFileResult extends HttpResult {
    constructor(physicalPath: string, fileName: string);
    physicalPath: string;
    fileName: string;

}


export declare class HttpRedirectResult extends HttpResult {
    constructor(url: string);
    url: string;

}


export declare class HttpEmptyResult extends HttpResult {
    constructor();

}


export declare class HttpController {

    context: HttpContext;
    view(data?: any): HttpViewResult;
    html(data?: any): HttpViewResult;
    htm(data?: any): HttpViewResult;
    js(script?: string): HttpJavascriptResult;
    jsvar(name: string, obj: any): HttpJavascriptResult;
    result(data?: any): HttpResult;
    content(data?: any): HttpContentResult;
    json(data?: any): HttpJsonResult;
    xml(data?: any): HttpXmlResult;
    file(physicalPath: string, fileName: string): HttpFileResult;
    redirect(url: string): HttpRedirectResult;
    empty(): HttpEmptyResult;
    toPromise(resolver: (resolve: void, reject?: void) => Promise<any>): Promise<any>;
    next(): HttpNextResult;

}

export declare class HttpViewContext {
    constructor(context: HttpContext);
    body?: string;
    title?: string;
    layout?: string;
    data?: any;
    context: HttpContext;
    readonly writer: HtmlWriter;
    readonly model: any;
    init(): void;
    render(url: string, callback: (err?: Error, res?: any) => void);
    translate(key: string): string;
}

export declare class HttpNextResult extends HttpResult {
    constructor();

}