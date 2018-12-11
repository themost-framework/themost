import {EdmMapping} from '@themost/data/odata';
let Thing = require('./thing-model');
/**
 * @class
 * @extends {Thing}
 */
@EdmMapping.entityType('Account')
class Account extends Thing {
    /**
     * @constructor
     */
    constructor() {
        super();
    }
}
module.exports = Account;