import HttpBaseController from '@themost/web/controllers/base';
import {httpController,httpGet, httpAction, httpParam} from '@themost/web/decorators';

@httpController()
export default class TestController extends HttpBaseController {
    
    constructor(context) {
        super(context);
    }
    
    @httpGet()
    @httpAction('index')
    getIndex() {
        return Promise.resolve(this.view());
    }

    @httpGet()
    @httpParam({ name: "b", type:"NonNegativeNumber" })
    @httpParam({ name: "a", type:"NonNegativeNumber" })
    @httpAction('multiply')
    multiply(a, b) {
        return Promise.resolve({
            result: a * b
        });
    }
    
}