import {HttpApplication} from '@themost/web/app';
import path from 'path';
import {ODataModelBuilderConfiguration} from '@themost/web/odata';
import {TraceUtils} from '@themost/common/utils';
//initialize app
let app = new HttpApplication(path.resolve(__dirname));
//set static content
app.useStaticContent(path.resolve('./app'));
//configure api
ODataModelBuilderConfiguration.config(app).then((builder)=> {
    builder.serviceRoot = '/api/';
    builder.hasContextLink((context)=> {
       return '/api/$metadata';
    });
}).catch((err)=> {
    TraceUtils.error(err);
});
//start http application
app.start({
    port:process.env.PORT ? process.env.PORT: 3000,
    bind:process.env.IP || '0.0.0.0'
});
