/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */

import {TraceUtils} from '../../modules/@themost/common/index';
import util from 'util';
import {assert} from 'chai';
import Rx from 'rx';
import fs from 'fs';


describe('Common Tests', () => {

    it('should use trace utils', function(done) {
        TraceUtils.info('test message %s.', 'my string');
        TraceUtils.error(new Error('Operation was cancelled by the user'));
        return done();
    });

    it('should use observables', function(done) {

        const fn = function() {
            return Rx.Observable.fromCallback(fs.exists)('~/Downloads/index.html')
                .flatMap( exists => {
                    return exists ? Rx.Observable.return('File exists') : Rx.Observable.return('File does not exist');
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