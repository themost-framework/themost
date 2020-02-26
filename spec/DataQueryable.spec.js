import {getApplication} from '@themost/test';
import {TraceUtils, TextUtils, RandomUtils} from '@themost/common';
const perf = require('execution-time')(TraceUtils.log);
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
    it('should use DataQueryable.toMD5() with TextUtils.toMD5()', async ()=> {
        const query = context.model('User').where('name').equal('alexis.rees@example.com').expand('groups');
        perf.start();
        query.toMD5();
        perf.stop();
    });


});