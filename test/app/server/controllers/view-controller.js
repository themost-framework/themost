import HttpBaseController from '@themost/web/controllers/base';
import {httpController,httpGet, httpAction} from '@themost/web/decorators';

@httpController()
 class ViewController extends HttpBaseController {
    
    constructor(context) {
        super(context);
    }
    
    @httpGet()
    @httpAction('index')
    getTest() {
        return this.json();
    }
}

module.exports = ViewController;