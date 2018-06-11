
import HttpBaseController from '@themost/web/controllers/base';
import {httpController,httpGet,httpAction} from '@themost/web/decorators';
import path from 'path';

@httpController()
export default class RootController extends HttpBaseController {
    
    constructor(context) {
        super(context);
    }
    
    @httpGet()
    @httpAction('index')
    getIndex() {
        return Promise.resolve(this.view());
    }

    /**
     * GET /hello.html
     * @returns {Promise<{message: string}>}
     */
    @httpGet()
    @httpAction('hello')
    hello() {
        return Promise.resolve({
            message: "Hello World!"
        });
    }
    
    
}