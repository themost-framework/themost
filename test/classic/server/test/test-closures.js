import * as acorn from 'acorn';
import {Args} from '@themost/common';
import {assert} from 'chai';
import _ from 'lodash';

class FunctionDeclarationNode {
    constructor() {

    }

}

class ExpressionNode {
    constructor() {
        //
    }
}

/**
 * @property {string} name
 */
class IdentifierNode extends ExpressionNode {

    /**
     * @param {*=} options
     * @returns {*}
     */
// eslint-disable-next-line no-unused-vars
    toString(options) {
        return this.name;
    }

}

/**
 * @class
 * @property {*} key
 * @property {*} value
 */
class PropertyExpressionNode extends ExpressionNode {
    /**
     * @param {*=} options
     * @returns {*}
     */
    toString(options) {
        //get key
        let key = this.key && (this.key.type === 'Identifier') && this.key.name;
        Args.notString(key,'Invalid property expression key');
        if (this.value && this.value.type === 'MemberExpression') {
            let res = MemberExpressionNode.prototype.toString.bind(this.value)(options);
            if (res !== key) {
                return _.template('${res} as ${key}')({
                    res: res,
                    key: key
                });
            }
            return res;
        }
        else {
            throw new TypeError('Invalid property expression value or its type is not implemented yet.');
        }
    }
}


/**
 * @class
 * @property {Array<*>} properties
 */
class ObjectExpressionNode extends ExpressionNode {
    /**
     * @param {*=} options
     * @returns {*}
     */
    toString(options) {
        if (this.properties && Array.isArray(this.properties)) {
            let res = this.properties.map((x)=> {
                return PropertyExpressionNode.prototype.toString.bind(x)(options);
            });
            return res.join(',');
        }
        throw new Error('Invalid object expression properties. Expected array')
    }
}

/**
 * @class
 * @property {*} object
 * @property {*} property
 */
class MemberExpressionNode extends ExpressionNode {

    /**
     * @param {*=} options
     * @returns {*}
     */
    toString(options) {
        let res = "";
        if (this.object && this.object.type === 'Identifier') {
            if (options && Array.isArray(options.params)) {
                let index = options.params.findIndex((x)=> {
                    return x.name === this.object.name;
                });
                if (index>=0) {
                    return this.property && this.property.type === 'Identifier' && IdentifierNode.prototype.toString.bind(this.property)(options);
                }
            }
            res += IdentifierNode.prototype.toString.bind(this.object)(options) + "/";
        }
        else if (this.object && this.object.type === 'MemberExpression') {
            res += MemberExpressionNode.prototype.toString.bind(this.object)(options) + "/";
        }
        if (this.property && this.property.type === 'Identifier') {
            res += IdentifierNode.prototype.toString.bind(this.property)(options);
        }
        return res;
    }

}

class MethodExpressionNode extends ExpressionNode {

    /**
     * @param {*} options
     * @param {*} expr
     * @param {*=} args
     */
// eslint-disable-next-line no-unused-vars
    static getDate(options, expr, args) {
        return _.template('date(${member})')({
            member: MemberExpressionNode.prototype.toString.bind(expr)(options)
        });
    }
    /**
     * @param {*} options
     * @param {*} expr
     * @param {*=} args
     */
// eslint-disable-next-line no-unused-vars
    static getDay(options, expr, args) {
        return _.template('day(${member})')({
            member: MemberExpressionNode.prototype.toString.bind(expr)(options)
        });
    }
    /**
     * @param {*} options
     * @param {*} expr
     * @param {*=} args
     */
// eslint-disable-next-line no-unused-vars
    static getMonth(options, expr, args) {
        return _.template('month(${member})')({
            member: MemberExpressionNode.prototype.toString.bind(expr)(options)
        });
    }
    /**
     * @param {*} options
     * @param {*} expr
     * @param {*=} args
     */
// eslint-disable-next-line no-unused-vars
    static getFullYear(options, expr, args) {
        return _.template('year(${member})')({
            member: MemberExpressionNode.prototype.toString.bind(expr)(options)
        });
    }
    /**
     * @param {*} options
     * @param {*} expr
     * @param {*=} args
     */
// eslint-disable-next-line no-unused-vars
    static getHours(options, expr, args) {
        return _.template('hour(${member})')({
            member: MemberExpressionNode.prototype.toString.bind(expr)(options)
        });
    }
    /**
     * @param {*} options
     * @param {*} expr
     * @param {*=} args
     */
// eslint-disable-next-line no-unused-vars
    static getMinutes(options, expr, args) {
        return _.template('minute(${member})')({
            member: MemberExpressionNode.prototype.toString.bind(expr)(options)
        });
    }
    /**
     * @param {*} options
     * @param {*} expr
     * @param {*=} args
     */
// eslint-disable-next-line no-unused-vars
    static getSeconds(options, expr, args) {
        return _.template('second(${member})')({
            member: MemberExpressionNode.prototype.toString.bind(expr)(options)
        });
    }
    /**
     * @param {*} options
     * @param {*} expr
     * @param {*=} args
     */
// eslint-disable-next-line no-unused-vars
    static toLowerCase(options, expr, args) {
        return _.template('tolower(${member})')({
            member: MemberExpressionNode.prototype.toString.bind(expr)(options)
        });
    }
    /**
     * @param {*} options
     * @param {*} expr
     * @param {*=} args
     */
// eslint-disable-next-line no-unused-vars
    static toLocaleLowerCase(options, expr, args) {
        return _.template('tolower(${member})')({
            member: MemberExpressionNode.prototype.toString.bind(expr)(options)
        });
    }
    /**
     * @param {*} options
     * @param {*} expr
     * @param {*=} args
     */
// eslint-disable-next-line no-unused-vars
    static toUpperCase(options, expr, args) {
        return _.template('toupper(${member})')({
            member: MemberExpressionNode.prototype.toString.bind(expr)(options)
        });
    }
    /**
     * @param {*} options
     * @param {*} expr
     * @param {*=} args
     */
// eslint-disable-next-line no-unused-vars
    static toLocaleUpperCase(options, expr, args) {
        return _.template('toupper(${member})')({
            member: MemberExpressionNode.prototype.toString.bind(expr)(options)
        });
    }
    /**
     * @param {*} options
     * @param {*} expr
     * @param {*=} args
     */
// eslint-disable-next-line no-unused-vars
    static startsWith(options, expr, args) {
        return _.template('startswith(${member},${args[0]})')({
            member: MemberExpressionNode.prototype.toString.bind(expr)(options)
        });
    }
    /**
     * @param {*} options
     * @param {*} expr
     * @param {*=} args
     */
// eslint-disable-next-line no-unused-vars
    static endsWith(options, expr, args) {
        return _.template('endswith(${member},${args[0]})')({
            member: MemberExpressionNode.prototype.toString.bind(expr)(options)
        });
    }
    /**
     * @param {*} options
     * @param {*} expr
     * @param {*=} args
     */
// eslint-disable-next-line no-unused-vars
    static indexOf(options, expr, args) {
        return _.template('indexof(${member},${args[0]})')({
            member: MemberExpressionNode.prototype.toString.bind(expr)(options)
        });
    }
}

