import {DataObject} from '../../../modules/@themost/data/data-object';
import {EdmMapping,EdmType} from '../../../modules/@themost/data/odata';
/**
 * @class
 * @extends DataObject
 */
@EdmMapping.entityType('Person')
export default class Person extends DataObject {
    /**
     * @constructor
     * @param {string=} type
     * @param {*=} instance
     */
    constructor(type, instance) {
        super(type, instance);
    }

    /**
     * @returns DataQueryable
     */
    @EdmMapping.func('pendingOrders',EdmType.CollectionOf('Order'))
    getPendingOrders() {
        return this.context.model('Order')
            .where('customer').equal(this.getId())
            .and('orderStatus/alternateName').equal('OrderProcessing').prepare();
    }

}