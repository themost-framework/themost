import HttpBaseController from '@themost/web/controllers/base';
import {httpController,httpGet, httpAction} from '@themost/web/decorators';

@httpController()
 class CustomerController extends HttpBaseController {
    
    constructor(context) {
        super(context);
    }
    
    @httpGet()
    @httpAction('index')
    async getIndex() {
        let getCustomers = await this.context.model('Person').filter(this.context.request.query);
        return await getCustomers.expand('address').getItems();
    }
}

module.exports = CustomerController;