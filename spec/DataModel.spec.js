import {getApplication} from '@themost/test';
import {DataConfigurationStrategy} from '@themost/data';
describe('issue-57-nested-attributes', ()=> {
    let app;
    beforeAll(() => {
        app = getApplication();
    });
    it('should validate nested attribute multiplicity', async ()=> {
        /**
         * @type {ExpressDataApplication}
         */
        const application = app.get('ExpressDataApplication');
        expect(application).toBeTruthy();
        /**
         * @type {DataConfigurationStrategy}
         */
        const configuration = application.getConfiguration().getStrategy(DataConfigurationStrategy);
        configuration.setModelDefinition({
            name: 'ParentModelProperty',
            fields: [
                {
                    name: 'id',
                    type: 'Counter',
                    primary: true
                },
                {
                    name: 'parent',
                    type: 'ParentModel',
                    nullable: false
                },
                {
                    name: 'name',
                    type: 'Text',
                    nullable: false
                },
                {
                    name: 'value',
                    type: 'Text'
                }
            ],
            "constraints": [
                {
                    type: 'unique',
                    fields: [
                        "parent",
                        "name"
                    ]
                }
            ]
        });
        configuration.setModelDefinition({
            name: 'ParentModel',
            fields: [
                {
                    name: 'id',
                    type: 'Counter',
                    primary: true
                },
                {
                    name: 'description',
                    type: 'Text'
                },
                {
                    name: 'property',
                    type: 'ParentModelProperty',
                    nested: true,
                    mapping: {
                        associationType: 'association',
                        parentModel: 'ParentModel',
                        childModel: 'ParentModelProperty',
                        parentField: 'id',
                        childField: 'parent'
                    }
                },
                {
                    name: 'properties',
                    type: 'ParentModelProperty',
                    nested: true,
                    mapping: {
                        associationType: 'association',
                        parentModel: 'ParentModelProperty',
                        childModel: 'ParentModel',
                        parentField: 'parent',
                        childField: 'id'
                    }
                }
            ]

        });
        let context = application.createContext();
        const attributes = context.model('ParentModel').attributes;
        expect(attributes).toBeInstanceOf(Array);
        // get attribute
        let findAttribute = attributes.find( x=> {
            return x.name === 'properties'
        });
        expect(findAttribute.many).toBeTruthy();
        expect(findAttribute.multiplicity).toBe('Many');

        findAttribute = attributes.find( x=> {
            return x.name === 'property'
        });
    });
});
