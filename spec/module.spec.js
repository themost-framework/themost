import {DataModel} from '@themost/data';
describe('DataModel', () => {
    it('should create instance', async () => {
       const model = new DataModel();
       expect(model).toBeTruthy();
    });
});
