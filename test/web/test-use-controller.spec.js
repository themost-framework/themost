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

describe('HttpApplication.useController()', () => {
    const app = new HttpApplication(path.resolve(process.cwd(),'test/app/server'));
    it('should add controller', () => {
        // validate controllers
        const controllers = app.getConfiguration().controllers;
        assert.isObject(controllers);
        // add controller
        app.useController('test', TestController);
        assert.isOk(controllers.hasOwnProperty('test'));
        assert.equal(controllers['test'], TestController);
    });
    it('should use controller', async () => {
        app.useController('test', TestController);
        const response = await new Promise((resolve, reject) => {
            app.executeRequest({ url: '/tests/hello.json' }, (err, response) => {
                if (err) {
                    return reject(err);
                }
                return resolve(response)
            });
        });
        assert.isObject(response);
        assert.equal(response.statusCode, 200);
        // convert body
        const result = JSON.parse(response.body);
        assert.equal(result.message, 'Hello World!');
    });
});
