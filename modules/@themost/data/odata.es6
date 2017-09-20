/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */


'use strict';
import _ from 'lodash';
import {ConfigurationStrategy,ConfigurationBase} from '@themost/common/config';
import {Args} from "@themost/common/utils";
import {DataConfigurationStrategy, SchemaLoaderStrategy} from "./config";
import {DataModel} from "./model";
import {DataContext} from "./types";
import {XDocument} from 'most-xml';
import Q from 'q';
const nameProperty = Symbol('name');
const entityTypesProperty = Symbol('entityTypes');
const ignoreEntityTypesProperty = Symbol('ignoredEntityTypes');

/**
 * @class
 * @abstract
 */
export class EdmType {

}

EdmType.EdmBinary = "Edm.Binary";
EdmType.EdmBoolean="Edm.Boolean";
EdmType.EdmByte="Edm.Byte";
EdmType.EdmBoolean="Edm.Date";
EdmType.EdmDateTimeOffset="Edm.DateTimeOffset";
EdmType.EdmDouble="Edm.Double";
EdmType.EdmDecimal="Edm.Decimal";
EdmType.EdmDuration="Edm.Duration";
EdmType.EdmGuid="Edm.Guid";
EdmType.EdmInt16="Edm.Int16";
EdmType.EdmInt32="Edm.Int32";
EdmType.EdmInt64="Edm.Int64";
EdmType.EdmSByte="Edm.SByte";
EdmType.EdmSingle="Edm.Single";
EdmType.EdmStream="Edm.Stream";
EdmType.EdmString="Edm.String";
EdmType.EdmTimeOfDay="Edm.TimeOfDay";

/**
 * @class
 * @abstract
 */
export class EdmMultiplicity {

}
EdmMultiplicity.Many = "Many";
EdmMultiplicity.One = "One";
EdmMultiplicity.Unknown = "Unknown";
EdmMultiplicity.ZeroOrOne = "ZeroOrOne";

/**
 * @class
 */
export class EntityTypeConfiguration {
    /**
     *
     * @param {string} name
     */
    constructor(name) {
        Args.notString(name, 'Entity type name');
        this[nameProperty] = name;
        this.property = [];
        this.ignoredProperty = [];
        this.navigationProperty = [];
    }

    get name() {
        return this[nameProperty];
    }

    /**
     * @param {string} name
     */
    derivesFrom(name) {
        Args.notString(name,"Enity type name");
        this.baseType = name;
    }

    /**
     * Adds a new EDM primitive property to this entity type.
     * @param {string} name
     * @param {string} type
     * @param {boolean=} nullable
     * @returns EntityTypeConfiguration
     */
    addProperty(name, type, nullable) {
        Args.notString(name,"Property name");
        const exists =_.findIndex(this.property, (x)=> {
            return x.name === name;
        });
        if (exists<0) {
            const p = {
                "name":name,
                "type":type,
                "nullable":_.isBoolean(nullable) ? nullable : true
            };
            this.property.push(p);
        }
        else {
            _.assign(this.property[exists], {
                "type":type,
                "nullable":_.isBoolean(nullable) ? nullable : true
            });
        }
        return this;
    }

    /**
     * Adds a new EDM navigation property to this entity type.
     * @param {string} name
     * @param {string} type
     * @param {string} multiplicity
     * @returns EntityTypeConfiguration
     */
    addNavigationProperty(name, type, multiplicity) {
        Args.notString(name,"Property name");
        const exists =_.findIndex(this.navigationProperty, (x)=> {
            return x.name === name;
        });

        const p = {
            "name":name,
            "type": (multiplicity==="Many") ? `Collection(${type})` : type
        };
        if (multiplicity===EdmMultiplicity.ZeroOrOne) {
            p.nullable = true;
        }

        if (exists<0) {
            this.navigationProperty.push(p);
        }
        else {
            _.assign(this.navigationProperty[exists], p);
        }
        return this;
    }

