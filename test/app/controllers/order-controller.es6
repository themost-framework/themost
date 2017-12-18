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
import {httpAction, httpGet, httpController} from '../../../modules/@themost/web/decorators';

@httpController()
export default class OrderController extends HttpController {

    constructor(context) {
        super(context);
    }

    @httpGet()
    @httpAction('index')
    getItems() {
        return this.context.model('Order').take(25).getItems();
    }

}