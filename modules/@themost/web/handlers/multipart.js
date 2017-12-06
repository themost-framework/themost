/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
var formidable = require('formidable');
var _ = require('lodash');

if (process.version>="v6.0.0") {
    var multipart_parser = require('formidable/lib/multipart_parser'),
        MultipartParser = multipart_parser.MultipartParser;
    MultipartParser.prototype.initWithBoundary = function(str) {
        this.boundary = new Buffer(str.length+4);
        this.boundary.write('\r\n--', 0, 4 , 'ascii');
        this.boundary.write(str, 4, str.length, 'ascii');
        this.lookbehind = new Buffer(this.boundary.length+8);
        this.state = multipart_parser.START;
        this.boundaryChars = {};
        for (var i = 0; i < this.boundary.length; i++) {
            this.boundaryChars[this.boundary[i]] = true;
        }
    };
}

function MultipartHandler() {

}

MultipartHandler.prototype.beginRequest = function(context, callback) {
    var request = context.request;
    request.headers = request.headers || {};
    var contentType = request.headers['content-type'];
    if (/^multipart\/form-data/i.test(contentType)) {
        //use formidable to parse request data
        var f = new formidable.IncomingForm(), web = require('../index');
        f.parse(request, function (err, form, files) {
            if (err) {
                callback(err);
                return;
            }
            try {
                //add form
                if (form) {
                    _.assign(context.params, web.common.parseForm(form));
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
};

if (typeof exports !== 'undefined') {
    module.exports.createInstance = function() { return  new MultipartHandler();  };
}