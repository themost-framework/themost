import path from 'path';
import { assert } from 'chai';
import { EntitySetSchemaLoaderStrategy, ODataModelBuilder, ODataConventionModelBuilder } from '../../modules/@themost/data';
import { ConfigurationBase } from '../../modules/@themost/common';
import { DataConfiguration, SchemaLoaderStrategy, DefaultSchemaLoaderStrategy, DataConfigurationStrategy } from '../../modules/@themost/data';

const USER_MODEL_DEFINITION = {
            "name": "User",
            "title": "Users",
            "version": "1.0",
            "fields": [
                {
                    "name": "id",
                    "type": "Counter",
                    "nullable": false,
                    "primary": true
                },
                {
                    "name": "name",
                    "type": "Text",
                    "nullable": false
                },
                {
                    "name": "description",
                    "type": "Text",
                    "nullable": false
                }
            ]
        }

describe('EntitySetSchemaLoaderStrategy', () => {
    /**
     * @type {DataConfiguration}
     */
    let configuration;
    before((done) => {
        configuration = new DataConfiguration(path.resolve(__dirname));
        return done();
    });
    it('should create instance', () => {
        const schemaLoader = new EntitySetSchemaLoaderStrategy(configuration);
        assert.isDefined(schemaLoader);
    });
    it('should have builder property', () => {
        const schemaLoader = new EntitySetSchemaLoaderStrategy(configuration);
        assert.isTrue(schemaLoader.hasOwnProperty('builder'));
    });
    it('should have builder', () => {
        const schemaLoader = new EntitySetSchemaLoaderStrategy(configuration);
        configuration.useStrategy(ODataModelBuilder, ODataConventionModelBuilder);
        assert.isTrue(schemaLoader.hasOwnProperty('builder'));
        assert.isDefined(schemaLoader.builder);
    });
    it('should set model definition', () => {
        const schemaLoader = new EntitySetSchemaLoaderStrategy(configuration);
        schemaLoader.setModelDefinition(USER_MODEL_DEFINITION);
        const model = schemaLoader.getModelDefinition('User');
        assert.isDefined(model);
        assert.equal(model.name, 'User');
    });
    it('should use schema loader as strategy', () => {
        configuration.useStrategy(SchemaLoaderStrategy, EntitySetSchemaLoaderStrategy);
        const schemaLoader = configuration.getStrategy(SchemaLoaderStrategy);
        assert.isDefined(schemaLoader);
        assert.isTrue(schemaLoader instanceof EntitySetSchemaLoaderStrategy);
        // restore schema loader to default for further testing
        configuration.useStrategy(SchemaLoaderStrategy, DefaultSchemaLoaderStrategy);
    });
    it('should get model', () => {
        configuration.useStrategy(SchemaLoaderStrategy, EntitySetSchemaLoaderStrategy);
        // get strategy
        const schemaLoader = configuration.getStrategy(SchemaLoaderStrategy);
        // validate strategy
        assert.isDefined(schemaLoader);
        // set model
        schemaLoader.setModelDefinition(USER_MODEL_DEFINITION);
        // get model
        let model = schemaLoader.getModelDefinition('User');
        // validate model
        assert.isDefined(model);
        assert.equal(model.name, 'User');
        // get data model
        model = configuration.getStrategy(DataConfigurationStrategy).model('User');
        // validate model again
        assert.isDefined(model);
        assert.equal(model.name, 'User');
        // restore schema loader to default for further testing
        configuration.useStrategy(SchemaLoaderStrategy, DefaultSchemaLoaderStrategy);
    });

    it('should get model by entity set', () => {
        configuration.useStrategy(SchemaLoaderStrategy, EntitySetSchemaLoaderStrategy);
        // use model builder
        configuration.useStrategy(ODataModelBuilder, ODataConventionModelBuilder);
        // get strategy
        const schemaLoader = configuration.getStrategy(SchemaLoaderStrategy);
        // validate strategy
        assert.isDefined(schemaLoader);
        // set model
        schemaLoader.setModelDefinition(USER_MODEL_DEFINITION);
        // get model
        let model = schemaLoader.getModelDefinition('User');
        // validate model
        assert.isDefined(model);
        assert.equal(model.name, 'User');
        /**
         * @type {ODataConventionModelBuilder}
         */
        const builder  = configuration.getStrategy(ODataModelBuilder);
        builder.clean();
        // add entity set
        builder.addEntitySet('User', 'Users');
        // get data model
        model = configuration.getStrategy(DataConfigurationStrategy).model('Users');
        // validate model again
        assert.isDefined(model);
        assert.equal(model.name, 'User');
        // restore schema loader to default for further testing
        configuration.useStrategy(SchemaLoaderStrategy, DefaultSchemaLoaderStrategy);
    });

});