    /**
     * Removes the navigation property from the entity.
     * @param {string} name
     * @returns {EntityTypeConfiguration}
     */
    removeNavigationProperty(name) {
        Args.notString(name,"Property name");
        const hasProperty =_.findIndex(this.property, (x)=> {
            return x.name === name;
        });
        if (hasProperty>=0) {
            this.property.splice(hasProperty, 1);
        }
        return this;
    }

    /**
     * Ignores a property from the entity
     * @param name
     * @returns {EntityTypeConfiguration}
     */
    ignore(name) {
        Args.notString(name,"Property name");
        const hasProperty =_.findIndex(this.ignoredProperty, (x)=> {
            return x.name === name;
        });
        if (hasProperty>=0) {
            return this;
        }
        this.ignoredProperty.push(name);

    }

    /**
     * Removes the property from the entity.
     * @param {string} name
     * @returns {EntityTypeConfiguration}
     */
    removeProperty(name) {
        Args.notString(name,"Property name");
        const hasProperty =_.findIndex(this.property, (x)=> {
            return x.name === name;
        });
        if (hasProperty>=0) {
            this.property.splice(hasProperty, 1);
        }
        return this;
    }

    /**
     * Removes the property from the entity keys collection.
     * @param {string} name
     * @returns {EntityTypeConfiguration}
     */
    removeKey(name) {
        Args.notString(name,"Key name");
        if (this.key && _.isArray(this.key.propertyRef)) {
            const hasKeyIndex = _.findIndex(this.key.propertyRef, (x)=> {
                return x.name === name;
            });
            if (hasKeyIndex<0) {
                return this;
            }
            this.key.propertyRef.splice(hasKeyIndex, 1);
            return this;
        }
    }

    /**
     * Configures the key property(s) for this entity type.
     * @param {string} name
     * @param {string} type
     * @returns {EntityTypeConfiguration}
     */
    hasKey(name, type) {
        this.addProperty(name, type, false);
        this.key = {
            propertyRef: [
                {
                    "name": name
                }
            ]
        };
        return this;
    }

}

/**
 * @classdesc Represents the OData model builder of an HTTP application
 * @class
 */
export class ODataModelBuilder extends ConfigurationStrategy {
    /**
     *
     * @param {ConfigurationBase} config
     */
    constructor(config) {
        super(config);
        this[entityTypesProperty] = {};
        this[ignoreEntityTypesProperty] = [];
    }

    /**
     * Gets a registered entity type
     * @param {string} name
     * @returns {EntityTypeConfiguration}
     */
    getEntity(name) {
        Args.notString(name, 'Entity type name');
        return this[entityTypesProperty][name];
    }

    /**
     * Registers an entity type
     * @param {string} name
     * @returns {EntityTypeConfiguration}
     */
    addEntity(name) {
        if (!this.hasEntity(name)) {
            this[entityTypesProperty][name] = new EntityTypeConfiguration(name);
        }
        return this.getEntity(name)
    }

    ignore(name) {
        const hasEntity = this[ignoreEntityTypesProperty].indexOf(name);
        if (hasEntity < 0) {
            this[ignoreEntityTypesProperty].push(name);
        }
        return this;
    }

    /**
     * Checks if the given entity type exists in entity's collection
     * @param {string} name
     * @returns {boolean}
     */
    hasEntity(name) {
        return this[entityTypesProperty].hasOwnProperty(name);
    }

    /**
     * Creates and returns a structure based on the configuration performed using this builder
     * @returns {Promise}
     */
    getEdm() {
        const self = this;
        return Q.promise((resolve, reject) => {
            try{
                const keys = _.filter(_.keys(self[entityTypesProperty]), (x)=> {
                   return this[ignoreEntityTypesProperty].indexOf(x)<0;
                });
                const entities = {};
                _.forEach(keys, (key)=> {
                    entities[key] = self[entityTypesProperty][key];
                });

                return resolve(entities);
            }
            catch(err) {
                return reject(err);
            }
        });
    }

