
const path = require('path');
const assert = require('chai').assert;
const HttpApplication = require('../../modules/@themost/web').HttpApplication;
const ServicesConfiguration = require('../../modules/@themost/web').ServicesConfiguration;
const HelloService = require('../app/server/services/hello-service').HelloService;

describe('Services Configuration Test', () => {

    const app = new HttpApplication(path.resolve(process.cwd(),'./server'));
    ServicesConfiguration.config(app);

    it('should load hello service',() => {
        assert.isObject(app.getService(HelloService));
    });

});
