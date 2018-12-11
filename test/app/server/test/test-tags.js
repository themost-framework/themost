/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */

import {assert} from 'chai';
import path from 'path';
import {DefaultDataContext,DataConfiguration} from "@themost/data";

class TestDataContext extends DefaultDataContext {
    /**
     * @param {DataConfiguration=} configuration
     */
    constructor(configuration) {
        super();
        this.getConfiguration = ()=> configuration;
    }
}

describe('test data object tags', function() {

    /**
     * @type {TestDataContext}
     */
    let context;

    before((done) => {
        const config = new DataConfiguration(path.resolve(__dirname, "../config"));
        context = new TestDataContext(config);
        return done();
    });

    after((done) => {
        context.finalize(()=> {
            return done();
        });
    });

    it('should get tag mapping', async ()=> {
        let mapping = context.model('Product').inferMapping('tags');
        assert.isObject(mapping, 'Expected association mapping');
        assert.equal(mapping.associationType, 'junction');
        assert.equal(mapping.parentModel, 'Product');
        assert.equal(mapping.associationObjectField, 'object');
        assert.equal(mapping.associationValueField, 'value');
    });

    it('should get tags', async ()=> {
        let product = await context.model('Product').where('name').equal('Sony VAIO Flip 15').silent().getTypedItem();
        let tags = await product.property('tags').getItems();
        assert.isArray(tags);
    });

    it('should add tag', async ()=> {
        let product = await context.model('Product').where('name').equal('Sony VAIO Flip 15').silent().getTypedItem();
        await product.property('tags').silent().insert('Sony');
        let tags = await product.property('tags').silent().getItems();
        assert.isArray(tags);
    });

    it('should remove tag', async ()=> {
        let product = await context.model('Product').where('name').equal('Sony VAIO Flip 15').silent().getTypedItem();
        await product.property('tags').silent().insert('Sony', 'Vaio');
        await product.property('tags').silent().remove('Sony');
        let tags = await product.property('tags').silent().getItems();
        assert.isUndefined(tags.find( x=> x === 'Sony'));
    });

    it('should add multiple tags', async ()=> {
        let product = await context.model('Product').where('name').equal('Sony VAIO Flip 15').silent().getTypedItem();
        await product.property('tags').removeAll();
        await product.property('tags').silent().insert(['Sony', 'Laptop', 'Vaio', '15 inches']);
        let tags = await product.property('tags').silent().getItems();
        assert.equal(tags.length, 4);
    });

    it('should remove all tags', async ()=> {
        let product = await context.model('Product').where('name').equal('Sony VAIO Flip 15').silent().getTypedItem();
        await product.property('tags').silent().removeAll();
        let tags = await product.property('tags').silent().getItems();
        assert.equal(tags.length, 0);
    });



});