    /**
     * Creates and returns an XML structure based on the configuration performed using this builder
     * @returns {Promise<XDocument>}
     */
    getEdmDocument() {
        const self = this;
        return Q.promise((resolve, reject) => {
            try{
                return self.getEdm().then((entities)=> {
                    const doc = new XDocument();
                    const rootElement = doc.createElement("edmx:Edmx");
                    rootElement.setAttribute("xmlns:edmx", "http://docs.oasis-open.org/odata/ns/edmx");
                    rootElement.setAttribute("Version","4.0");
                    doc.appendChild(rootElement);

                    const dataServicesElement = doc.createElement("edmx:DataServices");
                    const schemaElement = doc.createElement("Schema");
                    schemaElement.setAttribute("xmlns", "http://docs.oasis-open.org/odata/ns/edm");
                    //schemaElement.setAttribute("Namespace", "Most.Data.Models");

                    //append edmx:DataServices > Schema
                    dataServicesElement.appendChild(schemaElement);
                    _.forEach(entities,
                        /**
                         *
                         * @param {EntityTypeConfiguration} entityType
                         */
                        (entityType) => {

                            //create element Schema > EntityType
                            const entityTypeElement = doc.createElement("EntityType");
                            entityTypeElement.setAttribute("Name", entityType.name);
                            if (entityType.baseType) {
                                entityTypeElement.setAttribute("BaseType", entityType.baseType);
                            }

                            if (entityType.key && entityType.key.propertyRef) {
                                const keyElement = doc.createElement('Key');
                                _.forEach(entityType.key.propertyRef, (key)=> {
                                    const keyRefElement = doc.createElement('PropertyRef');
                                    keyRefElement.setAttribute("Name",key.name);
                                    keyElement.appendChild(keyRefElement);
                                });
                                entityTypeElement.appendChild(keyElement);
                            }
                            //enumerate properties
                            _.forEach(entityType.property, function(x) {
                                const propertyElement = doc.createElement('Property');
                                propertyElement.setAttribute("Name",x.name);
                                propertyElement.setAttribute("Type",x.type);
                                if (_.isBoolean(x.nullable) && (x.nullable===false)) {
                                    propertyElement.setAttribute("Nullable",false);
                                }
                                entityTypeElement.appendChild(propertyElement);
                            });
                            //enumerate navigation properties
                            _.forEach(entityType.navigationProperty, function(x) {
                                const propertyElement = doc.createElement('NavigationProperty');
                                propertyElement.setAttribute("Name",x.name);
                                propertyElement.setAttribute("Type",x.type);
                                if (!x.nullable) {
                                    propertyElement.setAttribute("Nullable",false);
                                }
                                entityTypeElement.appendChild(propertyElement);
                            });
                            //append Schema > EntityType
                            schemaElement.appendChild(entityTypeElement);
                        });

                    //append edmx:Edmx > edmx:DataServices
                    rootElement.appendChild(dataServicesElement);
                    return resolve(doc);
                });
            }
            catch(err) {
                return reject(err);
            }
        });

    }

}

class EntityDataContext extends DataContext {
    /**
     * @param {DataConfigurationStrategy=} configuration
     */
    constructor(configuration) {
        super();
        this.getConfiguration = ()=> configuration;
    }

    model(name) {
        if (this.getConfiguration().dataTypes.hasOwnProperty(name)) {
            return;
        }
        const definition = this.getConfiguration().model(name);
        if (_.isNil(definition)) {
            return;
        }
        return new DataModel(definition, this);
    }

}

/**
 * @class
 * @augments ODataModelBuilder
 */
export class ODataConventionModelBuilder extends ODataModelBuilder {
    /**
     *
     * @param {ConfigurationBase} config
     */
    constructor(config) {
        super(config);
    }

