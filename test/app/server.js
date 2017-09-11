'use strict';

var _web = require('./../../modules/@themost/web');

var HttpApplication = _web.HttpApplication;

require('source-map-support/register');

//initialize application
var app = new HttpApplication('./test/app');
app.start();
//# sourceMappingURL=server.js.map
