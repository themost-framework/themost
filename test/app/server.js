/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */

'use strict';

var _app = require('./../../modules/@themost/web/app');

var HttpApplication = _app.HttpApplication;

var _module = require('../../modules/@themost/web/angular/module');

var AngularServerModule = _module.AngularServerModule;

require('source-map-support/register');

var _consumers = require('../../modules/@themost/web/consumers');

var HttpConsumer = _consumers.HttpConsumer;

var _mvc = require('../../modules/@themost/web/mvc');

var HttpJsonResult = _mvc.HttpJsonResult;

var _q = require('q');

var Q = _interopRequireDefault(_q).default;

var _results = require('../../modules/@themost/web/results');

var HttpNextResult = _results.HttpNextResult;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//initialize application
var app = new HttpApplication('./test/app');

app.useService(AngularServerModule).getService(AngularServerModule).useBootstrapModule(app.mapExecutionPath('./modules/server-app'));

app.any(function (context) {
    return Q(new HttpNextResult());
});

app.useAuthentication().useJsonContent().usePostContent().useMultipartContent().useFormatterStrategy().useStaticContent("./test/app/app").useViewContent();
app.start();
//# sourceMappingURL=server.js.map
