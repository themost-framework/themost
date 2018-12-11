/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
export declare class HttpRoute {
    constructor(route: string);
    constructor(route: any);
    isMatch(urlToMatch: string): boolean;
    routeData?: any;
    route?: any;
    routeIndex?: number;
    patterns: any;
    parsers: any;
}

export declare function createInstance(): HttpRoute;