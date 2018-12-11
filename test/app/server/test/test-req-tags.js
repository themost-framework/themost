import request from 'supertest';
import {assert} from 'chai';
// noinspection JSCheckFunctionSignatures
const req = request('http://localhost:3000/api/');

describe('GET product product/tags', function() {

    let authorizationHeader = 'Basic ' + new Buffer(`admin@example.com:user`).toString('base64');

    it('should get user', async () => {
        let response = await req.get(`users/me`)
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .expect(200)
            .expect('Content-Type', /json/);
        assert.isObject(response.body);
        assert.equal(response.body.name, 'admin@example.com');
    });

    it('should get product with filter', async () => {
        let response = await req.get(`products?$filter=name eq 'Sony VAIO Flip 15'`)
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .expect(200)
            .expect('Content-Type', /json/);
        assert.isArray(response.body.value);
        assert.equal(response.body.value.length, 1);
    });

    it('should get product with id', async () => {
        let response = await req.get(`products/368/'`)
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .expect(200)
            .expect('Content-Type', /json/);
        assert.isArray(response.body.value);
        assert.equal(response.body.value.length, 1);
    });

});
