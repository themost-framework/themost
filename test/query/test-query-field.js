/* eslint no-console: off*/
const assert = require('chai').assert;
const QueryField = require('../../modules/@themost/query').QueryField;
const QueryEntity = require('../../modules/@themost/query').QueryEntity;
const SqlFormatter = require('../../modules/@themost/query').SqlFormatter;
const QueryExpression = require('../../modules/@themost/query').QueryExpression;
describe('test query field', () => {

    before((done) => {
       return done();
    });

    after((done)=> {
        return done();
    });

    it('should use construct QueryField', (done) => {
       const field = new QueryField();
       assert.instanceOf(field, QueryField);
       return done();
    });

    it('should use construct QueryField with params', (done) => {
        const field = new QueryField('id');
        console.log(JSON.stringify(field, null, 4));
        // validate instance
        assert.instanceOf(field, QueryField);
        // validate $name property
        assert.property(field, '$name');
        // validate name
        assert.equal(field.getName(), 'id');
        return done();
    });

    it('should use QueryField.from', (done) => {
        // new QueryField
        const field = new QueryField('id').from('UserBase');
        console.log(JSON.stringify(field, null, 4));
        // validate instance
        assert.instanceOf(field, QueryField);
        // validate $name property
        assert.property(field, '$name');
        // validate name
        assert.equal(field.getName(), 'id');
        return done();
    });

    it('should use QueryField.select(name)', (done) => {
        // new QueryField
        const field = new QueryField().select('id');
        console.log(JSON.stringify(field, null, 4));
        const expected = {
            "$name": "id"
        };
        // validate instance
        assert.instanceOf(field, QueryField);
        // validate $name property
        assert.property(field, '$name');
        // validate name
        assert.equal(field.$name, expected.$name);
        return done();
    });

    it('should validate QueryField.select(name)', (done) => {
        assert.throws(()=> {
            // new QueryField
            const field = new QueryField().select(5);
            console.log(JSON.stringify(field, null, 4));
        });
        return done();
    });

    it('should use QueryField.as(name)', (done) => {
        // new QueryField
        const field = new QueryField().count('id').as('total');
        const expected = {
            "total": {
                "$count": "id"
            }
        };
        console.log(JSON.stringify(field, null, 4));
        // validate instance
        assert.instanceOf(field, QueryField);
        assert.property(field, 'total');
        assert.equal(field.total.$count, expected.total.$count);
        return done();
    });

    it('should use QueryField.count(name)', (done) => {
        // new QueryField
        const field = new QueryField().count('id').as('totalCount');
        const expected = {
            "totalCount": {
                "$count": "id"
            }
        };
        console.log(JSON.stringify(field, null, 4));
        // validate instance
        assert.instanceOf(field, QueryField);
        // validate $count property
        assert.equal(field.totalCount.$count, expected.totalCount.$count);
        return done();
    });

    it('should use QueryField.sum(name)', (done) => {
        // new QueryField
        const field = new QueryField().sum('price').as('total');
        const expected = {
            "total": {
                "$sum": "price"
            }
        };
        console.log(JSON.stringify(field, null, 4));
        // validate instance
        assert.instanceOf(field, QueryField);
        assert.property(field, 'total');
        assert.equal(field.total.$sum, expected.total.$sum);
        return done();
    });

    it('should use QueryField.average(name)', (done) => {
        // new QueryField
        const field = new QueryField().average('price').as('averagePrice');
        const expected = {
            "averagePrice": {
                "$avg": "price"
            }
        };
        console.log(JSON.stringify(field, null, 4));
        // validate instance
        assert.instanceOf(field, QueryField);
        assert.equal(field.averagePrice.$avg, expected.averagePrice.$avg);
        return done();
    });

    it('should use QueryField.max(name)', (done) => {
        // new QueryField
        const field = new QueryField().max('price').as('maxPrice');
        const expected = {
            "maxPrice": {
                "$max": "price"
            }
        };
        console.log(JSON.stringify(field, null, 4));
        // validate instance
        assert.instanceOf(field, QueryField);
        assert.equal(field.maxPrice.$max, expected.maxPrice.$max);
        return done();
    });


});
