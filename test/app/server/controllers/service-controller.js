
import HttpServiceController from '@themost/web/controllers/service';
import {httpController} from '@themost/web/decorators';

@httpController()
class ServiceController extends HttpServiceController {
    constructor(context) {
        super(context);
    }
}

module.exports = ServiceController;