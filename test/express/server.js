'use strict';

var _express = require('express');

var express = _interopRequireDefault(_express).default;

var _index = require('./../../modules/@themost/web/index');

var HttpApplication = _index.HttpApplication;

require('source-map-support/register');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * initialize themost application as middleware
 */
var theApp = new HttpApplication("./test/express/");
theApp.useQuerystring().useFormatterStrategy().useAuthentication().useViewContent();

var app = express();
//register @themost middleware
app.use(theApp.runtime());
// app.use('/', function(req, res){
//     res.send('hello world');
// });
app.listen(process.env.PORT || 3000);
//# sourceMappingURL=server.js.map
