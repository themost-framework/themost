/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';
import formidable from 'formidable';
import {_} from 'lodash';
import {LangUtils} from '@themost/common/utils';

if (process.version>="v6.0.0") {
    const multipart_parser = require('formidable/lib/multipart_parser'), MultipartParser = multipart_parser.MultipartParser;
    MultipartParser.prototype.initWithBoundary = function(str) {
        this.boundary = new Buffer(str.length+4);
        this.boundary.write('\r\n--', 0, 4 , 'ascii');
        this.boundary.write(str, 4, str.length, 'ascii');
        this.lookbehind = new Buffer(this.boundary.length+8);
        this.state = multipart_parser.START;
        this.boundaryChars = {};
        for (let i = 0; i < this.boundary.length; i++) {
            this.boundaryChars[this.boundary[i]] = true;
        }
    };
}
/**
 * @class
 * @augments HttpHandler
 */
export default class MultipartHandler {
    /**
     *
     * @param {HttpContext} context
     * @param {Function} callback
     */
    beginRequest(context, callback) {
        const request = context.request;
        request.headers = request.headers || {};
        const contentType = request.headers['content-type'];
        if (/^multipart\/form-data/i.test(contentType)) {
            //use formidable to parse request data
            const f = new formidable.IncomingForm();
            f.parse(request, function (err, form, files) {
                if (err) {
                    callback(err);
                    return;
                }
                try {
                    //add form
                    if (form) {
                        _.assign(context.params, LangUtils.parseForm(form));
                    }
                    //add files
                    if (files)
                        _.assign(context.params, files);
                    callback();
                }
                catch (e) {
                    callback(e);
                }
            });
        }
        else {
            callback();
        }
    }
}
