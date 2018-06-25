/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {HttpContext} from "./context";
import {Moment} from "moment";

export declare class HtmlViewHelper {
    constructor(context: HttpContext);

    context: HttpContext;

    static create(context: HttpContext): HtmlViewHelper;

    antiforgery(): string;

    lang(): string;

    moment(value: any): Moment;

    numeral(value: any): any;

    getRequestLink(): any;

    resolveUrl(appRelativeUrl: string): string;

}