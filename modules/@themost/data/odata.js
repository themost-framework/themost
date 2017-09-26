/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ODataJsonFormatter = exports.ODataConventionModelBuilder = exports.ODataModelBuilder = exports.EntitySetConfiguration = exports.EntityTypeConfiguration = exports.EntitySetKind = exports.EdmMultiplicity = exports.EdmType = undefined;

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _ = _interopRequireDefault(_lodash).default;

var _config = require('@themost/common/config');

var ConfigurationStrategy = _config.ConfigurationStrategy;
var ConfigurationBase = _config.ConfigurationBase;

var _utils = require('@themost/common/utils');

var Args = _utils.Args;

var _config2 = require('./config');

var DataConfigurationStrategy = _config2.DataConfigurationStrategy;
var SchemaLoaderStrategy = _config2.SchemaLoaderStrategy;

var _model = require('./model');

var DataModel = _model.DataModel;

var _types = require('./types');

var DataContext = _types.DataContext;

var _mostXml = require('most-xml');

var XDocument = _mostXml.XDocument;

var _q = require('q');

var Q = _interopRequireDefault(_q).default;

var _pluralize = require('pluralize');

var pluralize = _interopRequireDefault(_pluralize).default;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var nameProperty = Symbol('name');
var entityTypesProperty = Symbol('entityTypes');
var entityContainerProperty = Symbol('entityContainer');
var ignoreEntityTypesProperty = Symbol('ignoredEntityTypes');
var builderProperty = Symbol('builder');
var entityTypeProperty = Symbol('entityType');
var edmProperty = Symbol('edm');


var SchemaDefaultNamespace = "Edm.Models";

/**
 * @class
 * @abstract
 */

var EdmType = exports.EdmType = function EdmType() {
    _classCallCheck(this, EdmType);
};

EdmType.EdmBinary = "Edm.Binary";
EdmType.EdmBoolean = "Edm.Boolean";
EdmType.EdmByte = "Edm.Byte";
EdmType.EdmBoolean = "Edm.Date";
EdmType.EdmDateTimeOffset = "Edm.DateTimeOffset";
EdmType.EdmDouble = "Edm.Double";
EdmType.EdmDecimal = "Edm.Decimal";
EdmType.EdmDuration = "Edm.Duration";
EdmType.EdmGuid = "Edm.Guid";
EdmType.EdmInt16 = "Edm.Int16";
EdmType.EdmInt32 = "Edm.Int32";
EdmType.EdmInt64 = "Edm.Int64";
EdmType.EdmSByte = "Edm.SByte";
EdmType.EdmSingle = "Edm.Single";
EdmType.EdmStream = "Edm.Stream";
EdmType.EdmString = "Edm.String";
EdmType.EdmTimeOfDay = "Edm.TimeOfDay";

/**
 * @enum
 */

var EdmMultiplicity = exports.EdmMultiplicity = function EdmMultiplicity() {
    _classCallCheck(this, EdmMultiplicity);
};

EdmMultiplicity.Many = "Many";
EdmMultiplicity.One = "One";
EdmMultiplicity.Unknown = "Unknown";
EdmMultiplicity.ZeroOrOne = "ZeroOrOne";

/**
 * @enum
 */

var EntitySetKind = exports.EntitySetKind = function EntitySetKind() {
    _classCallCheck(this, EntitySetKind);
};

EntitySetKind.EntitySet = "EntitySet";
EntitySetKind.Singleton = "Singleton";
EntitySetKind.FunctionImport = "FunctionImport";

/**
 * @class
 */

