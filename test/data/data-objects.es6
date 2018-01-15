import 'source-map-support/register';
import path from 'path';
import {assert} from 'chai';
import {DataConfiguration} from "../../modules/@themost/data/data-configuration";
import {DefaultDataContext} from "../../modules/@themost/data/data-context";
import {DataObject} from "../../modules/@themost/data/data-object";
import PersonModel from '../app/models/person-model';
import {TraceUtils} from "../../modules/@themost/common/utils";
/**
 * @augments DataContext
 * @extends DefaultDataContext
 */
class TestDataContext extends DefaultDataContext {

    /**
     * @param {DataConfiguration=} configuration
     */
    constructor(configuration) {
        super();
        this.getConfiguration = ()=> configuration;
    }
}

describe('data object test', function() {

    /**
     * @type TestDataContext
     */
    let context;

    before(function(done) {
        const config = new DataConfiguration(path.resolve(process.cwd(), "./test/app/config"));
        context = new TestDataContext(config);
        return done();
    });

    after((done)=> {
        if (context) {
            return context.finalize(()=>{
               return done();
            });
        }
        return done();
    });

    it('should get typed data object', (done)=> {
        context.model('Person').where('email').equal('crystal.wright@example.com')
            .silent().getTypedItem().then((person)=> {
            assert.isTrue(person instanceof PersonModel,'Expected PersonModel instance');
            return done();
        }).catch((err)=> {
            return done(err);
        });
    });

    it('should call typed data object method', (done)=> {
        context.model('Person').where('email').equal('crystal.wright@example.com')
            .silent().getTypedItem().then((person)=> {
            return person.getPendingOrders().getItems().then((result)=> {
                TraceUtils.log(JSON.stringify(result,null,4));
                result.forEach((x)=> {
                   assert.equal(x.orderStatus.alternateName,'OrderProcessing','Invalid query.');
                });
                return done();
            });
        }).catch((err)=> {
            return done(err);
        });
    });

    it.only('should save typed data object', (done)=> {

        context.model('Person').where('email').equal('crystal.wright@example.com')
            .silent().getTypedItem().then((person)=> {
            TraceUtils.log(JSON.stringify(person,null,4));
            person.jobTitle = "General Engineer";
            return person.silent().save().then(()=> {
                return done();
            });
        }).catch((err)=> {
            return done(err);
        });
    });

    it('should get data object', (done)=> {
        context.model('User').where('name').equal('crystal.wright@example.com')
            .silent().getTypedItem().then((user)=> {
            assert.isTrue(user instanceof DataObject,'Expected DataObject instance');
            return done();
        }).catch((err)=> {
            return done(err);
        });
    });

});