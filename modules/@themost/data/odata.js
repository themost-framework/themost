/**
 * @licence
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD-3-Clause license
 * Date: 2017-11-10
 */
///
var Symbol = require('symbol');
var LangUtils = require('@themost/common/utils').LangUtils;
var sprintf = require('sprintf').sprintf;
var Q = require('q');
var pluralize = require('pluralize');
var _ = require('lodash');
var moment = require('moment');
var parseBoolean = require('./types').parsers.parseBoolean;
var DataModel = require('./data-model').DataModel;
var DataContext = require('./types').DataContext;
var XDocument = require('@themost/xml').XDocument;
// noinspection JSUnusedLocalSymbols
var entityTypesProperty = Symbol('entityTypes');
// noinspection JSUnusedLocalSymbols
var entityContainerProperty = Symbol('entityContainer');
var ignoreEntityTypesProperty = Symbol('ignoredEntityTypes');
var builderProperty = Symbol('builder');
var entityTypeProperty = Symbol('entityType');
// noinspection JSUnusedLocalSymbols
var edmProperty = Symbol('edm');
var initializeProperty = Symbol('initialize');
var DataConfigurationStrategy = require('./data-configuration').DataConfigurationStrategy;
var SchemaLoaderStrategy = require('./data-configuration').SchemaLoaderStrategy;
var DefaultSchemaLoaderStrategy = require('./data-configuration').DefaultSchemaLoaderStrategy;
var instanceOf = require('./instance-of').instanceOf;

function Args() {
    //
}
/**
 * Checks the expression and throws an exception if the condition is not met.
 * @param {*} expr
 * @param {string} message
 */
Args.check = function(expr, message) {
    Args.notNull(expr,"Expression");
    if (typeof expr === 'function') {
        expr.call()
    }
    var res;
    if (typeof expr === 'function') {
        res = !(expr.call());
    }
    else {
        res = (!expr);
    }
    if (res) {
        var err = new Error(message);
        err.code = "ECHECK";
        throw err;
    }
};
/**
 *
 * @param {*} arg
 * @param {string} name
 */
Args.notNull = function(arg,name) {
    if (typeof arg === 'undefined' || arg === null) {
        var err = new Error(name + " may not be null or undefined");
        err.code = "ENULL";
        throw err;
    }
};

/**
 * @param {*} arg
 * @param {string} name
 */
Args.notString = function(arg, name) {
    if (typeof arg !== 'string') {
        var err = new Error(name + " must be a string");
        err.code = "EARG";
        throw err;
    }
};

/**
 * @param {*} arg
 * @param {string} name
 */
Args.notFunction = function(arg, name) {
    if (typeof arg !== 'function') {
        var err = new Error(name + " must be a function");
        err.code = "EARG";
        throw err;
    }
};

/**
 * @param {*} arg
 * @param {string} name
 */
Args.notNumber = function(arg, name) {
    if (typeof arg !== 'string') {
        var err = new Error(name + " must be number");
        err.code = "EARG";
        throw err;
    }
};
/**
 * @param {string|*} arg
 * @param {string} name
 */
Args.notEmpty = function(arg,name) {
    Args.notNull(arg,name);
    Args.notString(arg,name);
    if (arg.length === 0) {
        var err = new Error(name + " may not be empty");
        err.code = "EEMPTY";
        return err;
    }
};

/**
 * @param {number|*} arg
 * @param {string} name
 */
Args.notNegative = function(arg,name) {
    Args.notNumber(arg,name);
    if (arg<0) {
        var err = new Error(name + " may not be negative");
        err.code = "ENEG";
        return err;
    }
};

/**
 * @param {number|*} arg
 * @param {string} name
 */
Args.positive = function(arg,name) {
    Args.notNumber(arg,name);
    if (arg<=0) {
        var err = new Error(name + " may not be negative or zero");
        err.code = "EPOS";
        return err;
    }
};


/**
 * @enum
 */
