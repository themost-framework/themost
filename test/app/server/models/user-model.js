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
        return await context.model('User').where('name').equal(context.user && context.user.name).getItem();
    }

}
module.exports = User;
