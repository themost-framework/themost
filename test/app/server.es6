/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */


'use strict';
import {HttpApplication} from './../../modules/@themost/web/app';
import {AngularServerModule} from "../../modules/@themost/web/angular/module";
import 'source-map-support/register';
import {HttpConsumer} from "../../modules/@themost/web/consumers";
import {HttpJsonResult} from "../../modules/@themost/web/mvc";
import Q from 'q';
import {HttpNextResult} from "../../modules/@themost/web/results";
//initialize application
let app = new HttpApplication('./test/app');

app.useService(AngularServerModule)
    .getService(AngularServerModule)
    .useBootstrapModule(app.mapExecutionPath('./modules/server-app'));

app.any((context)=> {
    return Q(new HttpNextResult());
});

app.useAuthentication()
    .useJsonContent()
    .usePostContent()
    .useMultipartContent()
    .useFormatterStrategy()
    .useStaticContent("./test/app/app")
    .useViewContent();
app.start();
