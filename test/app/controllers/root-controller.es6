/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import Q from 'q';
import {HttpController} from '../../../modules/@themost/web/mvc';
import {httpAction, httpGet, httpParam} from '../../../modules/@themost/web/decorators';
import {HttpConsumer} from "../../../modules/@themost/web/consumers";
import {HttpError} from "../../../modules/@themost/common/errors";

function httpNotImplemented() {
    return function (target, key, descriptor) {
        descriptor.value.notImplemented = new HttpConsumer(()=> {
            return Q.reject(new HttpError(501));
        });
        return descriptor;
    }
}

/**
 * @class
 */
class RootController extends HttpController {

    constructor() {
        super();
    }
    /*jshint ignore:start*/
    @httpGet()
    /*jshint ignore:end*/
    index() {
        return this.content('Hello World').toPromise();
    }
    /* jshint ignore:start*/
    @httpGet()
    @httpAction('hello')
    @httpParam({"name": "name", "required":true, "pattern":/^\w+$/})
    @httpParam({"name": "message", "required":false, "pattern":/^\w+$/})
    /* jshint ignore:end*/
    getHello(name, message) {
        return this.json({
            message: `Hello ${name}`
        }).toPromise();
    }
    /* jshint ignore:start*/
    @httpGet()
    @httpAction('helloMarkdown')
    /* jshint ignore:end */
    getHelloMarkdown() {
        return this.view();
    }
    /* jshint ignore:start*/
    @httpGet()
    @httpAction('helloJade')
    /* jshint ignore:end */
    getHelloJade() {
        return this.view();
    }
    /* jshint ignore:start*/
    @httpGet()
    @httpAction('helloAngular')
    /* jshint ignore:end */
    getHelloAngular() {
        return this.view();
    }
    /* decorators */
    /* jshint ignore:start*/
    @httpGet()
    @httpAction('helloVash')
    @httpNotImplemented()
    /* jshint ignore:end */
    getHelloVash() {
        return this.view({ "name": "George"});
    }

}

//noinspection JSUnusedGlobalSymbols
export default RootController;







