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
    static async getFunctionReturnsEntity(context) {
        return await context.model('User')
            .where('name').equal(context.user && context.user.name)
            .getItem();
    }

    @EdmMapping.action('FunctionReturnsEntityQueryable','User')
    // eslint-disable-next-line no-unused-vars
    static async getFunctionReturnsEntityQueryable(context) {
        return await context.model('User')
            .where('name').equal(context.user && context.user.name).prepare();
    }

    @EdmMapping.action('FunctionReturnsEntityCollection',EdmType.CollectionOf('Group'))
    // eslint-disable-next-line no-unused-vars
    static async getFunctionReturnsEntityCollection(context) {
        return await context.model('Group')
            .getItems();
    }

    @EdmMapping.action('FunctionReturnsEntityCollectionQueryable',EdmType.CollectionOf('Group'))
    // eslint-disable-next-line no-unused-vars
    static async getFunctionReturnsEntityCollectionQueryable(context) {
        return await context.model('Group').asQueryable();
    }


    @EdmMapping.func('InstanceFunctionReturnsEntity','User')
    // eslint-disable-next-line no-unused-vars
    async getInstanceFunctionReturnsEntity() {
        return await this.context.model('User')
            .where('name').equal(this.context.user && this.context.user.name)
            .getItem();
    }

    @EdmMapping.func('InstanceFunctionReturnsEntityQueryable','User')
    // eslint-disable-next-line no-unused-vars
    async getInstanceFunctionReturnsEntityQueryable() {
        return await this.context.model('User')
            .where('name').equal(this.context.user && this.context.user.name).prepare();
    }

    @EdmMapping.func('InstanceFunctionReturnsEntityCollection',EdmType.CollectionOf('Group'))
    // eslint-disable-next-line no-unused-vars
    async getInstanceFunctionReturnsEntityCollection() {
        return await this.context.model('Group')
            .getItems();
    }

    @EdmMapping.func('InstanceFunctionReturnsEntityCollectionQueryable',EdmType.CollectionOf('Group'))
    // eslint-disable-next-line no-unused-vars
    async getInstanceFunctionReturnsEntityCollectionQueryable() {
        return await this.context.model('Group').asQueryable();
    }

    @EdmMapping.func('InstanceFunctionReturnStringArray',EdmType.CollectionOf(EdmType.EdmString))
    // eslint-disable-next-line no-unused-vars
    async getInstanceFunctionReturnStringArray(context) {
        return ['Hello', 'Bonjour'];
    }

    @EdmMapping.func('InstanceFunctionReturnString',EdmType.EdmString)
    // eslint-disable-next-line no-unused-vars
    async getInstanceFunctionReturnString(context) {
        return 'Hello';
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


    @EdmMapping.action('InstanceActionReturnsEntity','User')
    // eslint-disable-next-line no-unused-vars
    async postInstanceActionReturnsEntity() {
        return await this.context.model('User')
            .where('name').equal(this.context.user && this.context.user.name)
            .getItem();
    }

    @EdmMapping.action('InstanceActionReturnsEntityQueryable','User')
    // eslint-disable-next-line no-unused-vars
    async postInstanceActionReturnsEntityQueryable() {
        return await this.context.model('User')
            .where('name').equal(this.context.user && this.context.user.name).prepare();
    }

    @EdmMapping.action('InstanceActionReturnsEntityCollection',EdmType.CollectionOf('Group'))
    // eslint-disable-next-line no-unused-vars
    async postInstanceActionReturnsEntityCollection() {
        return await this.context.model('Group')
            .getItems();
    }

    @EdmMapping.action('InstanceActionReturnsEntityCollectionQueryable',EdmType.CollectionOf('Group'))
    // eslint-disable-next-line no-unused-vars
    async postInstanceActionReturnsEntityCollectionQueryable() {
        return await this.context.model('Group').asQueryable();
    }


}
module.exports = User;
