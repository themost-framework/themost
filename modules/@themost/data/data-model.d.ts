/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {DataAssociationMapping, DataContext, DataField} from "./types";
import {SequentialEventEmitter} from "@themost/common";
import {DataQueryable} from "./data-queryable";
import {DataObject} from "./data-object";

export declare class DataModel extends SequentialEventEmitter{
    constructor(obj:any);

    hidden?: boolean;
    sealed?: boolean;
    abstract?: boolean;
    version: string;
    caching?: string;
    fields: Array<DataField>;
    eventListeners?: Array<any>;
    constraints?: Array<any>;
    views?: Array<any>;
    privileges?: Array<any>;
    context: DataContext;
    readonly sourceAdapter?: string;
    readonly viewAdapter?: string;
    silent(value?: boolean): DataModel;
    readonly attributes?: Array<DataField>;
    readonly primaryKey: any;
    readonly attributeNames: Array<string>;
    readonly constraintCollection: Array<any>;

    getPrimaryKey(): DataField;
    isSilent(): boolean;
    getDataObjectType(): any;
    initialize(): void;
    clone(): DataModel;
    join(model: string): DataModel;
    where(attr: string): DataQueryable;
    search(text: string): DataQueryable;
    asQueryable(): DataQueryable;
    filter(params: any, callback?: (err?: Error, res?: any) => void): void;
    find(obj: any):DataQueryable;
    select(...attr: any[]): DataQueryable;
    orderBy(attr: any): DataQueryable;
    orderByDescending(attr: any): DataQueryable;
    take(n: number): DataQueryable;
    getList():Promise<any>;
    skip(n: number): DataQueryable;
    base(): DataModel;
    convert(obj: any): DataObject;
    cast(obj: any, state: number): any;
    save(obj: any): Promise<any>;
    inferState(obj: any, callback: (err?: Error, res?: any) => void): void;
    getSuperTypes(): Array<string>;
    update(obj: any): Promise<any>;
    insert(obj: any): Promise<any>;
    remove(obj: any): Promise<any>;
    migrate(callback: (err?: Error, res?: any) => void): void;
    key(): any;
    field(name: string): DataField;
    getDataView(name: string): any;
    inferMapping(name: string): DataAssociationMapping;
    validateForUpdate(obj: any): Promise<any>;
    validateForInsert(obj: any): Promise<any>;
    levels(value: number);
    getSubTypes(): Promise<string>;
    getReferenceMappings(deep?: boolean): Array<any>;
    getAttribute(name: string);
    getTypedItems(): Promise<DataObject|any>;
    getItems(): Promise<any>;
    getTypedList():Promise<any>;
}