    /**
     * Automatically registers an entity type from the given model
     * @param {string} name
     */
    addEntity(name) {
        const self = this;
        const superAddEntity = super.addEntity;
        /**
         * @type {EntityTypeConfiguration}
         */
        if (this.hasEntity(name)) {
            return this.getEntity(name);
        }
        /**
         * @type {DataConfigurationStrategy|*}
         */
        const strategy = self.getConfiguration().getStrategy(DataConfigurationStrategy);
        if (strategy) {
            /**
             * @type {EntityTypeConfiguration}
             */
            let entityType = superAddEntity.bind(self)(name);
            /**
             * @type {DataModel}
             */
            const definition = strategy.model(name);
            if (definition) {
                const model = new DataModel(definition, new EntityDataContext(strategy));
                let inheritedAttributes = [];
                if (model.inherits) {
                    //add base entity
                    self.addEntity(model.inherits);
                    //set inheritance
                    entityType.derivesFrom(model.inherits);
                    const baseModel = model.base();
                    if (baseModel) {
                        inheritedAttributes = baseModel.attributeNames;
                    }
                }
                const primaryKey = model.getPrimaryKey();
                _.forEach(_.filter(model.attributes, function(x) {
                    if (x.primary && model.inherits) {
                        return false;
                    }
                    return (x.model === model.name) && (inheritedAttributes.indexOf(x.name)<0);
                }), function(x) {
                    const name = x.property || x.name;
                    const mapping = model.inferMapping(x.name);
                    if (_.isNil(mapping)) {
                        //find data type
                        const dataType = strategy.dataTypes[x.type];
                        //add property
                        const edmType = _.isObject(dataType) ? (dataType.hasOwnProperty("edmtype") ? dataType["edmtype"]: "Edm." + x.type) : x.type;
                        entityType.addProperty(name, edmType, x.nullable);
                        if (x.primary) {
                            entityType.hasKey(name, edmType);
                        }
                    }
                    else {
                        //add navigation property
                        entityType.addNavigationProperty(name, x.type, x.many ? EdmMultiplicity.Many: EdmMultiplicity.One);
                        //add navigation property entity (if type is not a primitive type)
                        if (!strategy.dataTypes.hasOwnProperty(x.type)) {
                            self.addEntity(x.type);
                        }
                    }
                });
            }
            return entityType;
        }
        return superAddEntity.bind(self)(name);
    }

    /**
     * @returns {Promise}
     */
    initialize() {
        const self = this;
        return Q.promise((resolve, reject) => {
            /**
             * @type {SchemaLoaderStrategy|DefaultSchemaLoaderStrategy|*}
             */
            const schemaLoader = self.getConfiguration().getStrategy(SchemaLoaderStrategy);
            if (typeof schemaLoader.getModelPath === 'function') {
                const nativeFsModule = 'fs';
                const fs = require(nativeFsModule);
                const modelPath = schemaLoader.getModelPath();
                if (_.isNil(modelPath)) {
                    return resolve();
                }
                return fs.readdir(modelPath, (err, files) => {
                    try {
                        if (err) {
                            return reject(err);
                        }
                        const models = _.map( _.filter(files, function(x) {
                            return /\.json$/.test(x);
                        }), (x) => {
                            return /(.*?)\.json$/.exec(x)[1];
                        });
                        _.forEach(models, (x)=> {
                            if (!_.isNil(x)) {
                                self.addEntity(x);
                            }
                        });
                        return resolve();
                    }
                    catch(err) {
                        return reject(err);
                    }
                });
            }
            return resolve();
        });

    }

    /**
     * Creates and returns a structure based on the configuration performed using this builder
     * @returns {Promise}
     */
    getEdm() {
        const self = this, superGetEdm = super.getEdm;
        return Q.promise((resolve, reject) => {
            try{
                return superGetEdm.bind(self)().then((result) => {
                    return resolve(result);
                }).catch((err)=> {
                    return reject(err);
                });
            }
            catch(err) {
                return reject(err);
            }
        });
    }



}