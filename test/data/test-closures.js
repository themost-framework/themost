/* eslint-disable no-console */
import esprima from 'esprima';
import * as acorn from 'acorn';
import {Args} from '@themost/common';

class MemberSelectClosure {
    /**
     * @param {Function} closure
     * @returns {string}
     */
    static parse(closure) {
        if (typeof closure !== 'function') {
            throw 'Member selector must be a closure';
        }
        let script = closure.toString();
        if (closure.name.length === 0) {
            script = script.replace(/function(\s+)\(/,'function closure(');
        }
        let expr = esprima.parse(script);
        //validate closure parameters
        /**
         * e.g.
         * "params": [
         *      {
         *      "type": "Identifier",
         *      "name": "x"
         *      }
         * ]
         */
        let body = expr.body[0];
        Args.check(Array.isArray(body.params) && body.params.length===1,'Invalid closure parameters. Expected one.');
        //get parameter name
        let param = body.params[0].name;
        //get block statement
        let blockStatement = body.body;
        Args.check(blockStatement && blockStatement.type === 'BlockStatement', 'Invalid closure body. Expected block statement');
        //get return statement
        let returnStatement = blockStatement.body && blockStatement.body[0];
        Args.check(returnStatement && returnStatement.type === 'ReturnStatement', 'Invalid block statement. Expected return');
        //validate return statement format
        //e.g.
        // {
        //     "type": "ReturnStatement",
        //     "start": 31,
        //     "end": 45,
        //     "argument": {
        //     "type": "MemberExpression",
        //         "start": 38,
        //         "end": 44,
        //         "object": {
        //         "type": "Identifier",
        //             "start": 38,
        //             "end": 39,
        //             "name": "x"
        //     },
        //     "property": {
        //         "type": "Identifier",
        //             "start": 40,
        //             "end": 44,
        //             "name": "name"
        //     },
        //     "computed": false
        // }
        // }

        return param;
    }
}

describe('test closures', ()=> {
    it('should parse closure with acorn', (done)=> {
        let closure = x => x.name;
        console.log('INFO', JSON.stringify(acorn.parse(function func(x) {
            return x.name;
        }), null, 4));
        return done();
    });
    it('should parse a simple closure', (done)=> {
        let selectExpr = MemberSelectClosure.parse(x => x.name.length );
        console.log('INFO', selectExpr);
        return done();
    });
});