'use strict';
import {HttpApplication} from './../../modules/@themost/web';
import 'source-map-support/register';
//initialize application
let app = new HttpApplication('./test/app');

app.start();
