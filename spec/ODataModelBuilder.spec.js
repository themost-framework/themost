import {getApplication} from '@themost/test';
import {ODataModelBuilder} from '@themost/data';
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
});
