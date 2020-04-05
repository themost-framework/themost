import {getApplication} from '@themost/test';
import {TraceUtils, TextUtils, RandomUtils} from '@themost/common';
import { DataModel, NamedDataContext } from '@themost/data';
import User from '@themost/test/dist/server/models/user-model';
describe('DataQueryable', ()=> {
    let context;
    beforeAll(() => {
        let app = getApplication();
        context = app.get('ExpressDataApplication').createContext();
    });
    afterAll(() => {
        if (context) {
            context.finalize();
        }
    });
    it('should use DataContext.model(string)', async ()=> {
        let model = context.model('User');
        expect(model).toBeTruthy();
        expect(model).toBeInstanceOf(DataModel);
        expect(model.name).toBe('User');
        model = context.model('AnotherModel');
        expect(model).toBeFalsy();
    });
    it('should use DataContext.model(Function)', async ()=> {
        let model = context.model(User);
        expect(model).toBeTruthy();
        expect(model).toBeInstanceOf(DataModel);
        expect(model.name).toBe('User');
        // create a local reference of a model class
        model = context.model(function Account() {

        });
        expect(model).toBeTruthy();
        expect(model).toBeInstanceOf(DataModel);
        expect(model.name).toBe('Account');
    });

    it('should use NamedDataContext.model(string)', async ()=> {
        let testContext = new NamedDataContext('test');
        testContext.getConfiguration = function() {
            return context.getConfiguration();
        }
        let model = testContext.model('User');
        expect(model).toBeTruthy();
        expect(model).toBeInstanceOf(DataModel);
        testContext.finalize();
    });

    it('should use NamedDataContext.model(Function)', async ()=> {
        let testContext = new NamedDataContext('test');
        testContext.getConfiguration = function() {
            return context.getConfiguration();
        }
        let model = testContext.model(User);
        expect(model).toBeTruthy();
        expect(model).toBeInstanceOf(DataModel);
        model = testContext.model(function AnotherModel() {

        });
        expect(model).toBeFalsy();
        testContext.finalize();
    });
    


});