import {EdmType} from "@themost/data";

const EdmMapping = require('@themost/data/odata').EdmMapping;
let Account = require('./account-model');
/**
 * @class
 * @extends {Account}
 */
@EdmMapping.entityType('User')
class User extends Account {
    /**
     * @constructor
     */
    constructor() {
        super();
    }

    /**
     *
     * @param {DataContext} context
     * @returns {Promise<User>}
     */
    @EdmMapping.func('Me','User')
    static async getMe(context) {
        return await context.model('User')
            .where('name').equal(context.user && context.user.name)
            .getItem();
    }

    /**
     *
     * @param {DataContext} context
     * @returns {*}
     */
    @EdmMapping.func('FunctionReturnsString',EdmType.EdmString)
    // eslint-disable-next-line no-unused-vars
    static async postFunctionReturnsString(context) {
        return 'Hello';
    }

    /**
     *
     * @param {DataContext} context
     * @returns {*}
     */
    @EdmMapping.func('FunctionReturnsStringArray', EdmType.CollectionOf(EdmType.EdmString))
    // eslint-disable-next-line no-unused-vars
    static async postFunctionReturnsStringArray(context) {
        return ['Hello', 'Bonjour'];
    }

    @EdmMapping.action('FunctionReturnsEntity','User')
    // eslint-disable-next-line no-unused-vars
    static async postFunctionReturnsEntity(context) {
        return await context.model('User')
            .where('name').equal(context.user && context.user.name)
            .getItem();
    }

    @EdmMapping.action('FunctionReturnsEntityQueryable','User')
    // eslint-disable-next-line no-unused-vars
    static async postFunctionReturnsEntityQueryable(context) {
        return await context.model('User')
            .where('name').equal(context.user && context.user.name).prepare();
    }

    @EdmMapping.action('FunctionReturnsEntityCollection',EdmType.CollectionOf('Group'))
    // eslint-disable-next-line no-unused-vars
    static async postFunctionReturnsEntityCollection(context) {
        return await context.model('Group')
            .getItems();
    }

    @EdmMapping.action('FunctionReturnsEntityCollectionQueryable',EdmType.CollectionOf('Group'))
    // eslint-disable-next-line no-unused-vars
    static async postFunctionReturnsEntityCollectionQueryable(context) {
        return await context.model('Group').asQueryable();
    }



    @EdmMapping.func('InstanceFunc1',EdmType.EdmString)
    async getInstanceFunc1() {
        return {
            message: 'Hello'
        };
    }

    @EdmMapping.action('ActionReturnString',EdmType.EdmString)
    // eslint-disable-next-line no-unused-vars
    static async postActionReturnString(context) {
        return 'Hello';
    }

    @EdmMapping.action('ActionReturnsEntity','User')
    // eslint-disable-next-line no-unused-vars
    static async postActionReturnsEntity(context) {
        return await context.model('User')
            .where('name').equal(context.user && context.user.name)
            .getItem();
    }

    @EdmMapping.action('ActionReturnsEntityQueryable','User')
    // eslint-disable-next-line no-unused-vars
    static async postActionReturnsEntityQueryable(context) {
        return await context.model('User')
            .where('name').equal(context.user && context.user.name).prepare();
    }

    @EdmMapping.action('ActionReturnsEntityCollection',EdmType.CollectionOf('Group'))
    // eslint-disable-next-line no-unused-vars
    static async postActionReturnsEntityCollection(context) {
        return await context.model('Group')
            .getItems();
    }

    @EdmMapping.action('ActionReturnsEntityCollectionQueryable',EdmType.CollectionOf('Group'))
    // eslint-disable-next-line no-unused-vars
    static async postActionReturnsEntityCollectionQueryable(context) {
        return await context.model('Group').asQueryable();
    }

    @EdmMapping.action('ActionReturnStringArray',EdmType.CollectionOf(EdmType.EdmString))
    // eslint-disable-next-line no-unused-vars
    static async postActionReturnStringArray(context) {
        return ['Hello', 'Bonjour'];
    }

    @EdmMapping.action('InstanceActionReturnString',EdmType.EdmString)
    // eslint-disable-next-line no-unused-vars
    async postInstanceActionReturnString(context) {
        return 'Hello';
    }

    @EdmMapping.action('InstanceActionReturnStringArray',EdmType.CollectionOf(EdmType.EdmString))
    // eslint-disable-next-line no-unused-vars
    async postInstanceActionReturnStringArray(context) {
        return ['Hello', 'Bonjour'];
    }

    @EdmMapping.param('group', EdmType.EdmString, false)
    @EdmMapping.func('memberOf','Group')
    async isMemberOf(group) {
        const user = await this.context.model('User')
            .where('name').equal(this.context.user && this.context.user.name)
            .expand('groups')
            .getItem();
        return user.groups.find( x => {
            return x.name === group
        });
    }

    @EdmMapping.param('group', EdmType.EdmString, false)
    @EdmMapping.action('postMemberOf','Group')
    async postMemberOf(group) {
        const user = await this.context.model('User')
            .where('name').equal(this.context.user && this.context.user.name)
            .expand('groups')
            .getItem();
        return user.groups.find( x => {
            return x.name === group
        });
    }

}
module.exports = User;
