/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {HttpApplicationService} from "./types";

export declare abstract class CacheStrategy extends HttpApplicationService {
    abstract add(key: string, value: any, absoluteExpiration?: number): Promise<any>;

    abstract remove(key: string): Promise<any>;

    abstract clear(): Promise<any>;

    abstract get(key: string): Promise<any>;

    abstract getOrDefault(key: string, fn: Promise<any>, absoluteExpiration?: number): Promise<any>;

}

export declare class DefaultCacheStrategy extends CacheStrategy {
    add(key: string, value: any, absoluteExpiration?: number): Promise<any>;

    clear(): Promise<any>;

    get(key: string): Promise<any>;

    getOrDefault(key: string, fn: Promise<any>, absoluteExpiration?: number): Promise<any>;

    remove(key: string): Promise<any>;

}