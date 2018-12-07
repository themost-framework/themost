/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {DataQueryable} from "./data-queryable";
import {DataObject} from "./data-object";
import {DataAssociationMapping, DataField} from "./types";
import {DataModel} from "./data-model";

export declare class DataObjectJunction extends DataQueryable {
    parent: DataObject;
    mapping: DataAssociationMapping;
    getBaseModel(): DataModel;
    getChildField(): string;
    getParentField(): string;
    insert(obj: any): Promise<any>;
    remove(obj: any): Promise<any>;
    removeAll(): Promise<any>;
    migrate(callback: (err?: Error) => void);
}