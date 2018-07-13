
import HttpBaseController from '@themost/web/controllers/base';
import {httpController,httpGet,httpAction} from '@themost/web/decorators';
import path from 'path';

@httpController()
export default class RootController extends HttpBaseController {
    
    constructor() {
        super();
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

    @httpGet()
    @httpAction('ngServerRepeat')
    ngRepeat() {
        return {
            friends:[
                {name:'John', age:25},
                {name:'Mary', age:40},
                {name:'Peter', age:85}
            ]
        };
    }

    @httpGet()
    @httpAction('ngServerIf')
    ngIf() {
        return {
            friends:[
                {name:'John', age:25},
                {name:'Mary', age:40},
                {name:'Peter', age:85}
            ]
        };
    }

    @httpGet()
    @httpAction('ngServerClass')
    ngClass() {
        return {
            friends:[
                {name:'John', age:25},
                {name:'Mary', age:40},
                {name:'Peter', age:85}
            ]
        };
    }

    @httpGet()
    @httpAction('ngServerSwitch')
    ngSwitch() {
        return {
            friends:[
                {name:'John', age:25},
                {name:'Mary', age:40},
                {name:'Peter', age:85}
            ]
        };
    }

    @httpGet()
    @httpAction('ngServerInit')
    ngInit() {
        return {
        };
    }
    
    
}