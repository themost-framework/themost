import 'source-map-support/register';
import path from 'path';
import {assert} from 'chai';
import {DataConfiguration} from "../../modules/@themost/data/data-configuration";
import {DefaultDataContext} from "../../modules/@themost/data/data-context";
import {TraceUtils} from "../../modules/@themost/common/utils";
import format from 'xml-formatter';
import {ODataConventionModelBuilder, ODataModelBuilder} from "../../modules/@themost/data/odata";
import Randoms from './randoms';
class TestDataContext extends DefaultDataContext {

    /**
     * @param {DataConfigurationStrategy=} configuration
     */
    constructor(configuration) {
        super();
        this.getConfiguration = ()=> configuration;
    }
}

describe('most data common tests', function() {
    const config  = new DataConfiguration(path.resolve(process.cwd(), "./test/app/config"));
    it('should use query resolver', (done)=> {
        //initialize
        const context = new TestDataContext(config);
        context.model('User').where('name')
            .equal('victoria.hartley@example.com')
            .expand('groups')
            .getTypedItem().then((user)=> {
                TraceUtils.log(JSON.stringify(user,null,2));
                context.finalize(()=> {
                    return done();
                });
        }).catch((err)=> {
            context.finalize(()=> {
                return done(err);
            });
        });
    });

    it('should infer a many-to-many association', (done)=> {
        //initialize
        const context = new TestDataContext(config);
        const field = context.model('Person').field('children');
        TraceUtils.log("DataField");
        TraceUtils.log(JSON.stringify(field,null,2));
        const mapping = context.model('Person').inferMapping('children');
        TraceUtils.log("DataAssociationMapping");
        TraceUtils.log(JSON.stringify(mapping,null,2));
        assert.equal(mapping.associationType,'junction');
        return done();
    });

    it('should infer a one-to-many association', (done)=> {
        //initialize
        const context = new TestDataContext(config);
        const field = context.model('PaymentMethod').field('orders');
        TraceUtils.log("DataField");
        TraceUtils.log(JSON.stringify(field,null,2));
        const mapping = context.model('PaymentMethod').inferMapping('orders');
        TraceUtils.log("DataAssociationMapping");
        TraceUtils.log(JSON.stringify(mapping,null,2));
        assert.equal(mapping.associationType,'association');
        return done();
    });

    it('should infer a many-to-one association', (done)=> {
        //initialize
        const context = new TestDataContext(config);
        const field = context.model('Order').field('paymentMethod');
        TraceUtils.log("DataField");
        TraceUtils.log(JSON.stringify(field,null,2));
        const mapping = context.model('Order').inferMapping('paymentMethod');
        TraceUtils.log("DataAssociationMapping");
        TraceUtils.log(JSON.stringify(mapping,null,2));
        assert.equal(mapping.associationType,'association');
        return done();
    });

    it('should infer a one-to-one association', (done)=> {
        //initialize
        const context = new TestDataContext(config);
        const field = context.model('Person').field('spouse');
        TraceUtils.log("DataField");
        TraceUtils.log(JSON.stringify(field,null,2));
        const mapping = context.model('Person').inferMapping('spouse');
        TraceUtils.log("DataAssociationMapping");
        TraceUtils.log(JSON.stringify(mapping,null,2));
        assert.equal(mapping.associationType,'association');
        return done();
    });

    it('should infer a many-to-many association #2', (done)=> {
        //initialize
        const context = new TestDataContext(config);
        const field = context.model('Person').field('children');
        TraceUtils.log("DataField");
        TraceUtils.log(JSON.stringify(field,null,2));
        const mapping = context.model('Person').inferMapping('children');
        TraceUtils.log("DataAssociationMapping");
        TraceUtils.log(JSON.stringify(mapping,null,2));
        assert.equal(mapping.associationType,'junction');
        return done();
    });

    it('should use infer a many-to-many mapping', (done)=> {
        //initialize
        const context = new TestDataContext(config);
        const mapping = context.model('Person').inferMapping('children');
        TraceUtils.log(JSON.stringify(mapping,null,2));
        assert.equal(mapping.associationType,'junction');
        return done();
    });

    it.only('should use DataModel.save() and DataModel.remove() methods', (done)=> {
        //initialize
        const context = new TestDataContext(config);
        const newPerson = Randoms.person();
        TraceUtils.log("New Person Data");
        TraceUtils.log(JSON.stringify(newPerson,null,2));
        context.model('Person').silent().save(newPerson).then(()=> {
            const id = newPerson.id;
            assert.isNumber(id,"Object identifier must be a number");
            TraceUtils.log(JSON.stringify(newPerson,null,2));
            return context.model('Person').silent().remove(newPerson).then(()=> {
                //try to find person again
                return context.model('Person').silent().where('id').equal(id).count().then((exists)=> {
                    assert.equal(exists,0,'The object must have been deleted');
                    context.finalize(()=> {
                        return done();
                    });
                });
            });
        }).catch((err)=> {
            context.finalize(()=> {
                return done(err);
            });
        });
    });

    it('should use OData model builder', (done)=> {
        config.useStrategy(ODataModelBuilder, ODataConventionModelBuilder);
        /**
         * @type {ODataConventionModelBuilder|*}
         */
        const builder = config.getStrategy(ODataModelBuilder);
        builder.addEntity("User");
        builder.getEdm().then((edm)=> {
            TraceUtils.log(JSON.stringify(edm, null, 4));
            return done();
        }).catch((err)=> {
            return done(err);
        });
    });

    it('should export metadata', (done)=> {
        config.useStrategy(ODataModelBuilder, ODataConventionModelBuilder);
        /**
         * @type {ODataConventionModelBuilder|*}
         */
        const builder = config.getStrategy(ODataModelBuilder);

        builder.initialize().then(() => {
            return builder.getEdmDocument().then((doc)=> {
                TraceUtils.log(format(doc.outerXML()));
                return done();
            });
        }).catch((err)=> {
            return done(err);
        });
    });

});