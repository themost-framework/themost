/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */

import {TraceUtils} from '../../modules/@themost/common/utils';
import util from 'util';
import {assert} from 'chai';
import {_} from 'lodash';
import Rx from 'rxjs';
import fs from 'fs';
import {PathUtils} from '../../modules/@themost/common/utils';

/**
 * @static
 * @name throw
 * @param {*} data
 * @returns {Observable}
 * @memberOf {Observable}
 */

describe('Common Tests', () => {

    it('should use PathUtils.join', function(done) {
        "use strict";
        assert.equal(PathUtils.join('config','models','/User.json'), 'config/models/User.json','Ivalid Path');
        assert.equal(PathUtils.join('config','models','../User.json'), 'config/User.json','Ivalid Path');
        return done();
    });

    it('should use observables', function(done) {
    const fn = function() {
            return Rx.Observable.bindCallback(fs.exists)('~/Downloads/index.html')
                .flatMap( exists => {
                    if (!exists) {
                        throw new ReferenceError('File does not exist');
                    }
                    return Rx.Observable.of('File exists');
                });
        };
        let source = fn();

        source.subscribe(res => {
            util.log(res);
            return done();
        }, err => {
            return done(err);
        });

    });

});