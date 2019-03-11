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

describe('test issue #7', () => {

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

    it('should get person configuration as object', (done) => {
       context.model('Person').where('email').equal('alexis.rees@example.com').getItem().then( result => {
          assert.isObject(result);
           assert.isNotArray(result.configuration);
          return done();
       }).catch( err => {
           return done(err);
       });
    });

    it('should get person configuration as object', (done) => {
        context.model('Person').where('email').equal('alexis.rees@example.com')
            .select('id', 'name', 'configuration')
            .getItem().then( result => {
            assert.isObject(result);
            assert.isNotArray(result.configuration);
            return done();
        }).catch( err => {
            return done(err);
        });
    });

    it('should update person configuration', (done) => {
        context.model('Person').where('email').equal('alexis.rees@example.com').getItem().then( result => {
            result.configuration = {
              "defaultCurrency": "EUR"
            };
            return context.model('Person').silent().save(result).then(()=> {
                return context.model('Person').where('email').equal('alexis.rees@example.com')
                    .silent()
                    .getItem().then(person => {
                        assert.isOk(person.configuration != null);
                    }).then(() => {
                        return done();
                    });
            });
        }).catch( err => {
            return done(err);
        });
    });

    it('should remove person configuration', (done) => {
        context.model('Person').where('email').equal('alexis.rees@example.com')
            .getItem().then( result => {
            result.configuration = null;
            return context.model('Person').silent().save(result).then(()=> {
                // get person again
                return context.model('Person').where('email').equal('alexis.rees@example.com')
                    .getItem().then(person => {
                        assert.isOk(person.configuration == null);
                    }).then(() => {
                        return done();
                    });

            });
        }).catch( err => {
            return done(err);
        });
    });

});
