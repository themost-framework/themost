import HttpServiceController from '../../../modules/@themost/web/controllers/service';
import {httpController} from '../../../modules/@themost/web/decorators';

@httpController()
export default class ServiceController extends HttpServiceController {
    constructor(context) {
        super(context);
    }
}