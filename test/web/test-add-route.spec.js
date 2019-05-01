import {HttpApplication, HttpBaseController} from "@themost/web";
import path from 'path';
import {assert} from 'chai';
import {httpController, httpGet} from "@themost/web/decorators";
import {DataConfigurationStrategy} from "@themost/data";

@httpController()
class TestController extends HttpBaseController {

    @httpGet()
    async hello() {
        return {
            message: 'Hello World!'
        }
    }

}

describe('HttpConfiguration.routes', () => {
    /**
     * @type HttpApplication
     */
    let app;
    beforeEach(() => {
        app = new HttpApplication(path.resolve(process.cwd(),'test/app/server'));
        /**
         * @type DataConfigurationStrategy
         */
        const dataConfiguration = app.getConfiguration().getStrategy(DataConfigurationStrategy);
        dataConfiguration.adapters.forEach( adapter => {
           adapter.default = false;
        });
        const testAdapter = dataConfiguration.adapters.find( adapter => {
            return adapter.name === 'testing';
        });
        testAdapter.default = true;
    });

    it('should validate routes', () => {
        assert.isArray(app.getConfiguration().routes);
    });
    it('should add route', () => {
        app.getConfiguration().routes.push({
            url: '/hello/?',
            action: 'hello',
            controller: 'test',
            format: 'json'
        });
        assert.isDefined(app.getConfiguration().routes.find( x => {
            return x.url === '/hello/?';
        }));
    });
    it('should insert route', () => {
        app.getConfiguration().routes.unshift({
            url: '/hello/?',
            action: 'hello',
            controller: 'test',
            format: 'json'
        });
        assert.equal(app.getConfiguration().routes.findIndex( x => {
            return x.url === '/hello/?';
        }), 0);

    });
    it('should add route with custom view', async () => {
        // add controller
        app.useController('test', TestController);
        // add route
        app.getConfiguration().routes.unshift({
            url: '/hello/?',
            action: 'hello',
            controller: 'test',
            format: 'html',
            path: path.resolve(__dirname, 'views')
        });
        const response = await new Promise((resolve, reject) => {
            app.executeRequest({ url: '/hello/' }, (err, response) => {
                if (err) {
                    return reject(err);
                }
                return resolve(response)
            });
        });
        console.log('RESPONSE', response.body);
        assert.equal(response.statusCode, 200);

    });
});
