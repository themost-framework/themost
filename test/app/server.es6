/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import 'source-map-support/register';
import {HttpApplication} from '../../modules/@themost/web/app';
import {AngularServerModule} from "../../modules/@themost/web/angular/module";
import {ODataConventionModelBuilder, ODataModelBuilder} from "../../modules/@themost/data/odata";
//initialize application
let app = new HttpApplication('./test/app');
//use static content
app.useStaticContent('./test/app/app');

app.useService(AngularServerModule)
    .getService(AngularServerModule)
    .useBootstrapModule(app.mapExecutionPath('./modules/server-app'));

app.getConfiguration().useStrategy(ODataModelBuilder,ODataConventionModelBuilder);

const builder = app.getConfiguration().getStrategy(ODataModelBuilder);
builder.hasContextLink(function(context) {
    const req = context.request;
    const protocol = req.protocol || "http";
    return `${protocol}://${req.headers.host}/api/v4/`;
});
builder.initialize().then(function() {
    app.start();
});


