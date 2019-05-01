#### Add an HTTP controller programmatically

HTTP controllers are being registered automatically as described in previous articles. 
Use HttpApplication.useController(string,Function) method to register an HTTP controller by code.


    import {HttpApplication, HttpBaseController} from "@themost/web";
    import path from 'path';
    import {assert} from 'chai';
    import {httpController, httpGet} from "@themost/web/decorators";
    
    @httpController()
    class TestController extends HttpBaseController {
    
        @httpGet()
        async hello() {
            return {
                message: 'Hello World!'
            }
        }
    
    }
    
    ...
    
    //initialize app
    let app = new HttpApplication(path.resolve(__dirname));
    //set static content
    app.useStaticContent(path.resolve('./public'));
    // add controller programmatically
    app.useController('test', TestController);
