'use strict';

var _express = require('express');

var express = _interopRequireDefault(_express).default;

var _index = require('./../../modules/@themost/web/index');

var HttpApplication = _index.HttpApplication;

require('source-map-support/register');

var _odata = require('./../../modules/@themost/web/odata');

var ODataModelBuilderConfiguration = _odata.ODataModelBuilderConfiguration;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @type {HttpApplication|*}
 */
var theApp = new HttpApplication("./test/app/");
ODataModelBuilderConfiguration.config(theApp).then(function () {});
var app = express();
//serve static files
app.use(express.static('./test/app/app'));
//register @themost middleware
app.use(theApp.runtime());
app.listen(process.env.PORT || 3000);
//# sourceMappingURL=server.js.map