/**
 * @property {*} callee
 */
class CallExpressionNode extends ExpressionNode {
    /**
     * @param {*=} options
     * @returns {*}
     */
    toString(options) {
        //get callee property name
        Args.check(this.callee && this.callee.type === 'MemberExpression', 'Invalid call expression type. Expected a valid member expression');
        Args.check(this.callee.property && this.callee.property.name, 'Invalid call expression. Expected a valid call expression name');
        if (MethodExpressionNode.hasOwnProperty(this.callee.property.name)) {
            return MethodExpressionNode[this.callee.property.name](options, this.callee.object, this.callee.arguments);
        }
        else {
            throw new TypeError('Invalid or unsupported method expression');
        }
    }


}



/**
 * @class
 * @property {*} argument
 * @property {} parent
 */
class ReturnStatementNode extends ExpressionNode {

    /**
     * @param {*=} options
     * @returns {*}
     */
    toString(options) {
        if (this.argument && this.argument.type === 'MemberExpression') {
           return MemberExpressionNode.prototype.toString.bind(this.argument)(options);
        }
        else if (this.argument && this.argument.type === 'ObjectExpression') {
            return ObjectExpressionNode.prototype.toString.bind(this.argument)(options);
        }
        else if (this.argument && this.argument.type === 'CallExpression') {
            return CallExpressionNode.prototype.toString.bind(this.argument)(options);
        }
        else if (this.argument && this.argument.type === 'ArrayExpression') {
            return this.argument.elements.map((x)=> {
                return MemberExpressionNode.prototype.toString.bind(x)(options);
            }).join(',');
        }
        else {
            throw new TypeError('Unsupported expression type')
        }
    }
}

class SelectFunctionDeclarationNode extends FunctionDeclarationNode  {

    /**
     * @param {*=} options
     * @returns {*}
     */
    toString(options) {

        //check block statement
        Args.check(this.body && this.body.type === 'BlockStatement','Invalid declaration body');
        //validate return statement
        Args.notNull(this.body.body &&  this.body.body[0], 'Return statement');

        return ReturnStatementNode.prototype.toString.bind(this.body.body[0])(options);

    }

}

class MemberSelectClosure {
    /**

     *
     */

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
            script = script.replace(/^function(\s+)\(/, 'function closure(');
        }
        let expr = acorn.parse(script);
        console.log('INFO','Expression', JSON.stringify(expr, null, 4));
        //get function declaration

        Args.check(Array.isArray(expr.body),'Invalid expression body');

        Args.check(expr.body[0] && expr.body[0].type === 'FunctionDeclaration','Invalid function declaration.');

        return SelectFunctionDeclarationNode.prototype.toString.bind(expr.body[0])({
            "params": expr.body[0].params
        });

    }



}

describe('test query closures', ()=> {

    it('should get a map select expression', (done)=> {
        let str = MemberSelectClosure.parse(x => {
            return {
                id: x.id,
                createdAt: x.dateCreated
            }
        });
        assert.equal(str,'id,dateCreated as createdAt');
        return done();
    });

    it('should get a single attribute select expression', (done)=> {
        let str = MemberSelectClosure.parse(x => x.id);
        assert.equal(str,'id');
        return done();
    });

    it('should get a single attribute select expression with call method', (done)=> {
        let str = MemberSelectClosure.parse(x => x.dateCreated.getDate());
        assert.equal(str,'date(dateCreated)');
        return done();
    });

    it('should get a multiple attributes select expression', (done)=> {
        let str = MemberSelectClosure.parse(x => [
            x.id,
            x.name,
            x.dateCreated
        ]);
        assert.equal(str,'id,name,dateCreated');
        return done();
    });

    it('should get a multiple attributes (and nested attributes) select expression', (done)=> {
        let str = MemberSelectClosure.parse(x => [
            x.id,
            x.name,
            x.homeLocation.telephone,
            x.dateCreated

        ]);
        assert.equal(str,'id,name,homeLocation/telephone,dateCreated');
        return done();
    });

});