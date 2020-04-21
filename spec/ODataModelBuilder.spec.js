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
    it('should assign Computed annotation', async ()=> {
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
        let nodeAnnotation = nodeProperty.selectSingleNode('Annotation[@Term="Org.OData.Core.V1.Computed"]');
        expect(nodeAnnotation).toBeTruthy();

        nodeProperty = node.selectSingleNode('NavigationProperty[@Name="createdBy"]');
        expect(nodeProperty).toBeTruthy();
        nodeAnnotation = nodeProperty.selectSingleNode('Annotation[@Term="Org.OData.Core.V1.Computed"]');
        expect(nodeAnnotation).toBeTruthy();

        nodeProperty = node.selectSingleNode('Property[@Name="id"]');
        expect(nodeProperty).toBeTruthy();
        nodeAnnotation = nodeProperty.selectSingleNode('Annotation[@Term="Org.OData.Core.V1.Computed"]');
        expect(nodeAnnotation).toBeFalsy();
    });
    it('should assign Immutable annotation to non-editable', async ()=> {
        /**
         * @type {ExpressDataApplication}
         */
        const application = app.get('ExpressDataApplication');
        // use extra loader
        const schemaLoader = application.getConfiguration().getStrategy(SchemaLoaderStrategy);
        const findLoader = schemaLoader.loaders.find( loader => {
            return loader instanceof OtherSchemaLoader;
        });
        if (findLoader == null) {
            schemaLoader.loaders.push(new OtherSchemaLoader(application.getConfiguration()));
            // reload builder
            application.useModelBuilder();
        }        
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
        let nodeProperty = node.selectSingleNode('Property[@Name="identifier"]');
        expect(nodeProperty).toBeTruthy();
        let nodeAnnotation = nodeProperty.selectSingleNode('Annotation[@Term="Org.OData.Core.V1.Immutable"]');
        expect(nodeAnnotation).toBeTruthy();
    });

    it('should assign Implements annotation to entity types', async ()=> {
        /**
         * @type {ExpressDataApplication}
         */
        const application = app.get('ExpressDataApplication');
        // use extra loader
        const schemaLoader = application.getConfiguration().getStrategy(SchemaLoaderStrategy);
        const findLoader = schemaLoader.loaders.find( loader => {
            return loader instanceof OtherSchemaLoader;
        });
        if (findLoader == null) {
            schemaLoader.loaders.push(new OtherSchemaLoader(application.getConfiguration()));
            // reload builder
            application.useModelBuilder();
        }        
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
        let node = document.documentElement.selectSingleNode('edmx:DataServices/Schema/EntityType[@Name="TestEnumeration"]');
        expect(node).toBeTruthy();
        let nodeAnnotation = node.selectSingleNode('Annotation[@Term="DataModel.OData.Core.V1.Implements"]');
        expect(nodeAnnotation).toBeTruthy();
        expect(nodeAnnotation.getAttribute('String')).toBe('Enumeration');
        
        node = document.documentElement.selectSingleNode('edmx:DataServices/Schema/EntityType[@Name="User"]');
        expect(node).toBeTruthy();
        nodeAnnotation = node.selectSingleNode('Annotation[@Term="DataModel.OData.Core.V1.Implements"]');
        expect(nodeAnnotation).toBeFalsy();

    });
});
