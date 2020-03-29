/**
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {ConfigurationBase, ConfigurationStrategy} from "@themost/common/config";

export declare interface DataTypePropertiesConfiguration {
    pattern?: string;
    patternMessage?: string;
    minValue?: any;
    maxValue?: any;

}

export declare interface DataTypeConfiguration {
    comment?: string;
    properties?: DataTypeConfiguration;
    label?: string;
    url?: string;
    type?: string;
    sqltype?: string;
    instances?: Array<any>;
    supertypes?: Array<string>;
    version: string;

}

export declare interface DataAdapterConfiguration {
    name: string;
    invariantName: string;
    default?: boolean;
    options: any;

}

export declare interface DataAdapterTypeConfiguration {
    name: string;
    invariantName: string;
    type: string;

}

export declare interface AuthSettingsConfiguration {
    name: string;
    unattendedExecutionAccount: string;
    timeout?: number;
    slidingExpiration: boolean;
    loginPage?: string;
}

export declare class DataConfiguration {
    constructor(configPath: string);
    static getCurrent(): DataConfiguration;
    static setCurrent(config: DataConfiguration): DataConfiguration;
    static getNamedConfiguration(name: string);

}
export declare class DataConfigurationStrategy extends ConfigurationStrategy{
    constructor(config:ConfigurationBase);
    static getCurrent(): DataConfigurationStrategy;

    readonly dataTypes: Map<string, DataTypeConfiguration>;
    readonly adapters: Array<DataAdapterConfiguration>;
    readonly adapterTypes: Array<DataAdapterTypeConfiguration>;
    getAuthSettings(): AuthSettingsConfiguration;
    getAdapterType(invariantName: string): DataAdapterTypeConfiguration;
    hasDataType(name: string): boolean;
    getModelDefinition(name: string): any;
    setModelDefinition(data: any): DataConfigurationStrategy;
    model(name: string): any;

}

export declare class SchemaLoaderStrategy extends ConfigurationStrategy {
    constructor(config:ConfigurationBase);
    getModelDefinition(name: string): any;
    setModelDefinition(data: any): SchemaLoaderStrategy;
    getModels(): Array<string>;
    readSync: Array<string>;

}

export declare interface SchemaLoaderType {
    loaderType?: string;
    options?: any;
}

export declare interface DefaultSchemaLoaderStrategyOptions {
    usePlural?: boolean;
    loaders?: Array<SchemaLoaderType>
}

export declare class FileSchemaLoaderStrategy extends SchemaLoaderStrategy {
    getModelPath(): string;
    setModelPath(p: string): FileSchemaLoaderStrategy;
}

export declare class DefaultSchemaLoaderStrategy extends FileSchemaLoaderStrategy {
    options: DefaultSchemaLoaderStrategyOptions;
    loaders: Array<SchemaLoaderStrategy>;
}

export declare abstract class ModelClassLoaderStrategy extends ConfigurationStrategy {
    abstract resolve(model: string): void;

}

export declare abstract class DefaultModelClassLoaderStrategy extends ModelClassLoaderStrategy {
    abstract resolve(model: string): void;

}

export declare function getCurrent(): DataConfiguration;
export declare function setCurrent(config: DataConfiguration): DataConfiguration;
export declare function getNamedConfiguration(name: string): DataConfiguration;
