import app from '../server/server';
import {assert} from 'chai';
describe('test HasOneAssociation class', () => {

    /**
     * @type HttpContext
     */
    let context;
    before(done => {
        app.execute(ctx => {
            context = ctx;
            return done();
        });
    });

    after(done => {
        if (context == null) {
            return done();
        }
        context.finalize(() => {
            return done();
        });
    });

    it('should get parent associated object', async () => {
        context.user = {
            name: 'amanda.hayward@example.com',
            autthenticationType: 'basic'
        };
        const order = await context.model('Order').asQueryable().select('id').getTypedItem();
        const orderStatus = await order.property('orderStatus').getItem();
        // eslint-disable-next-line no-console
        console.log('INFO', 'orderStatus', orderStatus);
        assert.isObject(orderStatus);
    });

    it('should try get parent associated object', async () => {
        context.user = {
            name: 'amanda.hayward@example.com',
            autthenticationType: 'basic'
        };
        const order = context.model('Order').convert({
            id: 55
        });
        const customer = await order.property('customer').getItem();
        // eslint-disable-next-line no-console
        console.log('INFO', 'customer', customer);
        assert.isUndefined(customer);
    });

    it('should try get parent associated object silently', async () => {
        context.user = {
            name: 'amanda.hayward@example.com',
            autthenticationType: 'basic'
        };
        const order = context.model('Order').convert({
            id: 55
        });
        const customer = await order.property('customer').silent().getItem();
        // eslint-disable-next-line no-console
        console.log('INFO', 'customer', customer);
        assert.isObject(customer);
    });

    it('should get parent associated object of the same model', async () => {
        let otherEvent = await context.model('Event').where('superEvent').notEqual(null).select('id').silent().getTypedItem();
        assert.isObject(otherEvent);
        let superEvent = await otherEvent.property('superEvent').silent().getItem();
        assert.isObject(superEvent);
    });


});
