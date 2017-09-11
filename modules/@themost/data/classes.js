/**
 * @ignore
 */
var model = require('./model'),
    perms = require('./permission'),
    FunctionContext = require('./functions').FunctionContext,
    DataQueryable = require('./queryable').DataQueryable,
    DefaultDataContext = require('./context').DefaultDataContext,
    NamedDataContext = require('./context').NamedDataContext,
    DataModel = model.DataModel,
    DataObject = require('./data-object').DataObject,
    DataFilterResolver = require('./filter-resolver').DataFilterResolver;

    /**
     * @exports most-data/data-classes
     */
    var dataClasses = { };

    dataClasses.DataObject = DataObject;
    dataClasses.DefaultDataContext = DefaultDataContext;
    dataClasses.NamedDataContext = NamedDataContext;
    dataClasses.FunctionContext = FunctionContext;
    dataClasses.DataQueryable = DataQueryable;
    dataClasses.DataModel = DataModel;
    dataClasses.DataFilterResolver = DataFilterResolver;
    dataClasses.DataPermissionEventListener = perms.DataPermissionEventListener;
    dataClasses.DataPermissionEventArgs = perms.DataPermissionEventArgs;
    dataClasses.PermissionMask = perms.PermissionMask;

    module.exports = dataClasses;



