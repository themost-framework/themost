'use strict';
import express from 'express';
import {HttpApplication} from './../../modules/@themost/web/index';
import 'source-map-support/register';
/**
 * initialize themost application as middleware
 */
const theApp = new HttpApplication("./test/express/");
const app = express();
//register @themost middleware
app.use(theApp.runtime());
app.listen(process.env.PORT || 3000);
