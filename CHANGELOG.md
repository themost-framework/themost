### Changelog

###### @themost/web 6.4.0 - 2019-05-08

- ODataModelBuilderConfiguration.configSync(app) configures synchronously ODataModelBuilder service.

        //configure api
        ODataModelBuilderConfiguration.configSync(app);
        // set service root
        builder.serviceRoot = '/api/';
        ...
    This operation may be used instead of classic ODataModelBuilderConfiguration.config(app)
        
        //configure api
        ODataModelBuilderConfiguration.config(app).then((builder)=> {
            // set service root
            builder.serviceRoot = '/api/';
            // set service controller
            app.useController('service', HttpServiceController);
            ...
        }).catch((err)=> {
            TraceUtils.error(err);
        });

- HttpController.configure(app) is a static method which allows to configure an http application (e.g. add routes, services etc)
while registering an http controller e.g.

        @httpController()
        class TestController extends HttpBaseController {
            constructor(context) {
                //
            }
            static configure(app) {
                ...
            }
            @httpGet()
            @httpAction('hello')
            hello() {
                return 'Hello World';
            }
        }
        
        // initialize application
        app.useController('test', TestController);
        
- HttpApplication.runtime() has been updated to fully support 
application initialization in testing enviroments e.g.

        import request from 'supertest';
        import app from '../server/server';
        import {assert} from 'chai';

        describe('test service controller', () => {
            it('should get $metadata', ()=> {
                return request(app.runtime())
                    .get('/api/$metadata')
                    .expect('Content-Type', /xml/)
                    .expect(200)
                    .then( response => {
                        assert.isString(response.text);
                    });
            });
        });

- Default html error page has been updated.

- HttpServiceController has been updated to automatically add action routes. 
Simply use HttpApplication.useController() to add HttpServiceController to application controllers e.g. 

        # server.js
        
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
