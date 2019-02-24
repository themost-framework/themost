/* eslint no-console: off*/
const assert = require('chai').assert;
const QueryField = require('../../modules/@themost/query').QueryField;
const SqlFormatter = require('../../modules/@themost/query').SqlFormatter;
const QueryExpression = require('../../modules/@themost/query').QueryExpression;

describe('test query expression', () => {

    it('should use QueryExpression', (done) => {
        const q = new QueryExpression().from('UserBase').select('id', 'name');
        console.log(JSON.stringify(q, null, 4));
        const formatter = new SqlFormatter();
        const strSQL = formatter.formatSelect(q);
        console.log('SQL',strSQL);
        assert.equal(strSQL,'SELECT UserBase.id, UserBase.name FROM UserBase');
        return done();
    });

    it('should use QueryExpression.clone()', (done) => {
        const originalQuery = new QueryExpression().from('UserBase').select('id', 'name');
        const clonedQuery = originalQuery.clone();
        console.log('CLONE', originalQuery);
        assert.equal(JSON.stringify(originalQuery, null, 4), JSON.stringify(clonedQuery, null, 4));
        // add something more to q
        originalQuery.orderBy('name');
        console.log('QUERY', originalQuery);
        assert.notEqual(JSON.stringify(originalQuery, null, 4), JSON.stringify(clonedQuery, null, 4));
        return done();
    });

    it('should use QueryField.count(name) in query', (done) => {
        const q = new QueryExpression().from('UserBase').select(
            new QueryField().count('id').as('total')
        );
        console.log(JSON.stringify(q, null, 4));
        const formatter = new SqlFormatter();
        const strSQL = formatter.formatSelect(q);
        console.log('SQL',strSQL);
        assert.equal(strSQL,'SELECT COUNT(id) AS total FROM UserBase');
        return done();
    });

    it('should use QueryExpression.where(name)', (done) => {
        const q = new QueryExpression().from('UserBase')
            .select('id', 'name', 'dateCreated')
            .where('name').equal('user1@example.com');
        console.log('QUERY', q);
        const formatter = new SqlFormatter();
        const strSQL = formatter.formatSelect(q);
        console.log('SQL',strSQL);

        return done();
    });

    it('should use QueryExpression.notEqual(name)', (done) => {
        const q = new QueryExpression().from('UserBase')
            .select('id', 'name')
            .where('name').notEqual('user1@example.com');
        console.log('QUERY', q);
        const formatter = new SqlFormatter();
        const strSQL = formatter.formatSelect(q);
        assert.isObject(q.$where);
        assert.isObject(q.$where.name);
        assert.equal(q.$where.name.$ne, 'user1@example.com');
        console.log('SQL',strSQL);
        return done();
    });

    it('should use QueryExpression.or(name)', (done) => {
        const q = new QueryExpression().from('UserBase')
            .select('id', 'name')
            .where('name').equal('user1@example.com')
            .or('name').equal('user2@example.com');
        console.log('QUERY', JSON.stringify(q, null, 2));
        const formatter = new SqlFormatter();
        const strSQL = formatter.formatSelect(q);
        assert.isObject(q.$where);
        assert.isArray(q.$where.$or);
        assert.equal(q.$where.$or[0].name, 'user1@example.com');
        assert.equal(q.$where.$or[1].name, 'user2@example.com');
        console.log('SQL',strSQL);
        return done();
    });

    it('should use QueryExpression.groupBy()', (done) => {
        const q = new QueryExpression().from('OrderBase')
            .select('id', 'name')
            .where('name').equal('user1@example.com')
            .or('name').equal('user2@example.com');
        console.log('QUERY', JSON.stringify(q, null, 2));
        const formatter = new SqlFormatter();
        const strSQL = formatter.formatSelect(q);
        assert.isObject(q.$where);
        assert.isArray(q.$where.$or);
        assert.equal(q.$where.$or[0].name, 'user1@example.com');
        assert.equal(q.$where.$or[1].name, 'user2@example.com');
        console.log('SQL',strSQL);
        return done();
    });

    it('should use QueryExpression.getYear()', (done) => {
        const q = new QueryExpression().from('OrderBase')
            .select('id', 'orderDate', 'product')
            .where('orderDate').getYear().equal(10);
        console.log('QUERY', JSON.stringify(q, null, 2));
        const formatter = new SqlFormatter();
        const strSQL = formatter.formatSelect(q);
        assert.isObject(q.$where);
        assert.isObject(q.$where.orderDate);
        assert.equal(q.$where.orderDate.$year, 10);
        console.log('SQL',strSQL);
        return done();
    });

});
