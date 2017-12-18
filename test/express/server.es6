import express from 'express';
import {HttpApplication} from './../../modules/@themost/web/index';
import 'source-map-support/register';
/**
 * initialize themost application as middleware
 */
const theApp = new HttpApplication("./test/app/");
const app = express();
//serve static files
app.use(express.static('./test/app/app'));
//register @themost middleware
app.use(theApp.runtime());
app.listen(process.env.PORT || 3000);
