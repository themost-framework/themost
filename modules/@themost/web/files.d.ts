/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {HttpContext} from "./context";

export declare abstract class FileStorage {
    abstract copyFrom(context: HttpContext, src: string, attrs: any, callback: (err?: Error, res?: any) => void): void;

    abstract copyTo(context: HttpContext, item: any, dest: string, callback: (err?: Error, res?: any) => void): void;

    abstract resolvePhysicalPath(context: HttpContext, item: any, callback: (err?: Error, res?: any) => void): void;

    abstract resolveUrl(context: HttpContext, item: any, callback: (err?: Error, res?: any) => void): void;

    abstract createReadStream(context: HttpContext, item: any, callback: (err?: Error, res?: any) => void): void;

    abstract init(callback: (err?: Error, res?: any) => void): void;

    abstract find(context: HttpContext, query: any, callback: (err?: Error, res?: any) => void): void;

    abstract findOne(context: HttpContext, query: any, callback: (err?: Error, res?: any) => void): void;

    abstract remove(context: HttpContext, item: any, callback: (err?: Error, res?: any) => void): void;
}

export declare class AttachmentFileSystemStorage extends FileStorage {
    constructor(physicalPath: string);

    root: string;

    copyFrom(context: HttpContext, src: string, attrs: any, callback: (err?: Error, res?: any) => void): void;

    copyTo(context: HttpContext, item: any, dest: string, callback: (err?: Error, res?: any) => void): void;

    createReadStream(context: HttpContext, item: any, callback: (err?: Error, res?: any) => void): void;

    find(context: HttpContext, query: any, callback: (err?: Error, res?: any) => void): void;

    findOne(context: HttpContext, query: any, callback: (err?: Error, res?: any) => void): void;

    init(callback: (err?: Error, res?: any) => void): void;

    remove(context: HttpContext, item: any, callback: (err?: Error, res?: any) => void): void;

    resolvePhysicalPath(context: HttpContext, item: any, callback: (err?: Error, res?: any) => void): void;

    resolveUrl(context: HttpContext, item: any, callback: (err?: Error, res?: any) => void): void;

    exists(context: HttpContext, query: any, callback: (err?: Error, res?: any) => void): void;

}

