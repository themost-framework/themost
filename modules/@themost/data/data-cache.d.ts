/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */

export declare class DataCache {
    init(callback: (err?: Error) => void): void;
    remove(key: string, callback: (err?: Error) => void): void;
    removeAll(callback: (err?: Error) => void): void;
    add(key: string, value: any, ttl?: number, callback?: (err?: Error) => void): void;
    ensure(key: string, getFunc: (err?: Error, res?: any) => void, callback?: (err?: Error) => void): void;
    get(key: string, callback?: (err?: Error, res?: any) => void): void;
    static getCurrent(): DataCache;
}

export declare function getCurrent(): DataCache;