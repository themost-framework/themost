'use strict';
import {HttpController} from './../../../modules/@themost/web/http-mvc';
import {httpAction,httpGet} from './../../../modules/@themost/web/decorators';
import 'source-map-support/register';


export default class RootController extends HttpController {

    constructor() {
        super();
    }

    @httpGet()
    index() {
        return this.content('<p>Hello World</p>').toPromise();
    }

    @httpGet()
    person() {
        return this.json({
          givenName:'Peter',
          familyName:'Adams'
        }).toPromise();
    }

}