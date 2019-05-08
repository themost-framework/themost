import {HttpApplication} from '@themost/web/app';
import path from 'path';
import {ODataModelBuilderConfiguration} from '@themost/web/odata';
import {TraceUtils} from '@themost/common/utils';
import {HttpServiceController} from "@themost/web";
//initialize app
let app = new HttpApplication(path.resolve(__dirname));
//set static content
app.useStaticContent(path.resolve('./app'));
//configure api
ODataModelBuilderConfiguration.config(app).then((builder)=> {
    // set service root
    builder.serviceRoot = '/api/';
    // set service controller
    app.useController('service', HttpServiceController);
    // set context ling
    builder.hasContextLink(() => {
       return '/api/$metadata';
    });
}).catch((err)=> {
    TraceUtils.error(err);
});

module.exports = app;
