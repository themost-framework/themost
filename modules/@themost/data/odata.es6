/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import _ from 'lodash';
import {ConfigurationStrategy} from '@themost/common/config';
import {Args} from "@themost/common/utils";
import {DataConfigurationStrategy, SchemaLoaderStrategy} from "./config";
import {DataModel} from "./model";
import {DataContext} from "./types";
import {XDocument} from 'most-xml';
import Q from 'q';
const nameProperty = Symbol('name');
const entityTypesProperty = Symbol('entityTypes');
const entityContainerProperty = Symbol('entityContainer');
const ignoreEntityTypesProperty = Symbol('ignoredEntityTypes');
const builderProperty = Symbol('builder');
const entityTypeProperty = Symbol('entityType');
const edmProperty = Symbol('edm');
import pluralize from 'pluralize';

const SchemaDefaultNamespace = "Edm.Models";

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
 * @enum
 */
export class EdmMultiplicity {

}
EdmMultiplicity.Many = "Many";
EdmMultiplicity.One = "One";
EdmMultiplicity.Unknown = "Unknown";
EdmMultiplicity.ZeroOrOne = "ZeroOrOne";

/**
 * @enum
 */
export class EntitySetKind {

}
EntitySetKind.EntitySet = "EntitySet";
EntitySetKind.Singleton = "Singleton";
EntitySetKind.FunctionImport = "FunctionImport";

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
 *
 */
export class EntitySetConfiguration {
    /**
     * @param {ODataModelBuilder} builder
     * @param {string} entityType
     * @param {string} name
     */
    constructor(builder, entityType, name) {
        Args.check(builder instanceof ODataModelBuilder, new TypeError('Invalid argument. Configuration builder must be an instance of ODataModelBuilder class'));
        Args.notString(entityType, 'Entity Type');
        Args.notString(name, 'EntitySet Name');
        this[builderProperty] = builder;
        this[entityTypeProperty] = entityType;
        //ensure entity type
        if (!this[builderProperty].hasEntity(this[entityTypeProperty])) {
            this[builderProperty].addEntity(this[entityTypeProperty]);
        }
        this.name = name;
        this.kind = EntitySetKind.EntitySet;
        //use the given name as entity set URL by default
        this.url = name;
    }

    hasUrl(url) {
        Args.notString(url, 'Entity Resource Path');
        this.url = url;
    }

    getUrl() {
        return this.url;
    }

