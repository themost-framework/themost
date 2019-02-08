/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */

import {IncomingMessage, ServerResponse} from 'http';
import {HttpApplication} from "./app";
import {HttpConfiguration} from "./config";
import {DefaultDataContext} from '@themost/data/data-context';

export declare class HttpContext extends DefaultDataContext {
		
	constructor(httpRequest : IncomingMessage, httpResponse : ServerResponse);
	getApplication(): HttpApplication;
	getConfiguration(): HttpConfiguration;
	getParam(name : any): any;
	hasParam(name : any): boolean;
	init(): void;
	cookie(name : string, value : any, expires? : Date, domain? : string, cookiePath? : string): void;
	getCookie(name : string): any;
	moment(p : any): void;
	setCookie(name : string, value : any, expires? : Date, domain? : string, cpath? : string): void;
	setLangCookie(lang : any): void;
	removeCookie(name : string, domain? : string, cpath? : string): string;
	unattended(fn : Function, callback : Function): void;
	culture(value? : string): HttpContext;
	validateAntiForgeryToken(csrfToken? : string): void;
	writeFile(file : string): void;
	is(method : string | Array<any>): boolean;
	isPost(): boolean;
	handle(method : string | Array<any>, fn : Function):HttpContext;
	catch(callback : (() => void) | Function): HttpContext;
	unhandle(fn : Function): HttpContext;
	handlePost(fn : Function): HttpContext;
	handleGet(fn : Function): HttpContext;
	handlePut(fn : Function): HttpContext;
	handleDelete(fn : Function): HttpContext;
	currentHandler(value? : any): HttpContext;
	translate(text : string, lib? : string): void;
	engine(extension : string): void;
	request : IncomingMessage;
	response: ServerResponse;
	resolveUrl(appRelativeUrl: string): string;
}

