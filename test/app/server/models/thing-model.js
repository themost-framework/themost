import {EdmMapping} from '@themost/data/odata';
import {DataObject} from '@themost/data/data-object';

/**
 * @class
 * @extends {DataObject}
 */
@EdmMapping.entityType('Thing')
class Thing extends DataObject {
    /**
     * @constructor
     */
    constructor() {
        super();
    }
}
module.exports = Thing;