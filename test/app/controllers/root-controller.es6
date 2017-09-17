
'use strict';
import {HttpController} from '../../../modules/@themost/web/mvc';
import {httpAction,httpGet} from '../../../modules/@themost/web/decorators';


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
        return this.content('Hello World').toObservable();
    }
    /* jshint ignore:start*/
    @httpGet()
    @httpAction('hello')
    /* jshint ignore:end*/
    getHello() {
        return this.json({
            message: 'Hello World'
        }).toObservable();
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
    /* jshint ignore:end */
    getHelloVash() {
        return this.view({ "name": "George"});
    }

}

//noinspection JSUnusedGlobalSymbols
export default RootController;