var EntityTypeConfiguration = exports.EntityTypeConfiguration = function () {
    /**
     *
     * @param {string} name
     */
    function EntityTypeConfiguration(name) {
        _classCallCheck(this, EntityTypeConfiguration);

        Args.notString(name, 'Entity type name');
        this[nameProperty] = name;
        this.property = [];
        this.ignoredProperty = [];
        this.navigationProperty = [];
    }

    _createClass(EntityTypeConfiguration, [{
        key: 'derivesFrom',


        /**
         * @param {string} name
         */
        value: function derivesFrom(name) {
            Args.notString(name, "Enity type name");
            this.baseType = name;
        }

        /**
         * Adds a new EDM primitive property to this entity type.
         * @param {string} name
         * @param {string} type
         * @param {boolean=} nullable
         * @returns EntityTypeConfiguration
         */

    }, {
        key: 'addProperty',
        value: function addProperty(name, type, nullable) {
            Args.notString(name, "Property name");
            var exists = _.findIndex(this.property, function (x) {
                return x.name === name;
            });
            if (exists < 0) {
                var p = {
                    "name": name,
                    "type": type,
                    "nullable": _.isBoolean(nullable) ? nullable : true
                };
                this.property.push(p);
            } else {
                _.assign(this.property[exists], {
                    "type": type,
                    "nullable": _.isBoolean(nullable) ? nullable : true
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

    }, {
        key: 'addNavigationProperty',
        value: function addNavigationProperty(name, type, multiplicity) {
            Args.notString(name, "Property name");
            var exists = _.findIndex(this.navigationProperty, function (x) {
                return x.name === name;
            });

            var p = {
                "name": name,
                "type": multiplicity === "Many" ? 'Collection(' + type + ')' : type
            };
            if (multiplicity === EdmMultiplicity.ZeroOrOne) {
                p.nullable = true;
            }

            if (exists < 0) {
                this.navigationProperty.push(p);
            } else {
                _.assign(this.navigationProperty[exists], p);
            }
            return this;
        }

        /**
         * Removes the navigation property from the entity.
         * @param {string} name
         * @returns {EntityTypeConfiguration}
         */

    }, {
        key: 'removeNavigationProperty',
        value: function removeNavigationProperty(name) {
            Args.notString(name, "Property name");
            var hasProperty = _.findIndex(this.property, function (x) {
                return x.name === name;
            });
            if (hasProperty >= 0) {
                this.property.splice(hasProperty, 1);
            }
            return this;
        }

        /**
         * Ignores a property from the entity
         * @param name
         * @returns {EntityTypeConfiguration}
         */

    }, {
        key: 'ignore',
        value: function ignore(name) {
            Args.notString(name, "Property name");
            var hasProperty = _.findIndex(this.ignoredProperty, function (x) {
                return x.name === name;
            });
            if (hasProperty >= 0) {
                return this;
            }
            this.ignoredProperty.push(name);
        }

        /**
         * Removes the property from the entity.
         * @param {string} name
         * @returns {EntityTypeConfiguration}
         */

    }, {
        key: 'removeProperty',
        value: function removeProperty(name) {
            Args.notString(name, "Property name");
            var hasProperty = _.findIndex(this.property, function (x) {
                return x.name === name;
            });
            if (hasProperty >= 0) {
                this.property.splice(hasProperty, 1);
            }
            return this;
        }

        /**
         * Removes the property from the entity keys collection.
         * @param {string} name
         * @returns {EntityTypeConfiguration}
         */

    }, {
        key: 'removeKey',
        value: function removeKey(name) {
            Args.notString(name, "Key name");
            if (this.key && _.isArray(this.key.propertyRef)) {
                var hasKeyIndex = _.findIndex(this.key.propertyRef, function (x) {
                    return x.name === name;
                });
                if (hasKeyIndex < 0) {
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

    }, {
        key: 'hasKey',
        value: function hasKey(name, type) {
            this.addProperty(name, type, false);
            this.key = {
                propertyRef: [{
                    "name": name
                }]
            };
            return this;
        }
    }, {
        key: 'name',
        get: function get() {
            return this[nameProperty];
        }
    }]);

    return EntityTypeConfiguration;
}();

/**
 *
 */


var EntitySetConfiguration = exports.EntitySetConfiguration = function () {
    /**
     * @param {ODataModelBuilder} builder
     * @param {string} entityType
     * @param {string} name
     */
    function EntitySetConfiguration(builder, entityType, name) {
        _classCallCheck(this, EntitySetConfiguration);

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

    _createClass(EntitySetConfiguration, [{
        key: 'hasUrl',
        value: function hasUrl(url) {
            Args.notString(url, 'Entity Resource Path');
            this.url = url;
        }
    }, {
        key: 'getUrl',
        value: function getUrl() {
            return this.url;
        }

        /**
         * @returns {EntityTypeConfiguration}
         */

    }, {
        key: 'entityType',
        get: function get() {
            if (!this[builderProperty].hasEntity(this[entityTypeProperty])) {
                return this[builderProperty].addEntity(this[entityTypeProperty]);
            }
            return this[builderProperty].getEntity(this[entityTypeProperty]);
        }
    }]);

    return EntitySetConfiguration;
}();

/**
 * @classdesc Represents the OData model builder of an HTTP application
 * @class
 */


var ODataModelBuilder = exports.ODataModelBuilder = function (_ConfigurationStrateg) {
    _inherits(ODataModelBuilder, _ConfigurationStrateg);

    /**
     *
     * @param {ConfigurationBase} config
     */
    function ODataModelBuilder(config) {
        _classCallCheck(this, ODataModelBuilder);

        var _this = _possibleConstructorReturn(this, (ODataModelBuilder.__proto__ || Object.getPrototypeOf(ODataModelBuilder)).call(this, config));

        _this[entityTypesProperty] = {};
        _this[ignoreEntityTypesProperty] = [];
        _this[entityContainerProperty] = [];
        return _this;
    }

    /**
     * Gets a registered entity type
     * @param {string} name
     * @returns {EntityTypeConfiguration}
     */


    _createClass(ODataModelBuilder, [{
        key: 'getEntity',
        value: function getEntity(name) {
            Args.notString(name, 'Entity type name');
            return this[entityTypesProperty][name];
        }

        /**
         * Registers an entity type
         * @param {string} name
         * @returns {EntityTypeConfiguration}
         */

    }, {
        key: 'addEntity',
        value: function addEntity(name) {
            if (!this.hasEntity(name)) {
                this[entityTypesProperty][name] = new EntityTypeConfiguration(name);
            }
            return this.getEntity(name);
        }

        /**
         * Checks if the given entity set exists in entity container
         * @param {string} name
         * @returns {boolean}
         */

    }, {
        key: 'hasEntitySet',
        value: function hasEntitySet(name) {
            return _.findIndex(this[entityContainerProperty], function (x) {
                return x.name === name;
            }) >= 0;
        }

        /**
         * Registers an entity type
         * @param {string} entityType
         * @param {string} name
         * @returns {EntitySetConfiguration}
         */

    }, {
        key: 'addEntitySet',
        value: function addEntitySet(entityType, name) {
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

    }, {
        key: 'getEntitySet',
        value: function getEntitySet(name) {
            Args.notString(name, 'EntitySet Name');
            return _.find(this[entityContainerProperty], function (x) {
                return x.name === name;
            });
        }

        /**
         * Ignores the entity type with the given name
         * @param {string} name
         * @returns {ODataModelBuilder}
         */

    }, {
        key: 'ignore',
        value: function ignore(name) {
            var hasEntity = this[ignoreEntityTypesProperty].indexOf(name);
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

    }, {
        key: 'hasEntity',
        value: function hasEntity(name) {
            return this[entityTypesProperty].hasOwnProperty(name);
        }

        /**
         * Creates and returns a structure based on the configuration performed using this builder
         * @returns {Promise}
         */

    }, {
        key: 'getEdm',
        value: function getEdm() {
            var self = this;
            return Q.promise(function (resolve, reject) {
                try {
                    var schema = {
                        namespace: SchemaDefaultNamespace,
                        entityType: [],
                        entityContainer: {
                            "name": "DefaultContainer",
                            "entitySet": []
                        }
                    };
                    //get entity types by excluding ignored entities
                    var keys = _.filter(_.keys(self[entityTypesProperty]), function (x) {
                        return self[ignoreEntityTypesProperty].indexOf(x) < 0;
                    });
                    //enumerate entity types
                    _.forEach(keys, function (key) {
                        schema.entityType.push(self[entityTypesProperty][key]);
                    });
                    //enumerate entity sets
                    schema.entityContainer.entitySet.push.apply(schema.entityContainer.entitySet, self[entityContainerProperty]);

                    return resolve(schema);
                } catch (err) {
                    return reject(err);
                }
            });
        }

        /**
         * @param {boolean=} all
         * @returns {ODataModelBuilder}
         */

    }, {
        key: 'clean',
        value: function clean(all) {
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

    }, {
        key: 'getEdmDocument',
        value: function getEdmDocument() {
            var self = this;
            return Q.promise(function (resolve, reject) {
                try {
                    return self.getEdm().then(function (schema) {
                        var doc = new XDocument();
                        var rootElement = doc.createElement("edmx:Edmx");
                        rootElement.setAttribute("xmlns:edmx", "http://docs.oasis-open.org/odata/ns/edmx");
                        rootElement.setAttribute("Version", "4.0");
                        doc.appendChild(rootElement);

                        var dataServicesElement = doc.createElement("edmx:DataServices");
                        var schemaElement = doc.createElement("Schema");
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
                        function (entityType) {

                            //create element Schema > EntityType
                            var entityTypeElement = doc.createElement("EntityType");
                            entityTypeElement.setAttribute("Name", entityType.name);
                            entityTypeElement.setAttribute("OpenType", true);
                            if (entityType.baseType) {
                                entityTypeElement.setAttribute("BaseType", schema.namespace.concat(".", entityType.baseType));
                            }

                            if (entityType.key && entityType.key.propertyRef) {
                                var keyElement = doc.createElement('Key');
                                _.forEach(entityType.key.propertyRef, function (key) {
                                    var keyRefElement = doc.createElement('PropertyRef');
                                    keyRefElement.setAttribute("Name", key.name);
                                    keyElement.appendChild(keyRefElement);
                                });
                                entityTypeElement.appendChild(keyElement);
                            }
                            //enumerate properties
                            _.forEach(entityType.property, function (x) {
                                var propertyElement = doc.createElement('Property');
                                propertyElement.setAttribute("Name", x.name);
                                propertyElement.setAttribute("Type", x.type);
                                if (_.isBoolean(x.nullable) && x.nullable === false) {
                                    propertyElement.setAttribute("Nullable", false);
                                }
                                entityTypeElement.appendChild(propertyElement);
                            });
                            //enumerate navigation properties
                            _.forEach(entityType.navigationProperty, function (x) {
                                var propertyElement = doc.createElement('NavigationProperty');
                                propertyElement.setAttribute("Name", x.name);
                                propertyElement.setAttribute("Type", x.type);
                                if (!x.nullable) {
                                    propertyElement.setAttribute("Nullable", false);
                                }
                                entityTypeElement.appendChild(propertyElement);
                            });
                            //append Schema > EntityType
                            schemaElement.appendChild(entityTypeElement);
                        });

                        //create Schema > EntityContainer
                        var entityContainerElement = doc.createElement("EntityContainer");
                        entityContainerElement.setAttribute("Name", schema.entityContainer.name || "DefaultContainer");

                        _.forEach(schema.entityContainer.entitySet,
                        /**
                         * @param {EntitySetConfiguration} child
                         */
                        function (child) {
                            var childElement = doc.createElement(child.kind);
                            childElement.setAttribute("Name", child.name);
                            if (child.kind === EntitySetKind.EntitySet || child.kind === EntitySetKind.Singleton) {
                                childElement.setAttribute("EntityType", schema.namespace.concat(".", child.entityType.name));
                            }
                            var childAnnotation = doc.createElement("Annotation");
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
                } catch (err) {
                    return reject(err);
                }
            });
        }
    }]);

    return ODataModelBuilder;
}(ConfigurationStrategy);

var EntityDataContext = function (_DataContext) {
    _inherits(EntityDataContext, _DataContext);

    /**
     * @param {DataConfigurationStrategy=} configuration
     */
    function EntityDataContext(configuration) {
        _classCallCheck(this, EntityDataContext);

        var _this2 = _possibleConstructorReturn(this, (EntityDataContext.__proto__ || Object.getPrototypeOf(EntityDataContext)).call(this));

        _this2.getConfiguration = function () {
            return configuration;
        };
        return _this2;
    }

    _createClass(EntityDataContext, [{
        key: 'model',
        value: function model(name) {
            if (this.getConfiguration().dataTypes.hasOwnProperty(name)) {
                return;
            }
            var definition = this.getConfiguration().model(name);
            if (_.isNil(definition)) {
                return;
            }
            return new DataModel(definition, this);
        }
    }]);

    return EntityDataContext;
}(DataContext);

/**
 * @class
 * @augments ODataModelBuilder
 */


var ODataConventionModelBuilder = exports.ODataConventionModelBuilder = function (_ODataModelBuilder) {
    _inherits(ODataConventionModelBuilder, _ODataModelBuilder);

    /**
     *
     * @param {ConfigurationBase} config
     */
    function ODataConventionModelBuilder(config) {
        _classCallCheck(this, ODataConventionModelBuilder);

        return _possibleConstructorReturn(this, (ODataConventionModelBuilder.__proto__ || Object.getPrototypeOf(ODataConventionModelBuilder)).call(this, config));
    }

    /**
     * Automatically registers an entity type from the given model
     * @param {string} entityType
     * @param {string} name
     * @returns {EntitySetConfiguration}
     */


    _createClass(ODataConventionModelBuilder, [{
        key: 'addEntitySet',
        value: function addEntitySet(entityType, name) {
            var self = this;
            var superAddEntitySet = _get(ODataConventionModelBuilder.prototype.__proto__ || Object.getPrototypeOf(ODataConventionModelBuilder.prototype), 'addEntitySet', this);
            /**
             * @type {EntityTypeConfiguration}
             */
            if (this.hasEntitySet(name)) {
                return this.getEntitySet(name);
            }
            /**
             * @type {DataConfigurationStrategy|*}
             */
            var strategy = self.getConfiguration().getStrategy(DataConfigurationStrategy);
            if (strategy) {
                var modelEntitySet = superAddEntitySet.bind(self)(entityType, name);
                /**
                 * @type {EntityTypeConfiguration}
                 */
                var modelEntityType = modelEntitySet.entityType;
                /**
                 * @type {DataModel}
                 */
                var definition = strategy.model(entityType);
                if (definition) {
                    var model = new DataModel(definition, new EntityDataContext(strategy));
                    var inheritedAttributes = [];
                    if (model.inherits) {
                        //add base entity
                        self.addEntitySet(model.inherits, pluralize(model.inherits));
                        //set inheritance
                        modelEntityType.derivesFrom(model.inherits);
                        var baseModel = model.base();
                        if (baseModel) {
                            inheritedAttributes = baseModel.attributeNames;
                        }
                    }
                    _.forEach(_.filter(model.attributes, function (x) {
                        if (x.primary && model.inherits) {
                            return false;
                        }
                        return x.model === model.name && inheritedAttributes.indexOf(x.name) < 0;
                    }), function (x) {
                        var name = x.property || x.name;
                        var mapping = model.inferMapping(x.name);
                        if (_.isNil(mapping)) {
                            //find data type
                            var dataType = strategy.dataTypes[x.type];
                            //add property
                            var edmType = _.isObject(dataType) ? dataType.hasOwnProperty("edmtype") ? dataType["edmtype"] : "Edm." + x.type : SchemaDefaultNamespace.concat(".", x.type);
                            modelEntityType.addProperty(name, edmType, x.nullable);
                            if (x.primary) {
                                modelEntityType.hasKey(name, edmType);
                            }
                        } else {
                            var namespacedType = SchemaDefaultNamespace.concat(".", x.type);
                            //add navigation property
                            modelEntityType.addNavigationProperty(name, namespacedType, x.many ? EdmMultiplicity.Many : EdmMultiplicity.One);
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

    }, {
        key: 'initialize',
        value: function initialize() {
            var self = this;
            return Q.promise(function (resolve, reject) {
                /**
                 * @type {SchemaLoaderStrategy|DefaultSchemaLoaderStrategy|*}
                 */
                var schemaLoader = self.getConfiguration().getStrategy(SchemaLoaderStrategy);
                if (typeof schemaLoader.getModelPath === 'function') {
                    var nativeFsModule = 'fs';
                    var fs = require(nativeFsModule);
                    var modelPath = schemaLoader.getModelPath();
                    if (_.isNil(modelPath)) {
                        return resolve();
                    }
                    return fs.readdir(modelPath, function (err, files) {
                        try {
                            if (err) {
                                return reject(err);
                            }
                            var models = _.map(_.filter(files, function (x) {
                                return (/\.json$/.test(x)
                                );
                            }), function (x) {
                                return (/(.*?)\.json$/.exec(x)[1]
                                );
                            });
                            _.forEach(models, function (x) {
                                if (!_.isNil(x)) {
                                    self.addEntitySet(x, pluralize(x));
                                }
                            });
                            return resolve();
                        } catch (err) {
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

    }, {
        key: 'getEdm',
        value: function getEdm() {
            var self = this,
                superGetEdm = _get(ODataConventionModelBuilder.prototype.__proto__ || Object.getPrototypeOf(ODataConventionModelBuilder.prototype), 'getEdm', this);
            return Q.promise(function (resolve, reject) {
                try {
                    if (_.isObject(self[edmProperty])) {
                        return resolve(self[edmProperty]);
                    }
                    return superGetEdm.bind(self)().then(function (result) {
                        self[edmProperty] = result;
                        return resolve(self[edmProperty]);
                    }).catch(function (err) {
                        return reject(err);
                    });
                } catch (err) {
                    return reject(err);
                }
            });
        }
    }]);

    return ODataConventionModelBuilder;
}(ODataModelBuilder);

var ODataJsonFormatter = exports.ODataJsonFormatter = function ODataJsonFormatter() {
    _classCallCheck(this, ODataJsonFormatter);
};
//# sourceMappingURL=odata.js.map
