/* eslint no-console: off*/
import {DataConfigurationStrategy, DataObject, ModelClassLoaderStrategy} from '@themost/data';
import path from 'path';
import {assert} from 'chai';
import {HttpApplication} from '@themost/web';

describe('Extend Data Model Class', () => {
    /**
     *
     * @type {HttpApplication}
     */
    let app = new HttpApplication(path.resolve(process.cwd(), 'server'));
    /**
     * @type HttpContext
     */
    let context;
    before(done => {
        app.execute( newContext => {
            context = newContext;
            return done()
        });
    });

    after((done)=> {
        if (context == null) {
            return done();
        }
        context.finalize(()=> {
            return done();
        });
    });

    it('should load data model class', (done) => {
        /**
         * @type {ModelClassLoaderStrategy}
         */
        const loader = app.getConfiguration().getStrategy(ModelClassLoaderStrategy);
        /**
         * @type {DataConfigurationStrategy}
         */
        const configuration = app.getConfiguration().getStrategy(DataConfigurationStrategy);
        // get model
        const model = configuration.model('Account');
        // get model class
        const AccountModelClass = loader.resolve(model);
        // validate model class
        assert.isFunction(AccountModelClass);
        return done();
    });

    it('should extend data model class', (done) => {
        /**
         * @type {ModelClassLoaderStrategy}
         */
        const loader = app.getConfiguration().getStrategy(ModelClassLoaderStrategy);
        /**
         * @type {DataConfigurationStrategy}
         */
        const configuration = app.getConfiguration().getStrategy(DataConfigurationStrategy);
        // get model
        const model = configuration.model('User');
        // get model class
        const UserModelClass = loader.resolve(model);
        // validate model class
        assert.isFunction(UserModelClass);
        Object.assign(UserModelClass.prototype, {
           sayHello() {
               return 'Hello World!';
           }
        });
        assert.isFunction(UserModelClass.prototype.sayHello);
        // create instance
        const obj = new UserModelClass();
        assert.equal(obj.sayHello(), 'Hello World!');
        return done();
    });

});
