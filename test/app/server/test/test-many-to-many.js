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

describe('test many-to-many associations', function() {

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

    it('should get mapping', async ()=> {
        let mapping = context.model('Person').inferMapping('favouriteProducts');
        assert.isObject(mapping, 'Expected association mapping');
        assert.equal(mapping.associationType, 'junction');
        assert.equal(mapping.parentModel, 'Person');
    });

    it('should get many-to-many data', async ()=> {
        let person = await context.model('Person').where('email').equal('lydia.byrne@example.com').silent().getTypedItem();
        let products = await person.property('favouriteProducts').getItems();
        assert.isArray(products);
    });

    it('should add relationship', async ()=> {
        let person = await context.model('Person').where('email').equal('lydia.byrne@example.com').silent().getTypedItem();
        let product = await context.model('Product').where('category').equal('Laptops').silent().getTypedItem();
        /**
         * @type {DataObjectJunction|*}
         */
        let favouriteProductsProperty = person.property('favouriteProducts');
        // insert favourite product
        await favouriteProductsProperty.silent().insert(product);
        // get favourite products
        let products = await favouriteProductsProperty.silent().getItems();
        assert.isAtLeast(products.length, 1);
        assert.isObject(products.find( x=> x.id === product.id));
    });

    it('should remove relationship', async ()=> {
        let person = await context.model('Person').where('email').equal('lydia.byrne@example.com').silent().getTypedItem();
        let product = await context.model('Product').where('category').equal('Laptops').silent().getTypedItem();
        /**
         * @type {DataObjectJunction|*}
         */
        let favouriteProductsProperty = person.property('favouriteProducts');
        // insert favourite product
        await favouriteProductsProperty.silent().insert(product);
        // remove favourite product
        await favouriteProductsProperty.silent().remove(product);
        // get favourite products
        let products = await favouriteProductsProperty.silent().getItems();

        assert.isUndefined(products.find( x=> x.id === product.id));

    });

    it('should remove all relationships', async ()=> {
        let person = await context.model('Person').where('email').equal('lydia.byrne@example.com').silent().getTypedItem();
        let insertProducts = await context.model('Product').where('category').equal('Laptops').silent().take(2).getItems();
        /**
         * @type {DataObjectJunction|*}
         */
        let favouriteProductsProperty = person.property('favouriteProducts');
        // insert favourite product
        await favouriteProductsProperty.silent().insert(insertProducts);
        // get favourite products
        let products = await favouriteProductsProperty.silent().getItems();
        // remove favourite product
        await favouriteProductsProperty.silent().removeAll();
        // get favourite products
        products = await favouriteProductsProperty.silent().getItems();
        // validate length
        assert.equal(products.length, 0);

    });

    it('should get mapping (child)', async ()=> {
        let mapping = context.model('Product').inferMapping('followers');
        assert.isObject(mapping, 'Expected association mapping');
        assert.equal(mapping.associationType, 'junction');
        assert.equal(mapping.childModel, 'Product');
    });

    it('should add relationship (child)', async ()=> {
        // Sony VAIO Flip 15
        let person = await context.model('Person').where('email').equal('lydia.byrne@example.com').silent().getTypedItem();
        let product = await context.model('Product').where('name').equal('Sony VAIO Flip 15').silent().getTypedItem();
        // insert favourite product
        await product.property('followers').silent().insert(person);
        // get favourite products
        let followers = await product.property('followers').silent().getItems();
        assert.isAtLeast(followers.length, 1);
        assert.isObject(followers.find( x=> x.id === person.id));
    });

    it('should remove relationship (child)', async ()=> {
        let person = await context.model('Person').where('email').equal('lydia.byrne@example.com').silent().getTypedItem();
        let product = await context.model('Product').where('name').equal('Sony VAIO Flip 15').silent().getTypedItem();
        // insert favourite product
        await product.property('followers').silent().insert(person);
        // remove favourite product
        await product.property('followers').silent().remove(person);
        // get favourite products
        let followers = await product.property('followers').silent().getItems();

        assert.isUndefined(followers.find( x=> x.id === person.id));
    });

});