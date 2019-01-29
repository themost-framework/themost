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
var semver = require('semver');
var LangUtils = require('@themost/common/utils').LangUtils;

if (semver.gte(process.versions.node, "6.0.0")) {
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

/**
 * @class
 * @constructor
 * @implements BeginRequestHandler
 */
function MultipartHandler() {

}

MultipartHandler.prototype.beginRequest = function(context, callback) {
    var request = context.request;
    request.headers = request.headers || {};
    var contentType = request.headers['content-type'];
    if (/^multipart\/form-data/i.test(contentType)) {
        //use formidable to parse request data
        var f = new formidable.IncomingForm();
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
                if (files) {
                    _.forEach(_.keys(files),function(key) {
                        if (context.params.hasOwnProperty(key)) {
                            _.assign(context.params[key], files[key]);
                        }
                        else {
                            context.params[key] = files[key];
                        }
                    });

                }
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
    module.exports.MultipartHandler = MultipartHandler;
    module.exports.createInstance = function() { return  new MultipartHandler();  };
}
