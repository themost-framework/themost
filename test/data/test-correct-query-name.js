/* eslint no-console: off*/
const path = require('path');
const assert = require('chai').assert;
const DataConfiguration = require('../../modules/@themost/data').DataConfiguration;
const DefaultDataContext = require('../../modules/@themost/data').DefaultDataContext;

class TestDataContext extends DefaultDataContext {
    constructor(configuration) {
        super();
        /**
         * @returns {ConfigurationBase}
         */
        this.getConfiguration = function() {
            return configuration;
        }
    }

}

describe('test issue #2', () => {

    /**
     *
     * @type {DataConfiguration}
     */
    let configuration = new DataConfiguration(path.resolve(process.cwd(), 'test/app/server/config'));
    // change default adapter to testing
    configuration.getDataConfiguration().adapters.find( x=> {
       return x.default;
    }).default = false;
    configuration.getDataConfiguration().adapters.find( x=> {
        return x.name === 'testing';
    }).default = true;
    /**
     * @type TestDataContext
     */
    let context;
    before((done) => {
       context = new TestDataContext(configuration);
       return done();
    });

    after((done)=> {
        if (context == null) {
            return done();
        }
       context.finalize(()=> {
          return done();
       });
    });

    it('should select a field with alias name', (done) => {
        let getOrders = context.model('Order').select('id', 'orderDate',
            'orderNumber',
            'orderedItem/name as name')
            .expand('orderedItem');
        console.log('INFO', JSON.stringify(getOrders.query, null, 4));
       getOrders.silent()
           .getItems().then( items => {
               console.log('INFO', `(Total) = ${items.length}`);
               assert.ok(true);
               return done();
       }).catch( err => {
          return done(err);
       });
    });

});
