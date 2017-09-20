'use strict';
import 'source-map-support/register';
import path from 'path';
import {ConfigurationBase} from "../../modules/@themost/common/config";
import {DataConfigurationStrategy} from "../../modules/@themost/data/config";
import {DefaultDataContext} from "../../modules/@themost/data/context";
import {TraceUtils} from "../../modules/@themost/common/utils";
import {XDocument} from 'most-xml';
import _ from 'lodash';
import format from 'xml-formatter';
import {ODataConventionModelBuilder, ODataModelBuilder} from "../../modules/@themost/data/odata";

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
    const config  = new ConfigurationBase(path.resolve(process.cwd(), "./test/app/config"));
    config.useStrategy(DataConfigurationStrategy, DataConfigurationStrategy);
    it('should use query resolver', (done)=> {
        //initialize
        const context = new TestDataContext(config.getStrategy(DataConfigurationStrategy));
        context.model('User').where('name')
            .equal('victoria.hartley@example.com')
            .expand('groups')
            .getTypedItem().then((user)=> {
                TraceUtils.log(user);
                context.finalize(()=> {
                    return done();
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
            console.log(JSON.stringify(edm, null, 4));
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
                console.log(format(doc.outerXML()));
                return done();
            });
        }).catch((err)=> {
            return done(err);
        });


    });

});