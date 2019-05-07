import request from 'supertest';
import {HttpApplication, ODataModelBuilderConfiguration} from "@themost/web";
import path from 'path';
import {assert} from 'chai';

describe('test service controller', () => {
    // get application
    let httpApp = new HttpApplication(path.resolve(__dirname,'../server'));
    // configure model builder
    ODataModelBuilderConfiguration.config(httpApp).then((builder)=> {
        builder.serviceRoot = '/api/';
        builder.hasContextLink(()=> {
            return '/api/$metadata';
        });
    });
    let app = httpApp.runtime();

    it('should use entity set list', ()=> {
        return request(app)
            .get('/api/')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
            });
    });

    it('should get $metadata', ()=> {
        return request(app)
            .get('/api/$metadata')
            .expect('Content-Type', /xml/)
            .expect(200)
            .then( response => {
                assert.isString(response.text);
            });
    });

    it('should use entity set', ()=> {
        return request(app)
            .get('/api/users/')
            .query({$count: true })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.isArray(response.body.value);
                assert.equal(response.body.value.length, 1);
                assert.equal(response.body.value[0].name, 'anonymous');
            });
    });

    it('should use entity set function', ()=> {
        return request(app)
            .get('/api/users/me')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then(response => {
                assert.isObject(response.body);
                assert.equal(response.body.name, 'anonymous');
            });
    });

    it('should use entity set function which returns a primitive value', ()=> {
        return request(app)
            .get('/api/users/FunctionReturnsString')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then(response => {
                assert.isObject(response.body);
                assert.equal(response.body.value, 'Hello');
            });
    });

    it('should use entity set function which returns an array of primitive values', ()=> {
        return request(app)
            .get('/api/users/FunctionReturnsStringArray')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then(response => {
                assert.isObject(response.body);
                assert.isArray(response.body.value);
                assert.equal(response.body.value[0], 'Hello');
            });
    });


    it('should use entity function which returns an entity', ()=> {
        return request(app)
            .post('/api/users/FunctionReturnsEntity')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.isUndefined(response.body.value);
            });
    });

    it('should use entity function which returns a data queryable entity', ()=> {
        return request(app)
            .post('/api/users/FunctionReturnsEntityQueryable')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.isUndefined(response.body.value);
            });
    });

    it('should use entity function which returns a collection of entities', ()=> {
        return request(app)
            .post('/api/users/FunctionReturnsEntityCollection')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.isArray(response.body.value);
            });
    });

    it('should use entity function which returns a data queryable collection of entities', ()=> {
        return request(app)
            .post('/api/users/FunctionReturnsEntityCollectionQueryable')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.isArray(response.body.value);
            });
    });


    it('should use entity navigation property', ()=> {
        return request(app)
            .get('/api/users/me/groups')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.isArray(response.body.value);
                const findGroup = response.body.value.find( x => x.name === 'Guests');
                assert.isObject(findGroup);
            });
    });

    it('should use entity function which returns a data object', ()=> {
        return request(app)
            .get('/api/users/me/memberof?group=Guests')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body.name, 'Guests');
            });
    });

    it('should use entity action which returns a data object', ()=> {
        return request(app)
            .post('/api/users/me/postMemberOf')
            .set('Accept', 'application/json')
            .send({ group: 'Guests' })
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body.name, 'Guests');
            });
    });

    it('should use entity action which returns a primitive value', ()=> {
        return request(app)
            .post('/api/users/ActionReturnString')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body.value, 'Hello');
            });
    });

    it('should use entity action which returns an entity', ()=> {
        return request(app)
            .post('/api/users/ActionReturnsEntity')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.isUndefined(response.body.value);
            });
    });

    it('should use entity action which returns a data queryable entity', ()=> {
        return request(app)
            .post('/api/users/ActionReturnsEntityQueryable')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.isUndefined(response.body.value);
            });
    });

    it('should use entity action which returns a collection of entities', ()=> {
        return request(app)
            .post('/api/users/ActionReturnsEntityCollection')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.isArray(response.body.value);
            });
    });

    it('should use entity action which returns a data queryable collection of entities', ()=> {
        return request(app)
            .post('/api/users/ActionReturnsEntityCollectionQueryable')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.isArray(response.body.value);
            });
    });

    it('should use entity action which returns a primitive array of values', ()=> {
        return request(app)
            .post('/api/users/ActionReturnStringArray')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.isArray(response.body.value);
                assert.equal(response.body.value[0], 'Hello');
            });
    });

    it('should get entity by id', ()=> {
        return request(app)
            .get('/api/users/1/')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then(response => {
                assert.isObject(response.body);
                assert.equal(response.body.name, 'anonymous');
            });
    });

    it('should get entity navigation property by id', ()=> {
        return request(app)
            .get('/api/users/1/groups')
            .set('Accept', 'application/json')
            .expect(200)
            .then(response => {
                assert.isObject(response.body);
                const findGroup = response.body.value.find( x => x.name === 'Guests');
                assert.isObject(findGroup);
            });
    });

    it('should use entity function (query entity by id) which returns a data object', ()=> {
        return request(app)
            .get('/api/users/1/memberof?group=Guests')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body.name, 'Guests');
            });
    });

    it('should use entity function (query entity by id) which returns a primitive value', ()=> {
        return request(app)
            .get('/api/users/1/InstanceFunc1')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body.value.message, 'Hello');
            });
    });

    it('should use entity action (query entity by id) which returns a data object', ()=> {
        return request(app)
            .post('/api/users/1/postMemberOf')
            .set('Accept', 'application/json')
            .send({ group: 'Guests' })
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body.name, 'Guests');
            });
    });

    it('should use entity action (query entity by id) which returns a primitive value', ()=> {
        return request(app)
            .post('/api/users/1/InstanceActionReturnString')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body.value, 'Hello');
            });
    });

    it('should use entity action (query entity by id) which returns an array of primitive values', ()=> {
        return request(app)
            .post('/api/users/1/InstanceActionReturnStringArray')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.isArray(response.body.value);
                assert.equal(response.body.value[0], 'Hello');
            });
    });

});

