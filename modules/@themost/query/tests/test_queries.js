var assert = require("chai").assert;
var QueryExpression = require('./../query').QueryExpression;
var ProjectionQueryExpression = require('./../query').ProjectionQueryExpression;
var QueryField = require('./../query').QueryField;
var SqlFormatter  = require('./../formatter').SqlFormatter;
describe("test queryes", function() {

    it("should create new query", function(done) {

        var q = new QueryExpression();
        q.from('BorrowerData').select([QueryField.count('id').as('total')]).where('graduationYear').notEqual(null).groupBy(['graduationYear']);
        var aq = new QueryExpression();
        aq.from(q);
        aq.select([QueryField.count('total').as('total')]);
        console.log(JSON.stringify(aq,null,4));
        var formatter = new SqlFormatter();
        var s = formatter.format(aq);
        console.log(s);
        return done();

    });

});