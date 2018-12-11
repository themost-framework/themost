import {EdmMapping} from '@themost/data/odata';
let Account = require('./account-model');
/**
 * @class
 * @extends {Account}
 */
@EdmMapping.entityType('Group')
class Group extends Account {
    /**
     * @constructor
     */
    constructor() {
        super();
    }
}
module.exports = Group;