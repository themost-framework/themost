
/**
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {DataModel} from "./data-model";
import {DataObject} from "./data-object";
import {ConfigurationBase, SequentialEventEmitter} from "../common";

export declare function DataAdapterCallback(err?:Error, result?:any);

export declare class DataAdapter {
    /**
     *
     * @param options
     */
    constructor(options:any);
    /**
     *
     */
    rawConnection:any;
    /**
     *
     */
    options:any;

    /**
     *
     * @param {(err?: Error) => void} callback
     */
    open(callback:(err?:Error) => void);

    /**
     *
     * @param {(err?: Error) => void} callback
     */
    close(callback:(err?:Error) => void);

    /**
     *
     * @param query
     * @param {Array<any>} values
     * @param {(err?: Error, result?: any) => void} callback
     */
    execute(query:any, values:Array<any>, callback:(err?:Error, result?:any) => void);

    /**
     *
     * @param {string} entity
     * @param {string} attribute
     * @param {(err?: Error, result?: any) => void} callback
     */
    selectIdentity(entity:string, attribute:string , callback?:(err?:Error, result?:any) => void);

    /**
     *
     * @param {Function} fn
     * @param {(err?: Error) => void} callback
     */
    executeInTransaction(fn:Function, callback:(err?:Error) => void);

    /**
     *
     * @param {string} name
     * @param query
     * @param {(err?: Error) => void} callback
     */
    createView(name:string, query:any, callback:(err?:Error) => void);
}

export declare class DataContext extends SequentialEventEmitter {
    /**
     *
     * @param {*} name
     * @returns {DataModel}
     */
    model(name:any):DataModel

    /**
     *
     */
    db:DataAdapter;

    /**
     *
     * @returns {ConfigurationBase}
     */
    getConfiguration():ConfigurationBase;

    /**
     *
     * @param {(err?: Error) => void} callback
     */
    finalize(callback?:(err?:Error) => void);
}

export declare class DataContextEmitter {
    ensureContext:void;
}

export declare interface DataModelPrivilege {
    type: string;
    mask: number;
    account?: string;
    filter?: string;
}

export declare class DataAssociationMapping {
    constructor(obj: any);
    associationAdapter?: string;
    parentModel?: string;
    childModel?: string;
    parentField?: string;
    childField?: string;
    refersTo?: string;
    associationObjectField?: string;
    associationValueField?: string;
    cascade?: any;
    associationType?: string;
    select?: Array<string>;
    privileges?: Array<DataModelPrivilege>;
  
}

export declare class DataField {
    name: string;
    property?: string;
    title?: string;
    nullable?: boolean;
    type?: string;
    primary?: boolean;
    many?: boolean;
    model?: string;
    value?: string;
    calculation?: string;
    readonly?: boolean;
    editable?: boolean;
    mapping?: DataAssociationMapping;
    expandable?: boolean;
    nested?: boolean;
    description?: string;
    help?: string;
    validation?: any;
    virtual?: boolean;
    multiplicity?: string;
    indexed?: boolean;
    size?: number;
}

export declare class DataEventArgs {
    model: DataModel;
    target: DataObject;
    state: number;
    emitter?: any;
    query?: any;
    previous?: any
}

export declare interface BeforeSaveEventListener {
    beforeSave(event: DataEventArgs, callback: (err?: Error) => void): void;
}

export declare interface AfterSaveEventListener {
    afterSave(event: DataEventArgs, callback: (err?: Error) => void): void;
}

export declare interface BeforeRemoveEventListener {
    beforeRemove(event: DataEventArgs, callback: (err?: Error) => void): void;
}

export declare interface AfterRemoveEventListener {
    afterRemove(event: DataEventArgs, callback: (err?: Error) => void): void;
}

export declare interface BeforeUpgradeEventListener {
    beforeUpgrade(event: DataEventArgs, callback: (err?: Error) => void): void;
}

export declare interface AfterUpgradeEventListener {
    afterUpgrade(event: DataEventArgs, callback: (err?: Error) => void): void;
}

export declare interface BeforeExecuteEventListener {
    beforeExecute(event: DataEventArgs, callback: (err?: Error) => void): void;
}

export declare interface AfterExecuteEventListener {
    afterExecute(event: DataEventArgs, callback: (err?: Error) => void): void;
}

export declare interface TypeParser {
    parseInteger(val: any): number;
    parseCounter(val: any): number;
    parseFloat(val: any): number;
    parseNumber(val: any): number;
    parseDateTime(val: any): Date;
    parseDate(val: any): Date;
    parseBoolean(val: any): boolean;
    parseText(val: any): string;

}

export declare const parsers: TypeParser;