function EdmType() {

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
 * @static
 * @param {*} type
 * @returns {string}
 */
EdmType.CollectionOf = function(type) {
    return "Collection(" + type + ")";
};
/**
 * @static
 * @param {*} type
 * @returns {string}
 */
EdmType.IsCollection = function(type) {
    var match = /^Collection\((.*?)\)$/.exec(type);
    if (match && match[1].length) {
        return match[1];
    }
};

/**
 * @enum
 */
function EdmMultiplicity() {

}
EdmMultiplicity.Many = "Many";
EdmMultiplicity.One = "One";
EdmMultiplicity.Unknown = "Unknown";
EdmMultiplicity.ZeroOrOne = "ZeroOrOne";
/**
 * @param {string} value
 * @returns {string|*}
 */
EdmMultiplicity.parse = function(value) {
    if (typeof value === 'string') {
        var re = new RegExp('^'+value+'$','ig');
        return _.find(_.keys(EdmMultiplicity), function(x) {
            if (typeof EdmMultiplicity[x] === 'string') {
                return re.test(EdmMultiplicity[x]);
            }
        });
    }
};

/**
 * @enum
 */
function EntitySetKind() {

}
EntitySetKind.EntitySet = "EntitySet";
EntitySetKind.Singleton = "Singleton";
EntitySetKind.FunctionImport = "FunctionImport";
EntitySetKind.ActionImport = "ActionImport";

// noinspection JSUnusedGlobalSymbols
/**
 * @class
 * @param {string} name
 * @constructor
 */
function ProcedureConfiguration(name) {
    this.name = name;
    this.parameters = [];
    // noinspection JSUnusedGlobalSymbols
    this.isBound = false;
    this.isComposable = false;
}
/**
 * @param type
 * @returns {ProcedureConfiguration}
 */
ProcedureConfiguration.prototype.returns = function(type) {
    // noinspection JSUnusedGlobalSymbols
    this.returnType = type;
    return this;
};
// noinspection JSUnusedGlobalSymbols
/**
 * @param type
 * @returns {ProcedureConfiguration}
 */
ProcedureConfiguration.prototype.returnsCollection = function(type) {
    // noinspection JSUnusedGlobalSymbols
    this.returnCollectionType =  type;
    return this;
};
/**
 * @param {string} name
 * @param {string} type
 * @param {boolean=} nullable
 * @param {boolean=} fromBody
 */
ProcedureConfiguration.prototype.parameter = function(name, type, nullable, fromBody) {
    Args.notString(name, "Action parameter name");
    Args.notString(type, "Action parameter type");
    var findRe = new RegExp("^" + name + "$" ,"ig");
    var p = _.find(this.parameters, function(x) {
        return findRe.test(x.name);
    });
    if (p) {
        p.type = type;
    }
    else {
        this.parameters.push({
            "name":name,
            "type":type,
            "nullable": _.isBoolean(nullable) ? nullable : false,
            "fromBody": fromBody
        });
    }
    return this;
};

/**
 * @class
 * @constructor
 * @param {string} name
 * @augments ProcedureConfiguration
 * @extends ProcedureConfiguration
 */
function ActionConfiguration(name) {
    ActionConfiguration.super_.bind(this)(name);
    // noinspection JSUnusedGlobalSymbols
    this.isBound = false;
}
LangUtils.inherits(ActionConfiguration, ProcedureConfiguration);

/**
 * @class
 * @constructor
 * @param {string} name
 * @augments ProcedureConfiguration
 */
function FunctionConfiguration(name) {
    FunctionConfiguration.super_.bind(this)(name);
    // noinspection JSUnusedGlobalSymbols
    this.isBound = false;
}
LangUtils.inherits(FunctionConfiguration, ProcedureConfiguration);

/**
 * @class
 * @constructor
 * @param {EntityTypeConfiguration} entityType
 */
function EntityCollectionConfiguration(entityType) {
    this.actions = [];
    this.functions = [];
    this[entityTypeProperty] = entityType;
}

// noinspection JSUnusedGlobalSymbols
/**
 * Creates an action that bind to this entity collection
 * @param {string} name
 * @returns ActionConfiguration
 */
EntityCollectionConfiguration.prototype.addAction = function(name) {
    /**
     * @type {ActionConfiguration|*}
     */
    var a = this.hasAction(name);
    if (a) {
        return a;
    }
    a = new ActionConfiguration(name);
    //add current entity as parameter
    a.parameter("bindingParameter", "Collection(" + this[entityTypeProperty].name + ")",true);
    a.isBound = true;
    this.actions.push(a);
    return a;
};

/**
 * Checks if entity collection has an action with the given name
 * @param {string} name
 * @returns {ActionConfiguration|*}
 */
EntityCollectionConfiguration.prototype.hasAction = function(name) {
    if (_.isEmpty(name)) {
        return;
    }
    var findRe = new RegExp("^" + name + "$" ,"ig");
    return _.find(this.actions, function(x) {
        return findRe.test(x.name);
    });
};

// noinspection JSUnusedGlobalSymbols
/**
 * Creates an action that bind to this entity collection
 * @param {string} name
 * @returns ActionConfiguration
 */
EntityCollectionConfiguration.prototype.addFunction = function(name) {
    var a = this.hasFunction(name);
    if (a) {
        return a;
    }
    a = new FunctionConfiguration(name);
    a.isBound = true;
    a.parameter("bindingParameter", "Collection(" + this[entityTypeProperty].name + ")",true);
    //add current entity as parameter
    this.functions.push(a);
    return a;
};

/**
 * Checks if entity collection has a function with the given name
 * @param {string} name
 * @returns {ActionConfiguration|*}
 */
EntityCollectionConfiguration.prototype.hasFunction = function(name) {
    if (_.isEmpty(name)) {
        return;
    }
    var findRe = new RegExp("^" + name + "$" ,"ig");
    return _.find(this.functions, function(x) {
        return findRe.test(x.name);
    });
};


function getOwnPropertyNames(obj) {
    if (typeof obj === 'undefined' || obj === null) {
        return [];
    }
    var ownPropertyNames = [];
    //get object methods
    var proto = obj;
    while(proto) {
        ownPropertyNames = ownPropertyNames.concat(Object.getOwnPropertyNames(proto).filter( function(x) {
            return ownPropertyNames.indexOf(x)<0;
        }));
        proto = Object.getPrototypeOf(proto);
    }
    if (typeof obj === 'function') {
        //remove caller
        var index = ownPropertyNames.indexOf("caller");
        if (index>=0) {
            ownPropertyNames.splice(index,1);
        }
        index = ownPropertyNames.indexOf("arguments");
        if (index>=0) {
            ownPropertyNames.splice(index,1);
        }
    }
    return ownPropertyNames;
}


/**
 * @class
 * @param {ODataModelBuilder} builder
 * @param {string} name
 * @constructor
 * @property {string} name - Gets the name of this entity type
 */
function EntityTypeConfiguration(builder, name) {

    Args.notString(name, 'Entity type name');
    Object.defineProperty(this, 'name', {
        get:function() {
            return name;
        }
    });
    this[builderProperty] = builder;
    this.property = [];
    this.ignoredProperty = [];
    this.navigationProperty = [];
    this.actions = [];
    this.functions = [];
    this.collection = new EntityCollectionConfiguration(this);

}

/**
 * @returns {ODataModelBuilder}
 */
EntityTypeConfiguration.prototype.getBuilder = function() {
    return this[builderProperty];
};

// noinspection JSUnusedGlobalSymbols
    /**
     * @param {string} name
     * @returns EntityTypeConfiguration
     */
    EntityTypeConfiguration.prototype.derivesFrom = function(name) {
        Args.notString(name,"Enity type name");
        this.baseType = name;
        return this;
    };
// noinspection JSUnusedGlobalSymbols
    /**
     * Creates an action that bind to this entity type
     * @param {string} name
     * @returns ActionConfiguration
     */
    EntityTypeConfiguration.prototype.addAction = function(name) {
        /**
         * @type {ActionConfiguration|*}
         */
        var a = this.hasAction(name);
        if (a) {
            return a;
        }
        a = new ActionConfiguration(name);
        //add current entity as parameter
        a.parameter("bindingParameter", this.name);
        a.isBound = true;
        this.actions.push(a);
        return a;
    };

    /**
     * Checks if entity type has an action with the given name
     * @param {string} name
     * @returns {ActionConfiguration|*}
     */
    EntityTypeConfiguration.prototype.hasAction = function(name) {
        if (_.isEmpty(name)) {
            return;
        }
        var findRe = new RegExp("^" + name + "$" ,"ig");
        return _.find(this.actions, function(x) {
            return findRe.test(x.name);
        });
    };
// noinspection JSUnusedGlobalSymbols
    /**
     * Creates an action that bind to this entity type
     * @param {string} name
     * @returns ActionConfiguration
     */
    EntityTypeConfiguration.prototype.addFunction = function(name) {
        var a = this.hasFunction(name);
        if (a) {
            return a;
        }
        a = new FunctionConfiguration(name);
        a.isBound = true;
        a.parameter("bindingParameter", this.name);
        //add current entity as parameter
        this.functions.push(a);
        return a;
    };

    /**
     * Checks if entity type has a function with the given name
     * @param {string} name
     * @returns {ActionConfiguration|*}
     */
    EntityTypeConfiguration.prototype.hasFunction = function(name) {
        if (_.isEmpty(name)) {
            return;
        }
        var findRe = new RegExp("^" + name + "$" ,"ig");
        return _.find(this.functions, function(x) {
            return findRe.test(x.name);
        });
    };

    /**
     * Adds a new EDM primitive property to this entity type.
     * @param {string} name
     * @param {string} type
     * @param {boolean=} nullable,
     * @returns EntityTypeConfiguration
     */
    EntityTypeConfiguration.prototype.addProperty = function(name, type, nullable) {
        Args.notString(name,"Property name");
        var exists =_.findIndex(this.property, function(x) {
            return x.name === name;
        });
        if (exists<0) {
            var p = {
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
    };

// noinspection JSUnusedGlobalSymbols
    /**
     * Adds a new EDM navigation property to this entity type.
     * @param {string} name
     * @param {string} type
     * @param {string} multiplicity
     * @returns EntityTypeConfiguration
     */
    EntityTypeConfiguration.prototype.addNavigationProperty = function(name, type, multiplicity) {
        Args.notString(name,"Property name");
        var exists =_.findIndex(this.navigationProperty, function(x) {
            return x.name === name;
        });

        var p = {
            "name":name,
            "type": (multiplicity==="Many") ? sprintf("Collection(%s)", type) : type
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
    };
// noinspection JSUnusedGlobalSymbols
    /**
     * Removes the navigation property from the entity.
     * @param {string} name
     * @returns {EntityTypeConfiguration}
     */
    EntityTypeConfiguration.prototype.removeNavigationProperty = function(name) {
        Args.notString(name,"Property name");
        var hasProperty =_.findIndex(this.property, function(x) {
            return x.name === name;
        });
        if (hasProperty>=0) {
            this.property.splice(hasProperty, 1);
        }
        return this;
    };

    /**
     * Ignores a property from the entity
     * @param name
     * @returns {EntityTypeConfiguration}
     */
    EntityTypeConfiguration.prototype.ignore = function(name) {
        Args.notString(name,"Property name");
        var hasProperty =_.findIndex(this.ignoredProperty, function(x) {
            return x.name === name;
        });
        if (hasProperty>=0) {
            return this;
        }
        this.ignoredProperty.push(name);
        return this;
    };
// noinspection JSUnusedGlobalSymbols
    /**
     * Removes the property from the entity.
     * @param {string} name
     * @returns {EntityTypeConfiguration}
     */
    EntityTypeConfiguration.prototype.removeProperty = function(name) {
        Args.notString(name,"Property name");
        var hasProperty =_.findIndex(this.property, function(x) {
            return x.name === name;
        });
        if (hasProperty>=0) {
            this.property.splice(hasProperty, 1);
        }
        return this;
    };
// noinspection JSUnusedGlobalSymbols
    /**
     * Removes the property from the entity keys collection.
     * @param {string} name
     * @returns {EntityTypeConfiguration}
     */
    EntityTypeConfiguration.prototype.removeKey = function(name) {
        Args.notString(name,"Key name");
        if (this.key && _.isArray(this.key.propertyRef)) {
            var hasKeyIndex = _.findIndex(this.key.propertyRef, function(x) {
                return x.name === name;
            });
            if (hasKeyIndex<0) {
                return this;
            }
            this.key.propertyRef.splice(hasKeyIndex, 1);
            return this;
        }
    };
// noinspection JSUnusedGlobalSymbols
    /**
     * Configures the key property(s) for this entity type.
     * @param {string} name
     * @param {string} type
     * @returns {EntityTypeConfiguration}
     */
    EntityTypeConfiguration.prototype.hasKey = function(name, type) {
        this.addProperty(name, type, false);
        this.key = {
            propertyRef: [
                {
                    "name": name
                }
            ]
        };
        return this;
    };

// noinspection JSUnusedGlobalSymbols
/**
 * @param {*} context
 * @param {*} any
 */
EntityTypeConfiguration.prototype.mapInstance = function(context, any) {
    if (any == null) {
        return;
    }
    if (context) {
        var contextLink = this.getBuilder().getContextLink(context);
        if (contextLink) {
            return _.assign({
                "@odata.context":contextLink + '#' + this.name
            }, any);
        }
    }
    return any;
};

// noinspection JSUnusedGlobalSymbols
/**
 * @param {*} context
 * @param {string} property
 * @param {*} any
 */
EntityTypeConfiguration.prototype.mapInstanceProperty = function(context, property, any) {
    var builder = this.getBuilder();
    if (context && typeof builder.getContextLink === 'function') {
        var contextLink = builder.getContextLink(context);
        if (contextLink) {
            if (context.request && context.request.url) {
                contextLink += '#';
                contextLink += context.request.url.replace(builder.serviceRoot, '');
            }
            return {
                "@odata.context":contextLink,
                "value": any
            };
        }
    }
    return {
        "value": any
    };
};
// noinspection JSUnusedGlobalSymbols
/**
 *
 * @param {*} context
 * @param {*} any
 * @returns {*}
 */
EntityTypeConfiguration.prototype.mapInstanceSet = function(context, any) {
    var result = {};
    if (context) {
        var contextLink = this.getBuilder().getContextLink(context);
        if (contextLink) {
            result["@odata.context"] = contextLink + '#' + this.name;
        }
    }
    //search for total property for backward compatibility issues
    if (any.hasOwnProperty("total") && /^\+?\d+$/.test(any["total"])) {
        result["@odata.count"] = parseInt(any["total"]);
    }
    if (any.hasOwnProperty("count") && /^\+?\d+$/.test(any["count"])) {
        result["@odata.count"] = parseInt(any["count"]);
    }
    result["value"] = [];
    if (_.isArray(any)) {
        result["value"] = any;
    }
    //search for records property for backward compatibility issues
    else if (_.isArray(any.records)) {
        result["value"] = any.records;
    }
    else if (_.isArray(any.value)) {
        result["value"] = any.value;
    }
    return result;
};



/**
 * @class
 * @param {ODataModelBuilder} builder
 * @param {string} entityType
 * @param {string} name
 */
function EntitySetConfiguration(builder, entityType, name) {
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

    Object.defineProperty(this,'entityType', {
        get: function() {
            if (!this[builderProperty].hasEntity(this[entityTypeProperty])) {
                return this[builderProperty].addEntity(this[entityTypeProperty]);
            }
            return this[builderProperty].getEntity(this[entityTypeProperty]);
        }
    });

    this.hasContextLink(
        /**
         * @this EntitySetConfiguration
         * @param context
         * @returns {string|*}
         */
        function(context) {
        var thisBuilder = this.getBuilder();
        if (_.isNil(thisBuilder)) {
            return;
        }
        if (typeof thisBuilder.getContextLink !== 'function') {
            return;
        }
        //get builder context link
        var builderContextLink = thisBuilder.getContextLink(context);
        if (builderContextLink) {
            //add hash for entity set
            return builderContextLink + "#" + this.name;
        }
    });

}
// noinspection JSUnusedGlobalSymbols
EntitySetConfiguration.prototype.hasUrl = function(url) {
        Args.notString(url, 'Entity Resource Path');
        this.url = url;
    };
// noinspection JSUnusedGlobalSymbols
EntitySetConfiguration.prototype.getUrl = function() {
        return this.url;
    };

    /**
     * @returns {ODataModelBuilder}
     */
    EntitySetConfiguration.prototype.getBuilder = function() {
        return this[builderProperty];
    };

// noinspection JSUnusedGlobalSymbols
    /**
     * @returns {*}
     */
    EntitySetConfiguration.prototype.getEntityTypePropertyList = function() {
        var result = {};
        _.forEach(this.entityType.property, function(x) {
            result[x.name] = x;
        });
        var baseEntityType = this.getBuilder().getEntity(this.entityType.baseType);
        while (baseEntityType) {
            _.forEach(baseEntityType.property, function(x) {
                result[x.name] = x;
            });
            baseEntityType = this.getBuilder().getEntity(baseEntityType.baseType);
        }
        return result;
    };
// noinspection JSUnusedGlobalSymbols
    /**
     * @param {string} name
     * @param  {boolean=} deep
     * @returns {*}
     */
    EntitySetConfiguration.prototype.getEntityTypeProperty = function(name, deep) {
        var re = new RegExp("^" + name + "$","ig");
        var p = _.find(this.entityType.property, function(x) {
            return re.test(x.name);
        });
        if (p) {
            return p;
        }
        var deep_ = _.isBoolean(deep) ? deep : true;
        if (deep_) {
            var baseEntityType = this.getBuilder().getEntity(this.entityType.baseType);
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
    };
// noinspection JSUnusedGlobalSymbols
    /**
     * @returns {*}
     */
    EntitySetConfiguration.prototype.getEntityTypeIgnoredPropertyList = function() {
        var result = [].concat(this.entityType.ignoredProperty);
        var baseEntityType = this.getBuilder().getEntity(this.entityType.baseType);
        while (baseEntityType) {
            result.push.apply(result, baseEntityType.ignoredProperty);
            baseEntityType = this.getBuilder().getEntity(baseEntityType.baseType);
        }
        return result;
    };
// noinspection JSUnusedGlobalSymbols
    /**
     * @param {string} name
     * @param  {boolean=} deep
     * @returns {*}
     */
    EntitySetConfiguration.prototype.getEntityTypeNavigationProperty = function(name, deep) {
        var re = new RegExp("^" + name + "$","ig");
        var p = _.find(this.entityType.navigationProperty, function(x) {
            return re.test(x.name);
        });
        if (p) {
            return p;
        }
        var deep_ = _.isBoolean(deep) ? deep : true;
        if (deep_) {
            var baseEntityType = this.getBuilder().getEntity(this.entityType.baseType);
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
    };

// noinspection JSUnusedGlobalSymbols
    /**
     * @returns {*}
     */
    EntitySetConfiguration.prototype.getEntityTypeNavigationPropertyList = function() {
        var result = [];
        _.forEach(this.entityType.navigationProperty, function(x) {
            result[x.name] = x;
        });
        var baseEntityType = this.getBuilder().getEntity(this.entityType.baseType);
        while (baseEntityType) {
            _.forEach(baseEntityType.navigationProperty, function(x) {
                result[x.name] = x;
            });
            baseEntityType = this.getBuilder().getEntity(baseEntityType.baseType);
        }
        return result;
    };

// noinspection JSUnusedGlobalSymbols
    /**
     * @param contextLinkFunc
     */
    EntitySetConfiguration.prototype.hasContextLink = function(contextLinkFunc) {
// noinspection JSUnusedGlobalSymbols
        this.getContextLink = contextLinkFunc;
    };

// noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {Function} idLinkFunc
     */
    EntitySetConfiguration.prototype.hasIdLink = function(idLinkFunc) {
// noinspection JSUnusedGlobalSymbols
        this.getIdLink = idLinkFunc;
    };

// noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {Function} readLinkFunc
     */
    EntitySetConfiguration.prototype.hasReadLink = function(readLinkFunc) {
// noinspection JSUnusedGlobalSymbols
        this.getReadLink = readLinkFunc;
    };

// noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {Function} editLinkFunc
     */
    EntitySetConfiguration.prototype.hasEditLink = function(editLinkFunc) {
// noinspection JSUnusedGlobalSymbols
        this.getEditLink = editLinkFunc;
    };
// noinspection JSUnusedGlobalSymbols
/**
 * @param {*} context
 * @param {*} any
 */
EntitySetConfiguration.prototype.mapInstance = function(context, any) {
    if (any == null) {
        return;
    }
    if (context) {
        var contextLink = this.getContextLink(context);
        if (contextLink) {
            return _.assign({
                "@odata.context":contextLink + '/$entity'
            }, any);
        }
    }
    return any;
};
// noinspection JSUnusedGlobalSymbols
/**
 * @param {*} context
 * @param {string} property
 * @param {*} any
 */
EntitySetConfiguration.prototype.mapInstanceProperty = function(context, property, any) {
    var builder = this.getBuilder();
    if (context && typeof builder.getContextLink === 'function') {
        var contextLink = builder.getContextLink(context);
        if (contextLink) {
            if (context.request && context.request.url) {
                contextLink += '#';
                contextLink += context.request.url.replace(builder.serviceRoot, '');
            }
            return {
                "@odata.context":contextLink,
                "value": any
            };
        }
    }
    return {
        "value": any
    };
};

// noinspection JSUnusedGlobalSymbols
/**
 *
 * @param {*} context
 * @param {*} any
 * @returns {*}
 */
EntitySetConfiguration.prototype.mapInstanceSet = function(context, any) {
    var result = {};
    if (context) {
        var contextLink = this.getContextLink(context);
        if (contextLink) {
            result["@odata.context"] = contextLink;
        }
    }
    //search for total property for backward compatibility issues
    if (any.hasOwnProperty("total") && /^\+?\d+$/.test(any["total"])) {
        result["@odata.count"] = parseInt(any["total"]);
    }
    else if (any.hasOwnProperty("count") && /^\+?\d+$/.test(any["count"])) {
        result["@odata.count"] = parseInt(any["count"]);
    }
    if (any.hasOwnProperty("skip") && /^\+?\d+$/.test(any["skip"])) {
        result["@odata.skip"] = parseInt(any["skip"]);
    }
    result["value"] = [];
    if (_.isArray(any)) {
        result["value"] = any;
    }
    //search for records property for backward compatibility issues
    else if (_.isArray(any.records)) {
        result["value"] = any.records;
    }
    else if (_.isArray(any.value)) {
        result["value"] = any.value;
    }
    return result;
};


/**
 * @class
 * @param {*} builder
 * @param {string} entityType
 * @param {string} name
 * @constructor
 * @augments EntitySetConfiguration
 * @extends EntitySetConfiguration
 */
function SingletonConfiguration(builder, entityType, name) {
    SingletonConfiguration.super_.bind(this)(builder, entityType, name);
    this.kind = EntitySetKind.Singleton;
}
LangUtils.inherits(SingletonConfiguration, EntitySetConfiguration);

/**
 * Converts schema configuration to an edm document
 * @private
 * @this ODataModelBuilder
 * @param {SchemaConfiguration} schema
 * @returns {XDocument}
 */
function schemaToEdmDocument(schema) {
    var doc = new XDocument();
    var rootElement = doc.createElement("edmx:Edmx");
    rootElement.setAttribute("xmlns:edmx", "http://docs.oasis-open.org/odata/ns/edmx");
    rootElement.setAttribute("Version","4.0");
    doc.appendChild(rootElement);
    var dataServicesElement = doc.createElement("edmx:DataServices");
    var schemaElement = doc.createElement("Schema");
    schemaElement.setAttribute("xmlns", "http://docs.oasis-open.org/odata/ns/edm");
    if (schema.namespace) {
        schemaElement.setAttribute("Namespace", schema.namespace);
    }
    var actionElements = [], functionElements = [];
    //append edmx:DataServices > Schema
    dataServicesElement.appendChild(schemaElement);
    _.forEach(schema.entityType,
        /**
         *
         * @param {EntityTypeConfiguration} entityType
         */
        function(entityType) {

            //search for bound actions
            _.forEach(entityType.actions.concat(entityType.collection.actions), function(action) {
                var actionElement = doc.createElement("Action");
                actionElement.setAttribute("Name", action.name);
                actionElement.setAttribute("IsBound", true);
                if (action.isComposable) {
                    actionElement.setAttribute("IsComposable", action.isComposable);
                }
                _.forEach(action.parameters, function(parameter) {
                    var paramElement =  doc.createElement("Parameter");
                    paramElement.setAttribute("Name", parameter.name);
                    paramElement.setAttribute("Type", parameter.type);
                    var nullable = _.isBoolean(parameter.nullable) ? parameter.nullable : false;
                    if (!nullable) {
                        paramElement.setAttribute("Nullable", nullable);
                    }
                    //append Action > Parameter
                    actionElement.appendChild(paramElement)
                });
                if (action.returnType || action.returnCollectionType) {
                    var returnTypeElement =  doc.createElement("ReturnType");
                    var returnType = action.returnType;
                    if (action.returnCollectionType) {
                        returnType = action.returnCollectionType;
                        returnTypeElement.setAttribute("Type", sprintf("Collection(%s)", returnType));
                    }
                    else {
                        returnTypeElement.setAttribute("Type", returnType);
                    }
                    returnTypeElement.setAttribute("Nullable", true);
                    actionElement.appendChild(returnTypeElement);
                }
                actionElements.push(actionElement);
            });

            //search for bound functions
            _.forEach(entityType.functions.concat(entityType.collection.functions), function(func) {
                var functionElement = doc.createElement("Function");
                functionElement.setAttribute("Name", func.name);
                functionElement.setAttribute("IsBound", true);
                if (func.isComposable) {
                    functionElement.setAttribute("IsComposable", func.isComposable);
                }
                _.forEach(func.parameters, function(parameter) {
                    var paramElement =  doc.createElement("Parameter");
                    paramElement.setAttribute("Name", parameter.name);
                    paramElement.setAttribute("Type", parameter.type);
                    var nullable = _.isBoolean(parameter.nullable) ? parameter.nullable : false;
                    if (!nullable) {
                        paramElement.setAttribute("Nullable", nullable);
                    }
                    //append Function > Parameter
                    functionElement.appendChild(paramElement)
                });
                if (func.returnType || func.returnCollectionType) {
                    var returnTypeElement =  doc.createElement("ReturnType");
                    var returnType = func.returnType;
                    if (func.returnCollectionType) {
                        returnType = func.returnCollectionType;
                        returnTypeElement.setAttribute("Type", sprintf("Collection(%s)", returnType));
                    }
                    else {
                        returnTypeElement.setAttribute("Type", returnType);
                    }
                    returnTypeElement.setAttribute("Nullable", true);
                    functionElement.appendChild(returnTypeElement);
                }
                functionElements.push(functionElement);
            });

            //create element Schema > EntityType
            var entityTypeElement = doc.createElement("EntityType");
            entityTypeElement.setAttribute("Name", entityType.name);
            entityTypeElement.setAttribute("OpenType", true);
            if (entityType.baseType) {
                entityTypeElement.setAttribute("BaseType", entityType.baseType);
            }

            if (entityType.key && entityType.key.propertyRef) {
                var keyElement = doc.createElement('Key');
                _.forEach(entityType.key.propertyRef, function(key) {
                    var keyRefElement = doc.createElement('PropertyRef');
                    keyRefElement.setAttribute("Name",key.name);
                    keyElement.appendChild(keyRefElement);
                });
                entityTypeElement.appendChild(keyElement);
            }
            //enumerate properties
            _.forEach(entityType.property, function(x) {
                var propertyElement = doc.createElement('Property');
                propertyElement.setAttribute("Name",x.name);
                propertyElement.setAttribute("Type",x.type);
                if (_.isBoolean(x.nullable) && (x.nullable===false)) {
                    propertyElement.setAttribute("Nullable",false);
                }
                // add annotations
                if (x.immutable) {
                    var immutableAnnotation = doc.createElement('Annonation');
                    immutableAnnotation.setAttribute('Term', 'Org.OData.Core.V1.Immutable');
                    immutableAnnotation.setAttribute('Tag', 'true');
                    propertyElement.appendChild(immutableAnnotation);
                }
                if (x.computed) {
                    var computedAnnotation = doc.createElement('Annonation');
                    computedAnnotation.setAttribute('Term', 'Org.OData.Core.V1.Computed');
                    computedAnnotation.setAttribute('Tag', 'true');
                    propertyElement.appendChild(computedAnnotation);
                }
                entityTypeElement.appendChild(propertyElement);
            });
            //enumerate navigation properties
            _.forEach(entityType.navigationProperty, function(x) {
                var propertyElement = doc.createElement('NavigationProperty');
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
    var entityContainerElement = doc.createElement("EntityContainer");
    entityContainerElement.setAttribute("Name", schema.entityContainer.name || "DefaultContainer");

    _.forEach(schema.entityContainer.entitySet,
        /**
         * @param {EntitySetConfiguration} child
         */
        function(child) {
            var childElement = doc.createElement(child.kind);
            childElement.setAttribute("Name", child.name);
            if ((child.kind === EntitySetKind.EntitySet) || (child.kind === EntitySetKind.Singleton)) {
                childElement.setAttribute("EntityType", child.entityType.name);
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
    return doc;

}


/**
 * @classdesc Represents the OData model builder of an HTTP application
 * @property {string} serviceRoot - Gets or sets the service root URI
 * @param {ConfigurationBase} configuration
 * @class
 */
function ODataModelBuilder(configuration) {

    this[entityTypesProperty] = {};
    this[ignoreEntityTypesProperty] = [];
    this[entityContainerProperty] = [];
    /**
     * @returns {ConfigurationBase}
     */
    this.getConfiguration = function() {
        return configuration;
    };
    var serviceRoot_;
    var self = this;
    Object.defineProperty(this,'serviceRoot', {
      get:function() {
          return serviceRoot_;
      },
        set: function(value) {
            serviceRoot_ = value;
            if (typeof self.getContextLink === 'undefined') {
                //set context link builder function
                self.hasContextLink(function(context) {
                    var req = context.request;
                    var p = /\/$/g.test(serviceRoot_) ? serviceRoot_ + "$metadata" : serviceRoot_ + "/" + "$metadata";
                    if (req) {
                        return (req.protocol||"http") + "://" + req.headers.host + p;
                    }
                    return p;
                });
            }
        }
    })
}

    /**
     * Gets a registered entity type
     * @param {string} name
     * @returns {EntityTypeConfiguration|*}
     */
    ODataModelBuilder.prototype.getEntity = function(name) {
        if (_.isNil(name)) {
            return;
        }
        Args.notString(name, 'Entity type name');
        return this[entityTypesProperty][name];
    };

    /**
     * Registers an entity type
     * @param {string} name
     * @returns {EntityTypeConfiguration}
     */
    ODataModelBuilder.prototype.addEntity = function(name) {
        if (!this.hasEntity(name)) {
            this[entityTypesProperty][name] = new EntityTypeConfiguration(this, name);
        }
        return this.getEntity(name)
    };
// noinspection JSUnusedGlobalSymbols
    /**
     * @param {*} entityType
     * @param {string} name
     * @returns SingletonConfiguration|*
     */
    ODataModelBuilder.prototype.addSingleton = function(entityType, name) {
        if (!this.hasSingleton(name)) {
            this[entityContainerProperty].push(new SingletonConfiguration(this, entityType, name));
        }
        return this.getSingleton(name);
    };

    /**
     * Gets an entity set
     * @param name
     * @returns {SingletonConfiguration}
     */
    ODataModelBuilder.prototype.getSingleton =function(name) {
        Args.notString(name, 'Singleton Name');
        var re = new RegExp("^" + name + "$","ig");
        return _.find(this[entityContainerProperty], function(x) {
            return re.test(x.name) && x.kind === EntitySetKind.Singleton;
        });
    };

    /**
     * @param {string} name
     * @returns {SingletonConfiguration|*}
     */
    ODataModelBuilder.prototype.hasSingleton = function(name) {
        var findRe = new RegExp("^" + name + "$" ,"ig");
        return _.findIndex(this[entityContainerProperty], function(x) {
            return findRe.test(x.name) && x.kind === EntitySetKind.Singleton;
        })>=0;
    };

    /**
     * Checks if the given entity set exists in entity container
     * @param {string} name
     * @returns {boolean}
     */
    ODataModelBuilder.prototype.hasEntitySet = function(name) {
        var findRe = new RegExp("^" + name + "$" ,"ig");
        return _.findIndex(this[entityContainerProperty], function(x) {
            return findRe.test(x.name) && x.kind === EntitySetKind.EntitySet;
        })>=0;
    };
// noinspection JSUnusedGlobalSymbols
    /**
     * Registers an entity type
     * @param {string} entityType
     * @param {string} name
     * @returns {EntitySetConfiguration}
     */
    ODataModelBuilder.prototype.addEntitySet = function(entityType, name) {
        if (!this.hasEntitySet(name)) {
            this[entityContainerProperty].push(new EntitySetConfiguration(this, entityType, name));
        }
        return this.getEntitySet(name);
    };

/**
 * Registers an entity type
 * @param {string} name
 * @returns {boolean}
 */
ODataModelBuilder.prototype.removeEntitySet = function(name) {
    var findRe = new RegExp("^" + name + "$" ,"ig");
    var index = _.findIndex(this[entityContainerProperty], function(x) {
        return findRe.test(x.name) && x.kind === EntitySetKind.EntitySet;
    });
    if (index>=0) {
        this[entityContainerProperty].splice(index,1);
        return true;
    }
    return false;
};


    /**
     * Gets an entity set
     * @param name
     * @returns {EntitySetConfiguration}
     */
    ODataModelBuilder.prototype.getEntitySet = function(name) {
        Args.notString(name, 'EntitySet Name');
        var re = new RegExp("^" + name + "$","ig");
        return _.find(this[entityContainerProperty], function(x) {
            return re.test(x.name) && x.kind === EntitySetKind.EntitySet;
        });
    };

    /**
     * Gets an entity set based on the given entity name
     * @param {string} entityName
     * @returns {EntitySetConfiguration}
     */
    ODataModelBuilder.prototype.getEntityTypeEntitySet = function(entityName) {
        Args.notString(entityName, 'Entity Name');
        var re = new RegExp("^" + entityName + "$","ig");
        return _.find(this[entityContainerProperty], function(x) {
            return x.entityType && re.test(x.entityType.name);
        });
    };

    /**
     * Ignores the entity type with the given name
     * @param {string} name
     * @returns {ODataModelBuilder}
     */
    ODataModelBuilder.prototype.ignore = function(name) {
        var hasEntity = this[ignoreEntityTypesProperty].indexOf(name);
        if (hasEntity < 0) {
            this[ignoreEntityTypesProperty].push(name);
        }
        return this;
    };
// noinspection JSUnusedGlobalSymbols
    /**
     * Checks if the given entity type exists in entity's collection
     * @param {string} name
     * @returns {boolean}
     */
    ODataModelBuilder.prototype.hasEntity = function(name) {
        return this[entityTypesProperty].hasOwnProperty(name);
    };

    /**
     * Creates and returns a structure based on the configuration performed using this builder
     * @returns {Promise}
     */
    ODataModelBuilder.prototype.getEdm = function() {
        var self = this;
        return Q.promise(function(resolve, reject) {
            try{
                var schema = {
                    entityType:[],
                    entityContainer: {
                        "name":"DefaultContainer",
                        "entitySet":[]
                    }
                };
                //get entity types by excluding ignored entities
                var keys = _.filter(_.keys(self[entityTypesProperty]), function(x) {
                    return self[ignoreEntityTypesProperty].indexOf(x)<0;
                });
                //enumerate entity types
                _.forEach(keys, function(key) {
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
    };

/**
 * Returns entity based on the configuration performed using this builder in
 * @returns {SchemaConfiguration}
 */
ODataModelBuilder.prototype.getEdmSync = function() {
    var self = this;
    /**
     * @type {SchemaConfiguration}
     */
    var schema = {
        entityType:[],
        entityContainer: {
            "name":"DefaultContainer",
            "entitySet":[]
        }
    };
    //get entity types by excluding ignored entities
    var keys = _.filter(_.keys(self[entityTypesProperty]), function(x) {
        return self[ignoreEntityTypesProperty].indexOf(x)<0;
    });
    //enumerate entity types
    _.forEach(keys, function(key) {
        schema.entityType.push(self[entityTypesProperty][key]);
    });
    //apply entity sets
    schema.entityContainer.entitySet.push.apply(schema.entityContainer.entitySet, self[entityContainerProperty]);
    return schema;
};

// noinspection JSUnusedGlobalSymbols
    /**
     * @param {boolean=} all
     * @returns {ODataModelBuilder}
     */
    ODataModelBuilder.prototype.clean = function(all) {
        delete this[edmProperty];
        if (typeof all === 'boolean' && all === true) {
            this[entityTypesProperty] = {};
            this[ignoreEntityTypesProperty] = [];
            this[entityContainerProperty] = [];
        }
        return this;
    };
// noinspection JSUnusedGlobalSymbols
    /**
     * Creates and returns an XML structure based on the configuration performed using this builder
     * @returns {Promise<XDocument>}
     */
    ODataModelBuilder.prototype.getEdmDocument = function() {
        var self = this;
        return Q.promise(function(resolve, reject) {
            try{
                return self.getEdm().then(function(schema) {
                    var doc = schemaToEdmDocument.bind(self)(schema);
                    return resolve(doc);
                }).catch(function(err) {
                    return reject(err);
                });
            }
            catch(err) {
                return reject(err);
            }
        });
    };
// noinspection JSUnusedGlobalSymbols
/**
 * Returns an XML structure based on the configuration performed using this builder
 * @returns {XDocument}
 */
ODataModelBuilder.prototype.getEdmDocumentSync = function() {

    /**
     * get schema configuration
     * @type {SchemaConfiguration}
     */
    var schema = this.getEdmSync();
    // convert schema to edm document
    return schemaToEdmDocument.bind(this)(schema);
};

// noinspection JSUnusedGlobalSymbols
    /**
     * @param {Function} contextLinkFunc
     */
    ODataModelBuilder.prototype.hasContextLink = function(contextLinkFunc) {
        this.getContextLink = contextLinkFunc;
    };

// noinspection JSUnusedGlobalSymbols
/**
 *
 * @param jsonFormatterFunc
 */
ODataModelBuilder.prototype.hasJsonFormatter = function(jsonFormatterFunc) {
        this.jsonFormatter = jsonFormatterFunc;
    };


    /**
     * @param {EntitySetConfiguration} entitySet
     * @param {*} context
     * @param {*} instance
     * @param {*=} options
     * @returns *
     */
    ODataModelBuilder.prototype.jsonFormatter = function(context, entitySet, instance, options) {
        var self = this;
        var defaults = _.assign({
            addContextAttribute:true,
            addCountAttribute:false
        }, options);
        var entityProperty = entitySet.getEntityTypePropertyList();
        var entityNavigationProperty = entitySet.getEntityTypeNavigationPropertyList();
        var ignoredProperty = entitySet.getEntityTypeIgnoredPropertyList();
        var singleJsonFormatter = function(instance) {
            var result = {};
            _.forEach(_.keys(instance), function(key) {
                if (ignoredProperty.indexOf(key)<0) {
                    if (entityProperty.hasOwnProperty(key)) {
                        var p = entityProperty[key];
                        if (p.type === EdmType.EdmBoolean) {
                            result[key] = parseBoolean(instance[key]);
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
                            var match = /^Collection\((.*?)\)$/.exec(entityNavigationProperty[key].type);
                            var entityType = match ? match[1] : entityNavigationProperty[key].type;
                            var entitySet = self.getEntityTypeEntitySet(/\.?(\w+)$/.exec(entityType)[1]);
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
        var value;
        var result = {};
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
    };

/**
 * @class
 * @returns {*}
 * @constructor
 * @param {ConfigurationBase} configuration
 * @augments DataContext
 * @extends DataContext
 */
function EntityDataContext(configuration) {
    EntityDataContext.super_.bind(this)();
    /**
     * @returns {ConfigurationBase}
     */
    this.getConfiguration = function() {
        return configuration;
    };
}
LangUtils.inherits(EntityDataContext, DataContext);

EntityDataContext.prototype.model = function(name) {
    var strategy = this.getConfiguration().getStrategy(DataConfigurationStrategy);
    if (strategy.dataTypes.hasOwnProperty(name)) {
        return;
    }
    var definition = strategy.model(name);
    if (_.isNil(definition)) {
        return;
    }
    var res = new DataModel(definition);
    res.context = this;
    return res;
};


/**
 * @class
 * @param {DataConfiguration} configuration
 * @augments ODataModelBuilder
 * @extends ODataModelBuilder
 */
function ODataConventionModelBuilder(configuration) {

    ODataConventionModelBuilder.super_.bind(this)(configuration);

}
LangUtils.inherits(ODataConventionModelBuilder, ODataModelBuilder);
    /**
     * Automatically registers an entity type from the given model
     * @param {string} entityType
     * @param {string} name
     * @returns {EntitySetConfiguration}
     */
    ODataConventionModelBuilder.prototype.addEntitySet = function(entityType, name) {
        var self = this;
        // noinspection JSPotentiallyInvalidConstructorUsage
        var superAddEntitySet = ODataConventionModelBuilder.super_.prototype.addEntitySet;
        /**
         * @type {EntityTypeConfiguration}
         */
        if (this.hasEntitySet(name)) {
            return this.getEntitySet(name);
        }
        /**
         * @type {DataConfigurationStrategy}
         */
        var strategy = self.getConfiguration().getStrategy(DataConfigurationStrategy);
        if (strategy) {
            /**
             * @type {EntitySetConfiguration}
             */
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
                /**
                 * @type {DataModel}
                 */
                var model = new DataModel(definition);
                model.context = new EntityDataContext(self.getConfiguration());
                var inheritedAttributes = [];
                var primaryKey = _.find(model.attributes, function(x) {
                    return x.primary;
                });
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
                _.forEach(_.filter(model.attributes, function(x) {
                    if (x.primary && model.inherits) {
                        return false;
                    }
                    return (x.model === model.name) && (inheritedAttributes.indexOf(x.name)<0);
                }), function(x) {
                    var name = x.property || x.name;
                    var mapping = model.inferMapping(x.name);
                    if (_.isNil(mapping)) {
                        //find data type
                        var dataType = strategy.dataTypes[x.type];
                        //add property
                        var edmType = _.isObject(dataType) ? (dataType.hasOwnProperty("edmtype") ? dataType["edmtype"]: "Edm." + x.type) : x.type;
                        modelEntityType.addProperty(name, edmType, x.hasOwnProperty('nullable') ? x.nullable : true);
                        if (x.primary) {
                            modelEntityType.hasKey(name, edmType);
                        }
                        const findProperty = modelEntityType.property.find( p => {
                            return p.name === name;
                        });
                        // add immutable annotation
                        if (Object.prototype.hasOwnProperty.call(x, 'editable')) {
                            if (x.editable) {
                                Object.defineProperty(findProperty, 'immutable', {
                                    configurable: true,
                                     enumerable: true,
                                    writable: true,
                                    value: true
                                });
                            }
                        }
                        // add computed annotation
                        if (Object.prototype.hasOwnProperty.call(x, 'calculation')) {
                            Object.defineProperty(findProperty, 'computed', {
                                configurable: true,
                                enumerable: true,
                                writable: true,
                                value: true
                            });
                        }
                    }
                    else {
                        var namespacedType = x.type;
                        //add navigation property
                        var isNullable = x.hasOwnProperty('nullable') ? x.nullable : true;
                        // add an exception for one-to-one association
                        if (x.multiplicity === EdmMultiplicity.ZeroOrOne || x.multiplicity === EdmMultiplicity.One) {
                            modelEntityType.addNavigationProperty(name, namespacedType, x.multiplicity);
                        }
                        else {
                            modelEntityType.addNavigationProperty(name, namespacedType, x.many ? EdmMultiplicity.Many: (isNullable ? EdmMultiplicity.ZeroOrOne : EdmMultiplicity.One));
                        }
                        //add navigation property entity (if type is not a primitive type)
                        if (!strategy.dataTypes.hasOwnProperty(x.type)) {
                            self.addEntitySet(x.type, pluralize(x.type));
                        }
                    }
                });
                //enumerate functions
                var DataObjectClass = model.getDataObjectType();
                //get static functions
                var ownFunctions = EdmMapping.getOwnFunctions(DataObjectClass);
                _.forEach(ownFunctions, function(x) {
                    modelEntityType.collection.addFunction(x.name);
                    _.assign(modelEntityType.collection.hasFunction(x.name), x);
                });
                //get instance functions
                ownFunctions = EdmMapping.getOwnFunctions(DataObjectClass.prototype);
                _.forEach(ownFunctions, function(x) {
                    modelEntityType.addFunction(x.name);
                    _.assign(modelEntityType.hasFunction(x.name), x);
                });
                //get static actions
                var ownActions = EdmMapping.getOwnActions(DataObjectClass);
                _.forEach(ownActions, function(x) {
                    modelEntityType.collection.addAction(x.name);
                    _.assign(modelEntityType.collection.hasAction(x.name), x);
                });
                //get instance actions
                ownActions = EdmMapping.getOwnActions(DataObjectClass.prototype);
                _.forEach(ownActions, function(x) {
                    modelEntityType.addAction(x.name);
                    _.assign(modelEntityType.hasAction(x.name), x);
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
    };

    /**
     * @returns Promise|*
     */
    ODataConventionModelBuilder.prototype.initialize = function() {
        var self = this;
        if (self[initializeProperty]) {
            return Q.resolve();
        }
        return Q.promise(function(resolve, reject) {

            /**
             * @type {*|DataConfigurationStrategy}
             */
            var dataConfiguration = self.getConfiguration().getStrategy(DataConfigurationStrategy);
            var schemaLoader = self.getConfiguration().getStrategy(SchemaLoaderStrategy);
            if (instanceOf(schemaLoader, DefaultSchemaLoaderStrategy)) {
                var nativeFsModule = 'fs';
                var fs = require(nativeFsModule);
                var modelPath = schemaLoader.getModelPath();
                if (_.isNil(modelPath)) {
                    self[initializeProperty] = true;
                    return resolve();
                }
                return fs.readdir(modelPath, function(err, files) {
                    try {
                        if (err) {
                            return reject(err);
                        }
                        var models = _.map( _.filter(files, function(x) {
                            return /\.json$/.test(x);
                        }), function(x) {
                            return /(.*?)\.json$/.exec(x)[1];
                        });
                        _.forEach(models, function (x) {
                            if (!_.isNil(x)) {
                                self.addEntitySet(x, pluralize(x));
                            }
                        });
                        //remove hidden models from entity set container
                        for (var i = 0; i < self[entityContainerProperty].length; i++) {
                            var x = self[entityContainerProperty][i];
                            //get model
                            var entityTypeName = x.entityType.name;
                            var definition = dataConfiguration.model(x.entityType.name);
                            if (definition && definition.hidden) {
                                self.removeEntitySet(x.name);
                                if (!definition.abstract) {
                                    self.ignore(entityTypeName);
                                }
                                i -= 1;
                            }
                        }
                        self[initializeProperty] = true;
                        return resolve();
                    }
                    catch(err) {
                        return reject(err);
                    }
                });
            }
            self[initializeProperty] = true;
            return resolve();
        });

    };

/**
 * @returns *
 */
ODataConventionModelBuilder.prototype.initializeSync = function() {
    var self = this;
    if (self[initializeProperty]) {
        return;
    }
    /**
     * @type {*|DataConfigurationStrategy}
     */
    var dataConfiguration = self.getConfiguration().getStrategy(DataConfigurationStrategy);
    var schemaLoader = self.getConfiguration().getStrategy(SchemaLoaderStrategy);
    if (instanceOf(schemaLoader, DefaultSchemaLoaderStrategy)) {
        // read models
        var models = schemaLoader.readSync();
        // use loaders of DefaultSchemaLoaderStrategy
        if (schemaLoader.loaders) {
            _.forEach(schemaLoader.loaders,
                /**
                 * @param {SchemaLoaderStrategy} loader
                 */
                function(loader) {
                    // get loader models
                var otherModels = loader.readSync();
                if (otherModels && otherModels.length) {
                    // get new models provided by loader
                    var addModels = _.filter(otherModels, function(otherModel) {
                        return models.indexOf(otherModel) < 0;
                    });
                    // add those models
                    models.push.apply(models, addModels);
                }
            });
        }
        // add entity set
        _.forEach(models, function (x) {
            if (!_.isNil(x)) {
                self.addEntitySet(x, pluralize(x));
            }
        });
        //remove hidden models from entity set container
        for (var i = 0; i < self[entityContainerProperty].length; i++) {
            var x = self[entityContainerProperty][i];
            //get model
            var entityTypeName = x.entityType.name;
            var definition = dataConfiguration.model(x.entityType.name);
            if (definition && definition.hidden) {
                self.removeEntitySet(x.name);
                if (!definition.abstract) {
                    self.ignore(entityTypeName);
                }
                i -= 1;
            }
        }
    }
    self[initializeProperty] = true;
};

    /**
     * Creates and returns a structure based on the configuration performed using this builder
     * @returns {Promise|*}
     */
    ODataConventionModelBuilder.prototype.getEdm = function() {
        // noinspection JSPotentiallyInvalidConstructorUsage
        var self = this, superGetEdm = ODataConventionModelBuilder.super_.prototype.getEdm;
        try{
            if (_.isObject(self[edmProperty])) {
                return Q.resolve(self[edmProperty]);
            }
            return self.initialize().then(function() {
                return superGetEdm.bind(self)().then(function(result) {
                    self[edmProperty] = result;
                    return Q.resolve(self[edmProperty]);
                });
            });
        }
        catch(err) {
            return Q.reject(err);
        }
    };

/**
 * Returns schema based on the configuration performed with this builder
 * @returns {SchemaConfiguration}
 */
ODataConventionModelBuilder.prototype.getEdmSync = function() {
    // noinspection JSPotentiallyInvalidConstructorUsage
    var superGetEdmSync = ODataConventionModelBuilder.super_.prototype.getEdmSync;
    if (_.isObject(this[edmProperty])) {
        return this[edmProperty];
    }
    // use sync initialization
    this.initializeSync();
    // get edm (and store schema configuration for future calls)
    this[edmProperty] = superGetEdmSync.bind(this)();
    // return schema configuration
    return this[edmProperty];
};





/**
 *
 * @param {Object|Function} proto - The constructor function of a class or the prototype of a class
 * @param {string} key - The name of the property or method where the decorator will be included
 * @param {Function} decorator - The decorator to be included
 */
function defineDecorator(proto, key, decorator) {
    if ((typeof proto !== 'object') && (typeof proto !== 'function')) {
        throw new TypeError('Invalid prototype. Expected object or function.');
    }
    if (typeof key !== 'string') {
        throw new TypeError('Invalid property name. Expected string or function.');
    }
    if (typeof decorator !== 'function') {
        throw new TypeError('Invalid decorator. Expected function.');
    }
    decorator(proto, key, Object.getOwnPropertyDescriptor(proto, key));
}
//extend object
if (typeof Object.defineDecorator === 'undefined') {
    /**
     * @function defineDecorator
     * @param {Object|Function} proto - The constructor function of a class or the prototype of a class
     * @param {string} key - The name of the property or method where the decorator will be included
     * @param {Function} decorator - The decorator to be included
     * @memberOf Object
     * @static
     */
    Object.defineDecorator = defineDecorator;
}

/**
 * @class
 * @constructor
 */
function EdmMapping() {
    //
}

/**
 * @static
 * Maps a prototype to an OData entity type
 * @param {string} name
 * @returns {Function}
 */
EdmMapping.entityType = function (name) {
    if (typeof name !== 'string') {
        throw new TypeError('Entity type must be a string');
    }
    return function (target, key, descriptor) {
        if (typeof target === 'function') {
            target.entityTypeDecorator = name;
        }
        else {
            throw new Error('Decorator is not valid on this declaration type.');
        }
        return descriptor;
    }
};

/**
 * @static
 * Maps a function to an OData entity type action
 * @param {string} name
 * @param {*=} returnType
 * @returns {Function}
 */
EdmMapping.action = function (name, returnType) {
    if (typeof name !== 'string') {
        throw new TypeError('Action name must be a string');
    }
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new Error('Decorator is not valid on this declaration type.');
        }
        var action =  new ActionConfiguration(name);
        action.isBound = true;
        if (typeof returnType === 'string') {
            var match = /^Collection\(([a-zA-Z0-9._]+)\)$/ig.exec(returnType);
            if (match) {
                action.returnsCollection(match[1])
            }
            else {
                action.returns(returnType);
            }
        }
        else if (typeof returnType === 'function') {
            if (typeof returnType.entityTypeDecorator === 'string') {
                action.returns(returnType.entityTypeDecorator);
            }
            else {
                action.returns(returnType.name);
            }
        }
        if (typeof target === 'function') {
            //bound to collection
            action.parameter("bindingParameter",EdmType.CollectionOf(target.entityTypeDecorator || target.name));
        }
        else {
            action.parameter("bindingParameter",target.entityTypeDecorator || target.constructor.name);
        }
        descriptor.value.actionDecorator = action;
        return descriptor;
    }
};
/**
 * @static
 * Maps a function to an OData entity type function
 * @param {string} name
 * @param {*=} returnType
 * @returns {Function}
 */
EdmMapping.func = function (name, returnType) {
    if (typeof name !== 'string') {
        throw new TypeError('Function name must be a string');
    }
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new Error('Decorator is not valid on this declaration type.');
        }
        var func =  new FunctionConfiguration(name);
        func.isBound = true;
        if (typeof returnType === 'string') {
            var match = /^Collection\(([a-zA-Z0-9._]+)\)$/ig.exec(returnType);
            if (match) {
                func.returnsCollection(match[1]);
            }
            else {
                func.returns(returnType);
            }
        }
        else if (typeof returnType === 'function') {
            if (typeof returnType.entityTypeDecorator === 'string') {
                func.returns(returnType.entityTypeDecorator);
            }
            else {
                func.returns(returnType.name);
            }
        }
        if (typeof target === 'function') {
            //bound to collection
            func.parameter("bindingParameter",EdmType.CollectionOf(target.entityTypeDecorator || target.name));
        }
        else {
            func.parameter("bindingParameter",target.entityTypeDecorator || target.constructor.name);
        }
        descriptor.value.functionDecorator = func;
        return descriptor;
    }
};


/**
 * @static
 * Defines a data action parameter of an already mapped OData entity type action
 * @param {string} name
 * @param {*} type
 * @param {boolean=} nullable
 * @param {boolean=} fromBody
 * @returns {Function}
 */
EdmMapping.param = function(name, type, nullable, fromBody) {
    if (typeof name !== 'string') {
        throw new TypeError('Parameter name must be a string');
    }
    return function (target, key, descriptor) {
        if (typeof type !== 'string' && typeof type !== 'function') {
            throw new TypeError('Parameter type must be a string or function');
        }
        if (typeof descriptor.value !== 'function') {
            throw new Error('Decorator is not valid on this declaration type.');
        }
        //get parameter  type
        var typeString;
        if (typeof type === 'function') {
            if (typeof type.entityTypeDecorator === 'string') {
                typeString = type.entityTypeDecorator;
            }
            else {
                typeString = type.name;
            }
        }
        else if (typeof type === 'string') {
            typeString = type;
        }
        if (instanceOf(descriptor.value.actionDecorator, ActionConfiguration)) {
            descriptor.value.actionDecorator.parameter(name, typeString, nullable, fromBody);
        }
        else if (instanceOf(descriptor.value.functionDecorator, FunctionConfiguration)) {
            descriptor.value.functionDecorator.parameter(name, typeString, nullable, fromBody);
        }
        else {
            throw new Error('Procedure configuration cannot be empty for this member. Expected EdmMapping.action(name, returnType) or EdmMapping.func(name, returnType) decorator.');
        }
        return descriptor;
    }
};


/**
 * @static
 * Defines the getter of a dynamic navigation property
 * @param {string} name
 * @param {string} type
 * @param {string=} multiplicity
 * @returns {Function}
 */
EdmMapping.navigationProperty = function(name, type, multiplicity) {
    if (typeof name !== 'string') {
        throw new TypeError('Action name must be a string');
    }
    return function (target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new Error('Decorator is not valid on this declaration type.');
        }
        var propMultiplicity = EdmMultiplicity.ZeroOrOne;
        if (typeof multiplicity !== 'undefined' && typeof multiplicity !== 'string') {
            throw new TypeError('Multiplicity must be a string');
        }
        if (typeof multiplicity === 'string') {
            propMultiplicity = EdmMultiplicity.parse(multiplicity) || EdmMultiplicity.Unknown;
        }
        descriptor.value.navigationPropertyDecorator =  {
            "name": name,
            "type": type,
            "multiplicity": propMultiplicity
        };
    }
};

/**
 * @static
 * Maps an object property to an OData entity type property
 * @param {string} name
 * @param {string} type
 * @param {boolean=} nullable
 * @returns {Function}
 */
EdmMapping.property = function(name, type, nullable) {
    if (typeof name !== 'string') {
        throw new TypeError('Action name must be a string');
    }
    return function (target, key, descriptor) {
        descriptor.value.propertyDecorator =  {
            "name": name,
            "type": type,
            "nullable": _.isBoolean(nullable) ? nullable : false
        };
    }
};


/**
 * @static
 * Validates if the given object instance has a mapped OData action with the given name.
 * @param {*} obj
 * @param {string} name
 * @returns Function|*
 */
EdmMapping.hasOwnAction = function(obj, name) {
    if (typeof obj !== 'object' && typeof obj !== 'function') {
        return;
    }
    var re = new RegExp("^" + name + "$", "ig");
    var functionName = _.find(getOwnPropertyNames(obj), function(x) {
        return (typeof obj[x] === 'function') && (instanceOf(obj[x].actionDecorator, ActionConfiguration)) && re.test(obj[x].actionDecorator.name);
    });
    if (functionName) {
        return obj[functionName];
    }
};

/**
 * @static
 * Validates if the given object instance has a dynamic navigation property getter with the specified name.
 * @param {*} obj
 * @param {string} name
 * @returns Function|*
 */
EdmMapping.hasOwnNavigationProperty = function(obj, name) {
    if (typeof obj !== 'object' && typeof obj !== 'function') {
        return;
    }
    var re = new RegExp("^" + name + "$", "ig");
    var functionName = _.find(getOwnPropertyNames(obj), function(x) {
        return (typeof obj[x] === 'function') && (typeof obj[x].navigationPropertyDecorator === 'object')  && re.test(obj[x].navigationPropertyDecorator.name);
    });
    if (functionName) {
        return obj[functionName];
    }
};

/**
 * @static
 * Validates if the given object instance has a mapped OData function with the given name.
 * @param {*} obj
 * @param {string} name
 * @returns Function|*
 */
EdmMapping.hasOwnFunction = function(obj, name) {
    if (typeof obj !== 'object' && typeof obj !== 'function') {
        return;
    }
    var re = new RegExp("^" + name + "$", "ig");
    var functionName = _.find(getOwnPropertyNames(obj), function(x) {
        return (typeof obj[x] === 'function') && (instanceOf(obj[x].functionDecorator, FunctionConfiguration)) && re.test(obj[x].functionDecorator.name);
    });
    if (functionName) {
        return obj[functionName];
    }
};


/**
 * @static
 * @param {*} obj
 * @returns Array.<Function>|*
 */
EdmMapping.getOwnFunctions = function(obj) {
    if (typeof obj !== 'object' && typeof obj !== 'function') {
        return;
    }
    return _.flatMap(_.filter(getOwnPropertyNames(obj), function(x) {
        return (typeof obj[x] === 'function') && (instanceOf(obj[x].functionDecorator, FunctionConfiguration));
    }),  function(x) {
        return obj[x].functionDecorator;
    });
};

/**
 * @static
 * @param {*} obj
 * @returns Array.<Function>|*
 */
EdmMapping.getOwnActions = function(obj) {
    if (typeof obj !== 'object' && typeof obj !== 'function') {
        return;
    }
    return _.flatMap(_.filter(getOwnPropertyNames(obj), function(x) {
        return (typeof obj[x] === 'function') && (instanceOf(obj[x].actionDecorator, ActionConfiguration));
    }),  function(x) {
        return obj[x].actionDecorator;
    });
};


//exports

module.exports.EdmType = EdmType;
module.exports.EdmMultiplicity = EdmMultiplicity;
module.exports.EntitySetKind = EntitySetKind;
module.exports.ProcedureConfiguration = ProcedureConfiguration;
module.exports.ActionConfiguration = ActionConfiguration;
module.exports.FunctionConfiguration = FunctionConfiguration;
module.exports.EntityTypeConfiguration = EntityTypeConfiguration;
module.exports.EntitySetConfiguration = EntitySetConfiguration;
module.exports.SingletonConfiguration = SingletonConfiguration;
module.exports.ODataModelBuilder = ODataModelBuilder;
module.exports.ODataConventionModelBuilder = ODataConventionModelBuilder;
module.exports.EdmMapping = EdmMapping;
module.exports.defineDecorator = defineDecorator;
