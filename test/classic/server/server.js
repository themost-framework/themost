import {HttpApplication} from '@themost/web/app';
import path from 'path';
import {TraceUtils} from '@themost/common/utils';
import {AngularServerModule} from "@themost/web/angular/module";
import {LocalizationStrategy, I18nLocalizationStrategy} from "@themost/web/localization";
//initialize app
let app = new HttpApplication(path.resolve(__dirname));
//set static content
app.useStaticContent(path.resolve('./app'));
//use i18n localization strategy
app.useStrategy(LocalizationStrategy, I18nLocalizationStrategy);
//use angular server module
app.useService(AngularServerModule)
    .getService(AngularServerModule)
    .useBootstrapModule(app.mapExecutionPath('./modules/server-app'));
//start http application
app.start({
    port:process.env.PORT ? process.env.PORT: 3000,
    bind:process.env.IP || '0.0.0.0'
});
