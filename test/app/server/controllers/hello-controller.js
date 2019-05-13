import HttpBaseController from '@themost/web/controllers/base';
import {httpController,httpGet, httpAction} from '@themost/web/decorators';

@httpController()
 class HelloController extends HttpBaseController {
    
    constructor(context) {
        super(context);
    }
    
    @httpGet()
    @httpAction('index')
    getIndex() {
        return this.json({
            "code": "E401",
            "message": "You are not authorized to view data."
        }).status(401);
    }

}

module.exports = HelloController;
