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
const singletonProperty = Symbol('singleton');
import pluralize from 'pluralize';
import {AbstractMethodError} from "@themost/common/errors";
import moment from 'moment';
import {LangUtils} from "@themost/common/utils";

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
EdmType.EdmDate="Edm.Date";
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
EntitySetKind.ActionImport = "ActionImport";

export class ProcedureConfiguration {
    /**
     * @constructor
     * @param {string} name
     */
    constructor(name) {
        this.name = name;
        this.parameters = [];
        this.isBindable = false;
    }

    /**
     * @param type
     * @returns {ProcedureConfiguration}
     */
    returns(type) {
        this.returnType = type;
        return this;
    }
    /**
     * @param type
     * @returns {ProcedureConfiguration}
     */
    returnsCollection(type) {
        this.returnCollectionType =  type;
        return this;
    }
    /**
     * @param {string} name
     * @param {string} type
     * @param {boolean=} nullable
     */
    parameter(name, type, nullable) {
        Args.notString(name, "Action parameter name");
        Args.notString(type, "Action parameter type");
        const findRe = new RegExp(`^${name}$` ,"ig");
        const p = _.find(this.parameters, function(x) {
            return findRe.test(x.name);
        });
        if (p) {
            p.type = type;
        }
        else {
            this.parameters.push({
                "name":name,
                "type":type,
                "nullable": _.isBoolean(nullable) ? nullable : false
            });
        }
        return this;
    }

}

/**
 * @class
 * @augments ProcedureConfiguration
 */
export class ActionConfiguration extends ProcedureConfiguration {
    /**
     * @constructor
     * @param {string} name
     */
    constructor(name) {
        super(name);
        this.isBound = false;
    }

}

/**
 * @class
 * @augments ProcedureConfiguration
 */