    /**
     * @returns {EntityTypeConfiguration}
     */
    get entityType() {
        if (!this[builderProperty].hasEntity(this[entityTypeProperty])) {
            return this[builderProperty].addEntity(this[entityTypeProperty]);
        }
        return this[builderProperty].getEntity(this[entityTypeProperty]);
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
        this[entityContainerProperty] = [];
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

    /**
     * Checks if the given entity set exists in entity container
     * @param {string} name
     * @returns {boolean}
     */
    hasEntitySet(name) {
        return _.findIndex(this[entityContainerProperty], (x) => {
            return x.name === name;
        })>=0;
    }

    /**
     * Registers an entity type
     * @param {string} entityType
     * @param {string} name
     * @returns {EntitySetConfiguration}
     */
    addEntitySet(entityType, name) {
        if (!this.hasEntitySet(name)) {
            this[entityContainerProperty].push(new EntitySetConfiguration(this, entityType, name));
        }
        return this.getEntitySet(name);
    }

    /**
     * Gets an entity set
     * @param name
     * @returns {EntitySetConfiguration}
     */
    getEntitySet(name) {
        Args.notString(name, 'EntitySet Name');
        return _.find(this[entityContainerProperty], (x)=> {
            return x.name === name;
        });
    }

    /**
     * Ignores the entity type with the given name
     * @param {string} name
     * @returns {ODataModelBuilder}
     */
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
                const schema = {
                    namespace:SchemaDefaultNamespace,
                    entityType:[],
                    entityContainer: {
                        "name":"DefaultContainer",
                        "entitySet":[]
                    }
                };
                //get entity types by excluding ignored entities
                const keys = _.filter(_.keys(self[entityTypesProperty]), (x)=> {
                    return self[ignoreEntityTypesProperty].indexOf(x)<0;
                });
                //enumerate entity types
                _.forEach(keys, (key)=> {
                    schema.entityType.push(self[entityTypesProperty][key]);
                });
                //enumerate entity sets
                schema.entityContainer.entitySet.push.apply(schema.entityContainer.entitySet, self[entityContainerProperty]);

                return resolve(schema);
            }
            catch(err) {
                return reject(err);
            }
        });
    }

    /**
     * @param {boolean=} all
     * @returns {ODataModelBuilder}
     */
    clean(all) {
        delete this[edmProperty];
        if (typeof all === 'boolean' && all === true) {
            this[entityTypesProperty] = {};
            this[ignoreEntityTypesProperty] = [];
            this[entityContainerProperty] = [];
        }
        return this;
    }

    /**
     * Creates and returns an XML structure based on the configuration performed using this builder
     * @returns {Promise<XDocument>}
     */
    getEdmDocument() {
        const self = this;
        return Q.promise((resolve, reject) => {
            try{
                return self.getEdm().then((schema)=> {
                    const doc = new XDocument();
                    const rootElement = doc.createElement("edmx:Edmx");
                    rootElement.setAttribute("xmlns:edmx", "http://docs.oasis-open.org/odata/ns/edmx");
                    rootElement.setAttribute("Version","4.0");
                    doc.appendChild(rootElement);

                    const dataServicesElement = doc.createElement("edmx:DataServices");
                    const schemaElement = doc.createElement("Schema");
                    schemaElement.setAttribute("xmlns", "http://docs.oasis-open.org/odata/ns/edm");
                    schemaElement.setAttribute("Namespace", schema.namespace);
                    //schemaElement.setAttribute("Namespace", "Most.Data.Models");

                    //append edmx:DataServices > Schema
                    dataServicesElement.appendChild(schemaElement);
                    _.forEach(schema.entityType,
                        /**
                         *
                         * @param {EntityTypeConfiguration} entityType
                         */
                        (entityType) => {

                            //create element Schema > EntityType
                            const entityTypeElement = doc.createElement("EntityType");
                            entityTypeElement.setAttribute("Name", entityType.name);
                            entityTypeElement.setAttribute("OpenType", true);
                            if (entityType.baseType) {
                                entityTypeElement.setAttribute("BaseType", schema.namespace.concat(".", entityType.baseType));
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

                    //create Schema > EntityContainer
                    const entityContainerElement = doc.createElement("EntityContainer");
                    entityContainerElement.setAttribute("Name", schema.entityContainer.name || "DefaultContainer");

                    _.forEach(schema.entityContainer.entitySet,
                        /**
                         * @param {EntitySetConfiguration} child
                         */
                        (child) => {
                            const childElement = doc.createElement(child.kind);
                            childElement.setAttribute("Name", child.name);
                            if ((child.kind === EntitySetKind.EntitySet) || (child.kind === EntitySetKind.Singleton)) {
                                childElement.setAttribute("EntityType", schema.namespace.concat(".", child.entityType.name));
                            }
                            const childAnnotation = doc.createElement("Annotation");
                            childAnnotation.setAttribute("Term", "Org.OData.Core.V1.ResourcePath");
                            childAnnotation.setAttribute("String", child.getUrl());
                            childElement.appendChild(childAnnotation);
                            //append Schema > EntityContainer > (EntitySet, Singleton, FunctionImport)
                            entityContainerElement.appendChild(childElement);
                        });

                    //append Schema > EntityContainer
                    schemaElement.appendChild(entityContainerElement);

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
     * @param {string} entityType
     * @param {string} name
     * @returns {EntitySetConfiguration}
     */
    addEntitySet(entityType, name) {
        const self = this;
        const superAddEntitySet = super.addEntitySet;
        /**
         * @type {EntityTypeConfiguration}
         */
        if (this.hasEntitySet(name)) {
            return this.getEntitySet(name);
        }
        /**
         * @type {DataConfigurationStrategy|*}
         */
        const strategy = self.getConfiguration().getStrategy(DataConfigurationStrategy);
        if (strategy) {
            let modelEntitySet = superAddEntitySet.bind(self)(entityType, name);
            /**
             * @type {EntityTypeConfiguration}
             */
            let modelEntityType = modelEntitySet.entityType;
            /**
             * @type {DataModel}
             */
            const definition = strategy.model(entityType);
            if (definition) {
                const model = new DataModel(definition, new EntityDataContext(strategy));
                let inheritedAttributes = [];
                if (model.inherits) {
                    //add base entity
                    self.addEntitySet(model.inherits, pluralize(model.inherits));
                    //set inheritance
                    modelEntityType.derivesFrom(model.inherits);
                    const baseModel = model.base();
                    if (baseModel) {
                        inheritedAttributes = baseModel.attributeNames;
                    }
                }
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
                        const edmType = _.isObject(dataType) ? (dataType.hasOwnProperty("edmtype") ? dataType["edmtype"]: "Edm." + x.type) : SchemaDefaultNamespace.concat(".",x.type);
                        modelEntityType.addProperty(name, edmType, x.nullable);
                        if (x.primary) {
                            modelEntityType.hasKey(name, edmType);
                        }
                    }
                    else {
                        const namespacedType = SchemaDefaultNamespace.concat(".",x.type);
                        //add navigation property
                        modelEntityType.addNavigationProperty(name, namespacedType, x.many ? EdmMultiplicity.Many: EdmMultiplicity.One);
                        //add navigation property entity (if type is not a primitive type)
                        if (!strategy.dataTypes.hasOwnProperty(x.type)) {
                            self.addEntitySet(x.type, pluralize(x.type));
                        }
                    }
                });
            }
            return modelEntitySet;
        }
        return superAddEntitySet.bind(self)(entityType, name);
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
                                self.addEntitySet(x, pluralize(x));
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
                if (_.isObject(self[edmProperty])) {
                    return resolve(self[edmProperty]);
                }
                return superGetEdm.bind(self)().then((result) => {
                    self[edmProperty] = result;
                    return resolve(self[edmProperty]);
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

export class ODataJsonFormatter {

}