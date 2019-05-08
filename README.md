# themost
MOST Web Framework 2.0 **Codename Blueshift**

The new version of [MOST Web Framework](http://github.com/kbarbounakis/most-web) 
comes with a set of new features for building modern data-driven web applications and services.

## Changelog

View MOST Web Framework changelog [here](CHANGELOG.md)

## Generate a new application

Install [MOST Web Framework CLI](http://github.com/kbarbounakis/most-web-cli) globally:

    npm install @themost/cli -g
    
and generate a new project by executing:

    themost generate new project <project name>
    
where [project name] is the name of the project which is going to be generated e.g.
    
    themost generate new project test-app

MOST Web Framework approaches a web application structure with a wind set of naming conventions. 
So, a classic application structure seems like:

    + app
        + assets
            ...
        + vendor
            ...
    + server
        + controllers
            root-controller.js
        + config
            + models
                Thing.json
                User.json
                Group.json
                ...
            app.json
            routes.json
        + views
            + root
                index.html.ejs
            + shared
                master.html.ejs
                    
                
Navigate to new project directory and start application by executing:
    
    npm run serve

## Use Controllers

Controllers are classes which handle requests and are stored in server/controllers 
directory.


    //# server/controllers/hello-controller.js
    
    import HttpBaseController from '@themost/web/controllers/base';
    import {httpController,httpGet, httpAction} from '@themost/web/decorators';
    
    @httpController()
    export default class RootController extends HttpBaseController {
        
        constructor(context) {
            super(context);
        }
        
        /**
         * GET /hello.html
         * @returns {Promise<any>}
         */
        @httpGet()
        @httpAction('hello')
        hello() {
            return Promise.resolve({
                "message": "Hello World!"
            });
        }
        
    }  

Generate a new controller by executing the following command:

    themost generate controller <controller name>
    
e.g.

    themost generate controller Test

This command will generate a new controller in server/controllers/test-controller.js.
The new module exports a default class named TestController. TestController class extends HttpBaseController class which
is one of the available controller classes of @themost.
The framework uses the above naming convention (test-controller) to identify an HTTP controller available to handle requests.

@themost uses EcmaScript decorators for defining HTTP controllers actions and methods.
An HTTP controller class has @httpController() decorator to let framework identify it as 
a valid HTTP controller.

    
    @httpController()
    export default class RootController extends HttpBaseController 
    ...

An instance method of an HTTP controller may be marked as an HTTP action by defining one or more of the
available decorators for HTTP actions.

    @httpGet()
    @httpAction('hello')
    hello() {
        return Promise.resolve({
            "message": "Hello World!"
        });
    }
    
These decorators are:

- @httpGet() to handle GET requests
- @httpPost() to handle POST requests
- @httpPut() to handle PUT requests
- @httpDelete() to handle DELETE requests
- @httpPatch() to handle PATCH requests
- @httpHead()  to handle HEAD requests

@httpAction() decorator is used to define an HTTP action name

    @httpGet()
    @httpAction('hello')    
    hello() {
    ...
    }

#### HTTP results

The result of an HTTP action may be an instance of HttpResult class or any other class which derives from HttpResult class.


###### HttpController#json(any)

Returns a application/json result

    @httpGet()
    @httpAction('hello')
    hello() {
        return this.json({
            "message": "Hello World!"
        });
    }    

###### HttpController#xml(any)

Returns an application/xml result

    @httpGet()
    @httpAction('hello')
    hello() {
        return this.xml({
            "message": "Hello World!"
        });
    } 

###### HttpController#content(string)

Returns a text/html content result

    @httpGet()
    @httpAction('hello')
    hello() {
        return this.view(`
        <h2>Hello World!</h2>
        `);
    } 

###### HttpController#view(any)

Returns a text/html result

    @httpGet()
    @httpAction('hello')
    hello() {
        return this.view({
            "message": "Hello World!"
        });
    } 
    
###### HttpController#file(physicalPath, fileName)

Returns a content result based on the mime type of the physical file

    @httpGet()
    @httpAction('hello')
    hello() {
        return this.file(path.resolve(process.cwd(),'./app/assets/hello.pdf'));
    } 

###### HttpController#redirect(url)

Redirects the current HTTP request

    @httpGet()
    @httpAction('hello')
    hello() {
        return this.redirect('/login.html');
    } 

@themost uses a set of view engines for rendering content:

**EJS View Engine**

based on [Embedded JavaScript templates](https://github.com/mde/ejs)

    <div class="container">
        <div class="row">
            <div class="col-lg-12 text-center">
                <h2 class="mt-5"><%=model.message%></h2>
            </div>
        </div>
    </div>

**Vash View Engine** 

based on [Vash, Razor syntax, for JavaScript templates](https://github.com/kirbysayshi/vash)

    <html lang="en">
        <head><title>MOST Web Framework</title></head>
        <body>
            <h2>@model.message</h2>
        </body>
    </html>

**Jade View Engine** 

based on [Pug – robust, elegant, feature rich template engine for Node.js](https://github.com/pugjs/pug)

    doctype html
    html(lang="en")
        head
            title MOST Web Framework
        body
            h2= model.message

**AngularJS for Server**

@themost presents an new template engine based on the popular [AngularJS 1.x framework](https://github.com/angular/angular.js)
This template is running in paraller with other templates engines and allows the use of AngularJS in server-side rendering.

The following example contains an AngularJS server module and a simple directive which includes a hello message in an element:

    //# server/modules/server-app.js
    /**
     * Initializes angular server application
     * @param angular
     */
    export function bootstrap(angular) {
        let serverExtensions = angular.module('server-extensions',[]);
        serverExtensions
            .directive('serverHello', function() {
                return {
                    restrict: 'A',
                    scope: {
                        serverHello: '='
                    },
                    link: function (scope, element) {
                        element.html(scope.serverHello);
                    }
                };
            });
        return angular.module('server',['server-extensions']);
    }


Include the following html markup:

    <p server-hello="'This is a hello message from server application'"></p>
    
e.g.

    <div class="container">
        <div class="row">
            <div class="col-lg-12 text-center">
                <h2 class="mt-5"><%=model.message%></h2>
                <p server-hello="'This is a hello message from server application'"></p>
            </div>
        </div>
    </div>

and start using AngularJS directives in any server-side view.

The result of an HTTP action may be also a Promise of any object (including an instance of HttpResult class).

    @httpGet()
    @httpAction('hello')
    hello() {
        return Promise.resolve({
            "message": "Hello World!"
        });
    }
    
or

    @httpGet()
    @httpAction('hello')
    hello() {
        return new Promise((resolve, reject) => {
            //...
            return resolve({
               "message": "Hello World!"
           });
        });
    }

## Use routing

MOST Web Framework holds application routings in server/config/routes.json file. 

    [
        {
            "url": "/?",
            "controller": "root",
            "action": "index"
        },
        {
            "url": "/:action.html",
            "controller": "root",
            "format": "html"
        },
        {
            "url": "/:action.json",
            "controller": "root",
            "format": "json"
        },
        {
            "url": "/:action.xml",
            "controller": "root",
            "format": "xml"
        },
        {
            "url": "/{controller:plural}/?",
            "action": "index"
        },
        {
            "url": "/{controller:plural}/:action.html",
            "format": "html"
        },
        {
            "url": "/{controller:plural}/:action.json",
            "format": "json"
        },
        {
            "url": "/{controller:plural}/:action.xml",
            "format": "xml"
        }
    ]

An application route may have a set of parameters that are defined with a colon followed by parameter name e.g. /test/:id/edit.html 

    {
        "url": "/:action.html",
        "controller": "root",
        "format": "html"
    }

The example above defines an application route for each action of RootController. 
The static parameter [controller] defines the controller which is going to serve the action. The [action] parameter defines the target action. 
The [format] parameter defines the content-type of the action result.

Any application route may have typed route parameters.

    /users/{id:int}/edit.json
    
This route defines a parameter named [id] which it must be an integer. Any other value will be ignored. Typed route parameters are:

Format | Type |
--- | --- |
{param:int} | Defines an integer parameter (e.g. /users/12450/edit.json )
{param:boolean} | Defines a boolean parameter
{param:float} | Defines a float parameter
{param:guid} | Defines a GUID parameter e.g. /users/2812EAEE-29C5-4810-AD9C-E6A50E97DE40/edit.json is served based on the following route: /users/{id:guid}/edit.json
{param:plural} | Defines a string parameter that is used with its plural. This typed parameter is used for controller names e.g. /users/100/edit.html is served based on /{controller:plural}/{id:int}/edit.html where finally controller parameter is "user".
{param:date} | Defines a DateTime parameter wrapped in single quotes e.g. /orders/calculate('2018-02-01') is served based on the following route: /orders/calculate\\({targetDate:date}\\)
{param:string} | Defines a string parameter wrapped in single quotes e.g. /users('admin@example.com')/edit.json is served based on the following route: /users\\({email:date}\\)/edit.json

Route parameters may be passed as action arguments.

    import HttpBaseController from '@themost/web/controllers/base';
    import {httpController,httpGet, httpAction} from '@themost/web/decorators';
    
    @httpController()
    export default class TestController extends HttpBaseController {
        
        constructor(context) {
            super(context);
        }
        
        ...
    
        @httpGet()
        @httpAction('multiply')
        multiply(a, b) {
            return Promise.resolve({
                result: a * b
            });
        }
        
        ...
        
    }

The TestController.multiply(a,b) has two float arguments. A route for this action may be:

    {
        "url": "/test/multiply\\({a:float},{b:float}\\)",
        "controller": "test",
        "action": "multiply",
        "format": "json"
    }

An HTTP request on /test/multiply(4.5,5.5) will produce the following response:

    {
        "result": 24.75
    }

Any other request (like /test/multiply(x,5.5)) will fail with 404 Not Found HTTP result

An HTTP controller action may validate any parameter with @httpParam decorator. 
This powerfull decorator allows a final parameter validation before the execution of an HTTP action.

    
    import HttpBaseController from '@themost/web/controllers/base';
    import {httpController,httpGet, httpAction} from '@themost/web/decorators';
    
    @httpController()
    export default class TestController extends HttpBaseController {
        
        constructor(context) {
            super(context);
        }
        
        ...
    
        @httpGet()
        @httpParam({ name: "b", type:"NonNegativeNumber" })
        @httpParam({ name: "a", type:"NonNegativeNumber" })
        @httpAction('multiply')
        multiply(a, b) {
            return Promise.resolve({
                result: a * b
            });
        }
        
        ...
        
    }

In this case any HTTP request where a or b parameter is a negative number (e.g. /test/multiply(-2.5,5.5)) will fail with 400 Bad Request HTTP error. 

Note: @httpParam() decorators must be placed in reverse order.

An @httpParam decorator may have the following attributes

Attribute | Description
--- | ---
name | Defines the argument name
type | Defines the argument type based on application defined types (e.g. Integer, NonNegativeInteger, PositiveInteger, Email, Date, DateTime, Number etc.)
required | Indicates whether this parameter is required or not even if this is not described in application route
minLength | Defines the minimum length of a parameter
maxLength | Defines the maximum length of a parameter
minValue | Defines the minimum value for the given parameter
maxValue | Defines the maximum value for the given parameter
message | Defines a validation message for this parameter
pattern | Defines a regular expression for the given parameter


## Use static content

A @themost web application may serve static files. HttpApplication#useStaticContent(contentPath) enables the serving of static files of the specified directory.

    //# server/server.js
    import {HttpApplication} from '@themost/web/app';
    import path from 'path';
    import {TraceUtils} from '@themost/common/utils';
    import {AngularServerModule} from "@themost/web/angular/module";
    import {LocalizationStrategy, I18nLocalizationStrategy} from "@themost/web/localization";
    //initialize app
    let app = new HttpApplication(path.resolve(__dirname));
    ...
    //use static content
    app.useStaticContent(path.resolve('./app'));
    ...


