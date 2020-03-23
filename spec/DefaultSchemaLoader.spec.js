import {getApplication} from '@themost/test';
import {SchemaLoaderStrategy,
    DefaultSchemaLoaderStrategy,
    ODataModelBuilder,
    ODataConventionModelBuilder} from '@themost/data';
import {ExpressDataApplication} from '@themost/express';
import path from 'path';
import {TestSchemaLoader} from './TestSchemaLoader';

describe('DefaultSchemaLoaderStrategy', ()=> {
    let app;
    beforeAll(() => {
        app = getApplication();
    });
    it('should get schema', async ()=> {
        /**
         * @type {IApplication}
         */
        const application = app.get('ExpressDataApplication');
        expect(application).toBeTruthy();
        // noinspection JSValidateTypes
        /**
         * @type {SchemaLoaderStrategy}
         */
        let schemaLoader = application.getConfiguration().getStrategy(SchemaLoaderStrategy);
        expect(schemaLoader).toBeTruthy();
        const UserModel = schemaLoader.getModelDefinition('User');
        expect(UserModel).toBeTruthy();
    });

    it('should not get schema', async ()=> {
        /**
         * @type {IApplication}
         */
        const application = app.get('ExpressDataApplication');
        expect(application).toBeTruthy();
        // noinspection JSValidateTypes
        /**
         * @type {SchemaLoaderStrategy}
         */
        let schemaLoader = application.getConfiguration().getStrategy(SchemaLoaderStrategy);
        expect(schemaLoader).toBeTruthy();
        const AnotherModel = schemaLoader.getModelDefinition('AnotherModel');
        expect(AnotherModel).toBeFalsy();
    });

    it('should add schema loader', async ()=> {

        /**
         * @type {ExpressDataApplication}
         */
        const application = app.get(ExpressDataApplication.name);
        expect(application).toBeTruthy();
        // add load type
        let configuration = application.getConfiguration();
        // configure loaders
        configuration.setSourceAt('settings/schema/loaders', [
            {
                loaderType: path.resolve(__dirname, './TestSchemaLoader').concat('#TestSchemaLoader')
            }
        ]);
        // reload SchemaLoaderStrategy strategy
        configuration.useStrategy(SchemaLoaderStrategy, DefaultSchemaLoaderStrategy);
        /**
         * get schema loader
         * @type {DefaultSchemaLoaderStrategy}
         */
        const schemaLoader = configuration.getStrategy(SchemaLoaderStrategy);
        // noinspection JSCheckFunctionSignatures
        expect(schemaLoader.loaders).toBeInstanceOf(Array);
        expect(schemaLoader.loaders.length).toBeGreaterThan(0);
        // get first loader
        const loader = schemaLoader.loaders[0];
        expect(loader).toBeInstanceOf(TestSchemaLoader);
        // restore configuration
        configuration.setSourceAt('settings/schema/loaders', []);
        // reset schema loader
        configuration.useStrategy(SchemaLoaderStrategy, DefaultSchemaLoaderStrategy);
    });

    it('should get model definition from loader', async ()=> {
        /**
         * @type {ExpressDataApplication}
         */
        const application = app.get(ExpressDataApplication.name);
        expect(application).toBeTruthy();
        // add load type
        let configuration = application.getConfiguration();

        /**
         * get schema loader
         * @type {DefaultSchemaLoaderStrategy}
         */
        let schemaLoader = configuration.getStrategy(SchemaLoaderStrategy);
        let TestModel = schemaLoader.getModelDefinition('TestModel');
        expect(TestModel).toBeFalsy();
        // configure loaders
        configuration.setSourceAt('settings/schema/loaders', [
            {
                loaderType: path.resolve(__dirname, './TestSchemaLoader').concat('#TestSchemaLoader')
            }
        ]);
        // reload SchemaLoaderStrategy strategy
        configuration.useStrategy(SchemaLoaderStrategy, DefaultSchemaLoaderStrategy);
        // reload ODataModelBuilder strategy
        configuration.useStrategy(ODataModelBuilder, ODataConventionModelBuilder);

        // get schema loader
        schemaLoader = configuration.getStrategy(SchemaLoaderStrategy);
        // noinspection JSCheckFunctionSignatures
        TestModel = schemaLoader.getModelDefinition('TestModel');
        expect(TestModel).toBeTruthy();

        /**
         * @type {ODataConventionModelBuilder}
         */
        const builder = configuration.getStrategy(ODataModelBuilder);
        builder.initializeSync();
        expect(builder.getEntitySet('TestModels')).toBeTruthy();
        // restore configuration
        configuration.setSourceAt('settings/schema/loaders', []);
        // reset schema loader
        configuration.useStrategy(SchemaLoaderStrategy, DefaultSchemaLoaderStrategy);
    });

});
