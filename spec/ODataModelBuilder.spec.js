import {getApplication} from '@themost/test';
import path from 'path';
import {ODataModelBuilder, FileSchemaLoaderStrategy, SchemaLoaderStrategy} from '@themost/data';
import {XDocument} from '@themost/xml';

class OtherSchemaLoader extends FileSchemaLoaderStrategy {
    constructor(configuration) {
        super(configuration);
        // set explicitly model directory
        this.setModelPath(path.resolve(__dirname, './other-models'));
    }
}

describe('ODataModelBuilder', ()=> {
    let app;
    beforeAll(() => {
        app = getApplication();
    });
    it('should get metadata', async ()=> {
        /**
         * @type {IApplication}
         */
        const application = app.get('ExpressDataApplication');
        expect(application).toBeTruthy();
        // noinspection JSValidateTypes
        /**
         * @type {ODataModelBuilder}
         */
        let builder = application.getStrategy(ODataModelBuilder);
        expect(builder).toBeTruthy();
        const document = builder.getEdmDocumentSync();
        expect(document).toBeTruthy();
    })
    it('should treat readonly properties as computed', async ()=> {
        /**
         * @type {ExpressDataApplication}
         */
        const application = app.get('ExpressDataApplication');
        // use extra loader
        const schemaLoader = application.getConfiguration().getStrategy(SchemaLoaderStrategy);
        schemaLoader.loaders.push(new OtherSchemaLoader(application.getConfiguration()));
        // reload builder
        application.useModelBuilder();
        /**
         * @type {ODataModelBuilder}
         */
        let builder = application.getStrategy(ODataModelBuilder);
        const entity = builder.getEntity('TestEnumeration');
        expect(entity).toBeTruthy();
        /**
         * @type XDocument
         */
        const document = builder.getEdmDocumentSync();
        const node = document.documentElement.selectSingleNode('edmx:DataServices/Schema/EntityType[@Name="TestEnumeration"]');
        expect(node).toBeTruthy();
        let nodeProperty = node.selectSingleNode('Property[@Name="additionalType"]');
        expect(nodeProperty).toBeTruthy();
        let nodeAnnotation = nodeProperty.selectSingleNode('Annonation[@Term="Org.OData.Core.V1.Computed"]');
        expect(nodeAnnotation).toBeTruthy();

        nodeProperty = node.selectSingleNode('Property[@Name="createdBy"]');
        expect(nodeProperty).toBeTruthy();
        nodeAnnotation = nodeProperty.selectSingleNode('Annonation[@Term="Org.OData.Core.V1.Computed"]');
        expect(nodeAnnotation).toBeTruthy();

        nodeProperty = node.selectSingleNode('Property[@Name="id"]');
        expect(nodeProperty).toBeTruthy();
        nodeAnnotation = nodeProperty.selectSingleNode('Annonation[@Term="Org.OData.Core.V1.Computed"]');
        expect(nodeAnnotation).toBeFalsy();
        

    });
});
