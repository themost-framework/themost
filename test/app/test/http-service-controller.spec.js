import request from 'supertest';
import app from '../server/server';
import {assert} from 'chai';

describe('test service controller', () => {
    
    it('should use entity set list', ()=> {
        return request(app.runtime())
            .get('/api/')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
            });
    });

    it('should get $metadata', ()=> {
        return request(app.runtime())
            .get('/api/$metadata')
            .expect('Content-Type', /xml/)
            .expect(200)
            .then( response => {
                assert.isString(response.text);
            });
    });

    it('should use entity set', ()=> {
        return request(app.runtime())
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
        return request(app.runtime())
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
        return request(app.runtime())
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
        return request(app.runtime())
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


    it('should use entity set function which returns an entity', ()=> {
        return request(app.runtime())
            .post('/api/users/FunctionReturnsEntity')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.isUndefined(response.body.value);
            });
    });

    it('should use entity set function which returns a data queryable entity', ()=> {
        return request(app.runtime())
            .post('/api/users/FunctionReturnsEntityQueryable')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.isUndefined(response.body.value);
            });
    });

    it('should use entity set function which returns a collection of entities', ()=> {
        return request(app.runtime())
            .post('/api/users/FunctionReturnsEntityCollection')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.isArray(response.body.value);
            });
    });

    it('should use entity set function which returns a data queryable collection of entities', ()=> {
        return request(app.runtime())
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
        return request(app.runtime())
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

    it('should use entity action which returns a primitive value', ()=> {
        return request(app.runtime())
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
        return request(app.runtime())
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
        return request(app.runtime())
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
        return request(app.runtime())
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
        return request(app.runtime())
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
        return request(app.runtime())
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
        return request(app.runtime())
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
        return request(app.runtime())
            .get('/api/users/1/groups')
            .set('Accept', 'application/json')
            .expect(200)
            .then(response => {
                assert.isObject(response.body);
                const findGroup = response.body.value.find( x => x.name === 'Guests');
                assert.isObject(findGroup);
            });
    });


    it('should use entity action (query entity by id) which returns a primitive value', ()=> {
        return request(app.runtime())
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
        return request(app.runtime())
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

    it('should use instance function (query entity by id) which returns an entity', ()=> {
        return request(app.runtime())
            .get('/api/users/1/InstanceFunctionReturnsEntity')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body['@odata.context'], '/api/$metadata#User');
                assert.isUndefined(response.body.value);
            });
    });

    it('should use instance function (query entity by id) which returns a data queryable entity', ()=> {
        return request(app.runtime())
            .get('/api/users/1/InstanceFunctionReturnsEntityQueryable')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body['@odata.context'], '/api/$metadata#User');
                assert.isUndefined(response.body.value);
            });
    });

    it('should use instance function (query entity by id) which returns a collection of entities', ()=> {
        return request(app.runtime())
            .get('/api/users/1/InstanceFunctionReturnsEntityCollection')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body['@odata.context'], '/api/$metadata#Group');
                assert.isArray(response.body.value);
            });
    });

    it('should use instance function (query entity by id) which returns a data queryable collection of entities', ()=> {
        return request(app.runtime())
            .get('/api/users/1/InstanceFunctionReturnsEntityCollectionQueryable')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body['@odata.context'], '/api/$metadata#Group');
                assert.isArray(response.body.value);
            });
    });

    it('should use instance function (query entity by id) which returns a primitive value', ()=> {
        return request(app.runtime())
            .get('/api/users/1/InstanceFunctionReturnString')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body.value, 'Hello');
            });
    });

    it('should use instance function (query entity by id) which returns an array of primitive values', ()=> {
        return request(app.runtime())
            .get('/api/users/1/InstanceFunctionReturnStringArray')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.isArray(response.body.value);
                assert.equal(response.body.value[0], 'Hello');
            });
    });

    it('should use instance function (of entity set function result) which returns a primitive value', ()=> {
        return request(app.runtime())
            .get('/api/users/me/InstanceFunctionReturnString')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body['@odata.context'], '/api/$metadata#Edm.String');
                assert.equal(response.body.value, 'Hello');
            });
    });

    it('should use instance function (of entity set function result) which returns an array of primitive values', ()=> {
        return request(app.runtime())
            .get('/api/users/me/InstanceFunctionReturnStringArray')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body['@odata.context'], '/api/$metadata#Edm.String');
                assert.isArray(response.body.value);
                assert.equal(response.body.value[0], 'Hello');
            });
    });


    it('should use instance function (of entity set function result) which returns an entity', ()=> {
        return request(app.runtime())
            .get('/api/users/me/InstanceFunctionReturnsEntity')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body['@odata.context'], '/api/$metadata#User');
                assert.isUndefined(response.body.value);
            });
    });

    it('should use instance function (of entity set function result) which returns a data queryable entity', ()=> {
        return request(app.runtime())
            .get('/api/users/me/InstanceFunctionReturnsEntityQueryable')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body['@odata.context'], '/api/$metadata#User');
                assert.isUndefined(response.body.value);
            });
    });

    it('should use instance function (of entity set function result) which returns a collection of entities', ()=> {
        return request(app.runtime())
            .get('/api/users/me/InstanceFunctionReturnsEntityCollection')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body['@odata.context'], '/api/$metadata#Group');
                assert.isArray(response.body.value);
            });
    });

    it('should use instance function (of entity set function result) which returns a data queryable collection of entities', ()=> {
        return request(app.runtime())
            .get('/api/users/me/InstanceFunctionReturnsEntityCollectionQueryable')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body['@odata.context'], '/api/$metadata#Group');
                assert.isArray(response.body.value);
            });
    });

    it('should use entity action (of entity set function result) which returns a primitive value', ()=> {
        return request(app.runtime())
            .post('/api/users/me/InstanceActionReturnString')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body['@odata.context'], '/api/$metadata#Edm.String');
                assert.equal(response.body.value, 'Hello');
            });
    });

    it('should use entity action (of entity set function result) which returns an array of primitive values', ()=> {
        return request(app.runtime())
            .post('/api/users/me/InstanceActionReturnStringArray')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.isArray(response.body.value);
                assert.equal(response.body['@odata.context'], '/api/$metadata#Edm.String');
                assert.equal(response.body.value[0], 'Hello');
            });
    });


    it('should use instance action (of entity set function result) which returns an entity', ()=> {
        return request(app.runtime())
            .post('/api/users/me/InstanceActionReturnsEntity')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body['@odata.context'], '/api/$metadata#User');
                assert.isUndefined(response.body.value);
            });
    });

    it('should use instance action (of entity set function result) which returns a data queryable entity', ()=> {
        return request(app.runtime())
            .post('/api/users/me/InstanceActionReturnsEntityQueryable')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body['@odata.context'], '/api/$metadata#User');
                assert.isUndefined(response.body.value);
            });
    });

    it('should use instance action (of entity set function result) which returns a collection of entities', ()=> {
        return request(app.runtime())
            .post('/api/users/me/InstanceActionReturnsEntityCollection')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body['@odata.context'], '/api/$metadata#Group');
                assert.isArray(response.body.value);
            });
    });

    it('should use instance action (of entity set function result) which returns a data queryable collection of entities', ()=> {
        return request(app.runtime())
            .post('/api/users/me/InstanceActionReturnsEntityCollectionQueryable')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then( response => {
                assert.isObject(response.body);
                assert.equal(response.body['@odata.context'], '/api/$metadata#Group');
                assert.isArray(response.body.value);
            });
    });


    it('should use entity set function which returns null or undefined', ()=> {
        return request(app.runtime())
            .get('/api/users/FunctionReturnsNull')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then(response => {
                assert.isObject(response.body);
                assert.isUndefined(response.body.value);
            });
    });

});

