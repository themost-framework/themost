
'use strict';
import {HttpController} from '@themost/web/http-mvc';
import Q from 'q';
import {httpAction,httpGet,httpController} from '@themost/web/decorators';

@httpController()
export default class RootController extends HttpController {

    constructor() {
        super();
    }
    @httpGet()
    index() {
        return this.content('Hello World').toPromise();
    }
    @httpGet()
    @httpAction('hello')
    getHello() {
        return this.json({
            message: 'Hello World'
        }).toPromise();
    }
}









