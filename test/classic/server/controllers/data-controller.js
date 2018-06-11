import HttpDataModelController from '@themost/web/controllers/model';
import {httpController,httpGet, httpAction} from '@themost/web/decorators';

@httpController()
export default class DataController extends HttpDataModelController {
    
    constructor() {
        super();
    }
}