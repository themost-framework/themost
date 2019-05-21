import app from '../server';
import {assert} from 'chai';
describe('test DataObject.property().value()', () => {

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

    it('should get object property', async () => {
        context.user = {
            name: 'amanda.hayward@example.com',
            autthenticationType: 'basic'
        };
        const person = await context.model('Person').where('user/name').equal(context.user.name).getTypedItem();
        assert.isObject(person);
        const givenName = await person.property('givenName').value();
        assert.isString(givenName);
    });

});
