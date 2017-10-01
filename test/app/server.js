'use strict';

require('source-map-support/register');

var _app = require('./../../modules/@themost/web/app');

var HttpApplication = _app.HttpApplication;

var _module = require('../../modules/@themost/web/angular/module');

var AngularServerModule = _module.AngularServerModule;

var _odata = require('../../modules/@themost/data/odata');

var ODataConventionModelBuilder = _odata.ODataConventionModelBuilder;
var ODataModelBuilder = _odata.ODataModelBuilder;

//initialize application
/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var app = new HttpApplication('./test/app');

app.useService(AngularServerModule).getService(AngularServerModule).useBootstrapModule(app.mapExecutionPath('./modules/server-app'));

app.getConfiguration().useStrategy(ODataModelBuilder, ODataConventionModelBuilder);

app.useAuthentication().useJsonContent().usePostContent().useMultipartContent().useFormatterStrategy().useStaticContent("./test/app/app");
app.useViewContent();
app.start();
//# sourceMappingURL=server.js.map
