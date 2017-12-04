/**
 * @ignore
 */
var model = require('./data-model'),
    perms = require('./data-permission'),
    FunctionContext = require('./functions').FunctionContext,
    DataQueryable = require('./data-queryable').DataQueryable,
    DefaultDataContext = require('./data-context').DefaultDataContext,
    NamedDataContext = require('./data-context').NamedDataContext,
    DataModel = model.DataModel,
    DataObject = require('./data-object').DataObject,
    DataFilterResolver = require('./data-filter-resolver').DataFilterResolver;

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



