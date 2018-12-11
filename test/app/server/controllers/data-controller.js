import HttpDataModelController from '@themost/web/controllers/model';
import {httpController} from '@themost/web/decorators';

@httpController()
class DataController extends HttpDataModelController {
    
    constructor(context) {
        super(context);
    }

}

module.exports = DataController;