export class FunctionConfiguration extends ProcedureConfiguration {
    /**
     * @constructor
     * @param {string} name
     */
    constructor(name) {
        super(name);
        this.isBound = false;
    }

}

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
        this.actions = [];
        this.functions = [];
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
     * Creates an action that bind to this entity type
     * @param {string} name
     * @returns ActionConfiguration
     */
    addAction(name) {
        /**
         * @type {ActionConfiguration|*}
         */
        let a = this.hasAction(name);
        if (a) {
            return a;
        }
        a = new ActionConfiguration(name);
        //add current entity as parameter
        a.parameter(_.camelCase(this.name), this.name);
        a.isBound = true;
        this.actions.push(a);
        return a;
    }

    /**
     * Checks if entity type has an action with the given name
     * @param {string} name
     * @returns {ActionConfiguration|*}
     */
    hasAction(name) {
        if (_.isEmpty(name)) {
            return;
        }
        const findRe = new RegExp(`^${name}$` ,"ig");
        return _.find(this.actions, function(x) {
           return findRe.test(x.name);
        });
    }

    /**
     * Creates an action that bind to this entity type
     * @param {string} name
     * @returns ActionConfiguration
     */
    addFunction(name) {
        let a = this.hasFunction(name);
        if (a) {
            return a;
        }
        a = new FunctionConfiguration(name);
        a.isBound = true;
        a.parameter(_.camelCase(this.name), this.name);
        //add current entity as parameter
        this.functions.push(a);
        return a;
    }

    /**
     * Checks if entity type has a function with the given name
     * @param {string} name
     * @returns {ActionConfiguration|*}
     */
    hasFunction(name) {
        if (_.isEmpty(name)) {
            return;
        }
        const findRe = new RegExp(`^${name}$` ,"ig");
        return _.find(this.functions, function(x) {
            return findRe.test(x.name);
        });
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
        if ((multiplicity===EdmMultiplicity.ZeroOrOne) || (multiplicity===EdmMultiplicity.Many)) {
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
     * @returns {ODataModelBuilder}
     */
    getBuilder() {
        return this[builderProperty];
    }

    /**
     * @returns {*}
     */
    getEntityTypePropertyList() {
        const result = {};
        _.forEach(this.entityType.property, function(x) {
           result[x.name] = x;
        });
        let baseEntityType = this.getBuilder().getEntity(this.entityType.baseType);
        while (baseEntityType) {
            _.forEach(baseEntityType.property, function(x) {
                result[x.name] = x;
            });
            baseEntityType = this.getBuilder().getEntity(baseEntityType.baseType);
        }
        return result;
    }

    /**
     * @param {string} name
     * @param  {boolean=} deep
     * @returns {*}
     */
    getEntityTypeProperty(name, deep) {
        const re = new RegExp("^" + name + "$","ig");
        let p = _.find(this.entityType.property, function(x) {
            return re.test(x.name);
        });
        if (p) {
            return p;
        }
        const deep_ = _.isBoolean(deep) ? deep : true;
        if (deep_) {
            let baseEntityType = this.getBuilder().getEntity(this.entityType.baseType);
            while (baseEntityType) {
                p = _.find(baseEntityType.property, function(x) {
                    return re.test(x.name);
                });
                if (p) {
                    return p;
                }
                baseEntityType = this.getBuilder().getEntity(baseEntityType.baseType);
            }
        }
    }

    /**
     * @returns {*}
     */
    getEntityTypeIgnoredPropertyList() {
        const result = [].concat(this.entityType.ignoredProperty);
        let baseEntityType = this.getBuilder().getEntity(this.entityType.baseType);
        while (baseEntityType) {
            result.push.apply(result, baseEntityType.ignoredProperty);
            baseEntityType = this.getBuilder().getEntity(baseEntityType.baseType);
        }
        return result;
    }
    /**
     * @param {string} name
     * @param  {boolean=} deep
     * @returns {*}
     */
    getEntityTypeNavigationProperty(name, deep) {
        const re = new RegExp("^" + name + "$","ig");
        let p = _.find(this.entityType.navigationProperty, function(x) {
            return re.test(x.name);
        });
        if (p) {
            return p;
        }
        const deep_ = _.isBoolean(deep) ? deep : true;
        if (deep_) {
            let baseEntityType = this.getBuilder().getEntity(this.entityType.baseType);
            while (baseEntityType) {
                p = _.find(baseEntityType.navigationProperty, function(x) {
                    return re.test(x.name);
                });
                if (p) {
                    return p;
                }
                baseEntityType = this.getBuilder().getEntity(baseEntityType.baseType);
            }
        }
    }



    /**
     * @returns {*}
     */
    getEntityTypeNavigationPropertyList() {
        const result = [];
        _.forEach(this.entityType.navigationProperty, function(x) {
            result[x.name] = x;
        });
        let baseEntityType = this.getBuilder().getEntity(this.entityType.baseType);
        while (baseEntityType) {
            _.forEach(baseEntityType.navigationProperty, function(x) {
                result[x.name] = x;
            });
            baseEntityType = this.getBuilder().getEntity(baseEntityType.baseType);
        }
        return result;
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

    /**
     * @param contextLinkFunc
     */
    hasContextLink(contextLinkFunc) {
        this.getContextLink = contextLinkFunc;
    }

    /**
     *
     * @param {Function} idLinkFunc
     */
    hasIdLink(idLinkFunc) {
        this.getIdLink = idLinkFunc;
    }

    /**
     *
     * @param {Function} readLinkFunc
     */
    hasReadLink(readLinkFunc) {
        this.getReadLink = readLinkFunc;
    }

    /**
     *
     * @param {Function} editLinkFunc
     */
    hasEditLink(editLinkFunc) {
        this.getEditLink = editLinkFunc;
    }

}

export class SingletonConfiguration  extends EntitySetConfiguration {
    constructor(builder, entityType, name) {
        super(builder, entityType, name);
        this.kind = EntitySetKind.Singleton;
    }
}

/**
 * @classdesc Represents the OData model builder of an HTTP application
 * @property {string} serviceRoot - Gets or sets the service root URI
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
        this.defaultNamespace = SchemaDefaultNamespace;
    }

    /**
     * Gets a registered entity type
     * @param {string} name
     * @returns {EntityTypeConfiguration|*}
     */
    getEntity(name) {
        if (_.isNil(name)) {
            return;
        }
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
     * @param {*} entityType
     * @param {string} name
     * @returns SingletonConfiguration|*
     */
    addSingleton(entityType, name) {
        if (!this.hasSingleton(name)) {
            this[entityContainerProperty].push(new SingletonConfiguration(this, entityType, name));
        }
        return this.getSingleton(name);
    }

    /**
     * Gets an entity set
     * @param name
     * @returns {SingletonConfiguration}
     */
    getSingleton(name) {
        Args.notString(name, 'Singleton Name');
        const re = new RegExp("^" + name + "$","ig");
        return _.find(this[entityContainerProperty], (x)=> {
            return re.test(x.name) && x.kind === EntitySetKind.Singleton;
        });
    }

    /**
     * @param {string} name
     * @returns {SingletonConfiguration|*}
     */
    hasSingleton(name) {
        const findRe = new RegExp(`^${name}$` ,"ig");
        return _.findIndex(this[entityContainerProperty], (x) => {
            return findRe.test(x.name) && x.kind === EntitySetKind.Singleton;
        })>=0;
    }

    /**
     * Checks if the given entity set exists in entity container
     * @param {string} name
     * @returns {boolean}
     */
    hasEntitySet(name) {
        const findRe = new RegExp(`^${name}$` ,"ig");
        return _.findIndex(this[entityContainerProperty], (x) => {
            return findRe.test(x.name) && x.kind === EntitySetKind.EntitySet;
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
        const re = new RegExp("^" + name + "$","ig");
        return _.find(this[entityContainerProperty], (x)=> {
            return re.test(x.name) && x.kind === EntitySetKind.EntitySet;
        });
    }

    /**
     * Gets an entity set based on the given entity name
     * @param {string} entityName
     * @returns {EntitySetConfiguration}
     */
    getEntityTypeEntitySet(entityName) {
        Args.notString(entityName, 'Entity Name');
        const re = new RegExp("^" + entityName + "$","ig");
        return _.find(this[entityContainerProperty], (x)=> {
            return x.entityType && re.test(x.entityType.name);
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
                    namespace:self.defaultNamespace,
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
                //apply entity sets
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
                    const actionElements = [], functionElements = [];
                    //append edmx:DataServices > Schema
                    dataServicesElement.appendChild(schemaElement);
                    _.forEach(schema.entityType,
                        /**
                         *
                         * @param {EntityTypeConfiguration} entityType
                         */
                        (entityType) => {

                            //search for bound actions
                            _.forEach(entityType.actions, function(action) {
                                const actionElement = doc.createElement("Action");
                                actionElement.setAttribute("Name", action.name);
                                actionElement.setAttribute("IsBound", true);
                                actionElement.setAttribute("IsComposable", true);
                                _.forEach(action.parameters, function(parameter) {
                                   const paramElement =  doc.createElement("Parameter");
                                   paramElement.setAttribute("Name", parameter.name);
                                   paramElement.setAttribute("Type", parameter.type);
                                   paramElement.setAttribute("Nullable", _.isBoolean(parameter.nullable) ? parameter.nullable : false);
                                    //append Action > Parameter
                                   actionElement.appendChild(paramElement)
                                });
                                actionElements.push(actionElement);
                            });

                            //search for bound functions
                            _.forEach(entityType.functions, function(func) {
                                const functionElement = doc.createElement("Function");
                                functionElement.setAttribute("Name", func.name);
                                functionElement.setAttribute("IsBound", true);
                                functionElement.setAttribute("IsComposable", true);
                                _.forEach(func.parameters, function(parameter) {
                                    const paramElement =  doc.createElement("Parameter");
                                    paramElement.setAttribute("Name", parameter.name);
                                    paramElement.setAttribute("Type", parameter.type);
                                    paramElement.setAttribute("Nullable", _.isBoolean(parameter.nullable) ? parameter.nullable : false);
                                    //append Function > Parameter
                                    functionElement.appendChild(paramElement)
                                });
                                const returnTypeElement =  doc.createElement("ReturnType");
                                let returnType = func.returnType;
                                if (func.returnCollectionType) {
                                    returnType = func.returnCollectionType;
                                    returnTypeElement.setAttribute("Type", `Collection(${returnType})`);
                                }
                                else {
                                    returnTypeElement.setAttribute("Type", returnType);
                                }
                                returnTypeElement.setAttribute("Nullable", true);
                                functionElement.appendChild(returnTypeElement);
                                functionElements.push(functionElement);
                            });

                            //create element Schema > EntityType
                            const entityTypeElement = doc.createElement("EntityType");
                            entityTypeElement.setAttribute("Name", entityType.name);
                            entityTypeElement.setAttribute("OpenType", true);
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

                    //append action elements to schema
                    _.forEach(actionElements, function(actionElement) {
                       schemaElement.appendChild(actionElement);
                    });
                    //append function elements to schema
                    _.forEach(functionElements, function(functionElement) {
                        schemaElement.appendChild(functionElement);
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
                                childElement.setAttribute("EntityType", child.entityType.name);
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
                }).catch((err)=> {
                    return reject(err);
                });
            }
            catch(err) {
                return reject(err);
            }
        });

    }

    /**
     * @param {Function} contextLinkFunc
     */
    hasContextLink(contextLinkFunc) {
        this.getContextLink = contextLinkFunc;
    }


    hasJsonFormatter(jsonFormatterFunc) {
        this.jsonFormatter = jsonFormatterFunc;
    }


    /**
     * @param {EntitySetConfiguration} entitySet
     * @param {*} instance
     * @param {*=} options
     * @returns *
     */
    jsonFormatter(context, entitySet, instance, options) {
        const self = this;
        const defaults = _.assign({
            addContextAttribute:true,
            addCountAttribute:false
        }, options);
        const entityProperty = entitySet.getEntityTypePropertyList();
        const entityNavigationProperty = entitySet.getEntityTypeNavigationPropertyList();
        const ignoredProperty = entitySet.getEntityTypeIgnoredPropertyList();
        const singleJsonFormatter = function(instance) {
            const result = {};
            _.forEach(_.keys(instance), function(key) {
                if (ignoredProperty.indexOf(key)<0) {
                    if (entityProperty.hasOwnProperty(key)) {
                        const p = entityProperty[key];
                        if (p.type === EdmType.EdmBoolean) {
                            result[key] = LangUtils.parseBoolean(instance[key]);
                        }
                        else if (p.type === EdmType.EdmDate) {
                            if (!_.isNil(instance[key])) {
                                result[key] = moment(instance[key]).format('YYYY-MM-DD');
                            }
                        }
                        else if (p.type === EdmType.EdmDateTimeOffset) {
                            if (!_.isNil(instance[key])) {
                                result[key] = moment(instance[key]).format('YYYY-MM-DDTHH:mm:ssZ');
                            }
                        }
                        else {
                            result[key] = instance[key];
                        }
                    }
                    else if (entityNavigationProperty.hasOwnProperty(key)) {
                        if (_.isObject(instance[key])) {
                            const match = /^Collection\((.*?)\)$/.exec(entityNavigationProperty[key].type);
                            const entityType = match ? match[1] : entityNavigationProperty[key].type;
                            const entitySet = self.getEntityTypeEntitySet(/\.?(\w+)$/.exec(entityType)[1]);
                            result[key] = self.jsonFormatter(context, entitySet, instance[key], {
                                addContextAttribute:false
                            });
                        }
                    }
                    else {
                        result[key] = instance[key];
                    }
                }
            });
            return result;
        };
        let value;
        const result = {};
        if (defaults.addContextAttribute) {
            _.assign(result, {
                "@odata.context":self.getContextLink(context).concat("$metadata#", entitySet.name)
            });
        }
        if (_.isArray(instance)) {
            value = _.map(instance, function(x) {
                return singleJsonFormatter(x);
            });
            _.assign(result, {
                "value":value
            });
        }
        else if (_.isObject(instance)) {
            value = singleJsonFormatter(instance);
            if (defaults.addContextAttribute) {
                _.assign(result, {
                    "@odata.context":self.getContextLink(context).concat("$metadata#", entitySet.name, "/$entity")
                });
            }
            _.assign(result, value);
        }
        return result;
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
                const primaryKey = _.find(model.attributes, function(x) {
                    return x.primary;
                });
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
                        const edmType = _.isObject(dataType) ? (dataType.hasOwnProperty("edmtype") ? dataType["edmtype"]: "Edm." + x.type) : self.defaultNamespace.concat(".",x.type);
                        modelEntityType.addProperty(name, edmType, x.hasOwnProperty('nullable') ? x.nullable : true);
                        if (x.primary) {
                            modelEntityType.hasKey(name, edmType);
                        }
                    }
                    else {
                        const namespacedType = self.defaultNamespace.concat(".",x.type);
                        //add navigation property
                        const isNullable = x.hasOwnProperty('nullable') ? x.nullable : true;
                        modelEntityType.addNavigationProperty(name, namespacedType, x.many ? EdmMultiplicity.Many: (isNullable ? EdmMultiplicity.ZeroOrOne : EdmMultiplicity.One));
                        //add navigation property entity (if type is not a primitive type)
                        if (!strategy.dataTypes.hasOwnProperty(x.type)) {
                            self.addEntitySet(x.type, pluralize(x.type));
                        }
                    }
                });
                //add link function
                if (typeof self.getContextLink === 'function') {
                    modelEntitySet.hasContextLink(function(context) {
                       return self.getContextLink(context).concat("$metadata#",modelEntitySet.name);
                    });
                }
                //add id link
                if (typeof self.getContextLink === 'function') {
                    if (primaryKey) {
                        modelEntitySet.hasIdLink(function(context, instance) {
                            //get parent model
                            if (_.isNil(instance[primaryKey.name])) {
                                return;
                            }
                            return self.getContextLink(context).concat(modelEntitySet.name, "(", instance[primaryKey.name], ")");
                        });
                    }
                }
                //add read link
                if (typeof self.getContextLink === 'function') {
                    if (primaryKey) {
                        modelEntitySet.hasReadLink(function(context, instance) {
                            //get parent model
                            if (_.isNil(instance[primaryKey.name])) {
                                return;
                            }
                            return self.getContextLink(context).concat(modelEntitySet.name, "(", instance[primaryKey.name], ")");
                        });
                    }
                }
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
                return self.initialize().then(()=> {
                    return superGetEdm.bind(self)().then((result) => {
                        self[edmProperty] = result;
                        return resolve(self[edmProperty]);
                    });
                });
            }
            catch(err) {
                return reject(err);
            }
        });
    }
}