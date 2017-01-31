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

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AttachmentFileSystemStorage = exports.FileSystemStorage = exports.FileStorage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _errors = require('@themost/common/errors');

var _utils = require('@themost/common/utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @classdesc An abstract class that describes a file storage.
 * @class
 * @property {string} root - Gets or sets a string that represents the physical root path of this file storage
 * @property {string} virtualPath - Gets or sets a string that represents the virtual path of this file storage
 */
var FileStorage = exports.FileStorage = function () {

    /**
     * @constructor
     */
    function FileStorage() {
        _classCallCheck(this, FileStorage);

        if (new.target === FileStorage) {
            throw new TypeError("Cannot construct abstract instances directly");
        }
    }

    /**
     * @param {HttpContext} context
     * @param {string} src
     * @param {*} attrs
     * @param {Function} callback
     */


    _createClass(FileStorage, [{
        key: 'copyFrom',
        value: function copyFrom(context, src, attrs, callback) {
            callback = callback || function () {};
            callback();
        }

        /**
         * @param {HttpContext} context
         * @param {*} item
         * @param {string} destination
         * @param {Function} callback
         */

    }, {
        key: 'copyTo',
        value: function copyTo(context, item, destination, callback) {
            callback = callback || function () {};
            callback();
        }

        /**
         * @param {HttpContext} context
         * @param {*} item
         * @param {Function} callback
         */

    }, {
        key: 'resolvePhysicalPath',
        value: function resolvePhysicalPath(context, item, callback) {
            callback = callback || function () {};
            callback();
        }

        /**
         * @param {HttpContext} context
         * @param {*} item
         * @param {Function} callback
         */

    }, {
        key: 'resolveUrl',
        value: function resolveUrl(context, item, callback) {
            callback = callback || function () {};
            callback();
        }

        /**
         * @param {HttpContext} context
         * @param {*} item
         * @param {Function} callback
         */

    }, {
        key: 'createReadStream',
        value: function createReadStream(context, item, callback) {
            callback = callback || function () {};
            callback();
        }

        /**
         * @param {Function} callback
         */

    }, {
        key: 'init',
        value: function init(callback) {
            callback = callback || function () {};
            callback();
        }

        /**
         * @param {HttpContext} context
         * @param {*} query
         * @param {Function} callback
         */

    }, {
        key: 'find',
        value: function find(context, query, callback) {
            callback = callback || function () {};
            callback();
        }

        /**
         * @param {HttpContext} context
         * @param {*} query
         * @param {Function} callback
         */

    }, {
        key: 'findOne',
        value: function findOne(context, query, callback) {
            callback = callback || function () {};
            callback();
        }

        /**
         * @param {HttpContext} context
         * @param {*} item
         * @param {Function} callback
         */

    }, {
        key: 'remove',
        value: function remove(context, item, callback) {
            callback = callback || function () {};
            callback();
        }

        /**
         * @param {HttpContext} context
         * @param {*} item
         * @param {Function} callback
         */

    }, {
        key: 'exists',
        value: function exists(context, item, callback) {
            callback = callback || function () {};
            callback(false);
        }
    }]);

    return FileStorage;
}();

/**
 * @classdesc FileSystemStorage class describes a file storage on local file system.
 * @class
 * @constructor
 * @augments FileStorage
 * @deprecated
 * @ignore
 */


var FileSystemStorage = exports.FileSystemStorage = function (_FileStorage) {
    _inherits(FileSystemStorage, _FileStorage);

    /**
     * @constructor
     * @param {string} physicalPath - The root directory of this storage
     */
    function FileSystemStorage(physicalPath) {
        _classCallCheck(this, FileSystemStorage);

        var _this = _possibleConstructorReturn(this, (FileSystemStorage.__proto__ || Object.getPrototypeOf(FileSystemStorage)).call(this));

        _this.root = physicalPath;
        _this.virtualPath = null;
        _this.ensure = function (callback) {
            var self = this;
            callback = callback || function () {};
            if (self._initialized) {
                callback();
                return;
            }
            if (typeof self.root === 'undefined' || self.root == null) {
                callback(new Error('The file system storage root directory cannot be empty at this context.'));
            } else {
                //check directory existence
                _fs2.default.exists(self.root, function (exists) {
                    if (exists) {
                        self._initialized = true;
                        callback();
                    } else {
                        _fs2.default.mkdir(self.root, function (err) {
                            if (err) {
                                _utils.TraceUtils.log(err);
                                callback(new Error('An error occured while trying to initialize file system storage.'));
                            } else {
                                var Db = require('tingodb')().Db,
                                    db = new Db(self.root, { nativeObjectID: true });
                                //Fetch a collection to insert document into
                                var collection = db.collection("fs");
                                db.close(function () {
                                    //initialization was completed, so exit with no error
                                    self._initialized = true;
                                    callback();
                                });
                            }
                        });
                    }
                });
            }
        };

        _this.execute = function (fn, callback) {
            fn = fn || function () {};
            try {
                (function () {
                    var Db = require('tingodb')().Db,
                        db = new Db(physicalPath, { nativeObjectID: true });
                    fn(db, function (err, result) {
                        db.close(function () {
                            callback(err, result);
                        });
                    });
                })();
            } catch (e) {
                callback(e);
            }
        };

        return _this;
    }

    /**
     * @param {HttpContext} context
     * @param {*} item
     * @param {function} callback
     */


    _createClass(FileSystemStorage, [{
        key: 'save',
        value: function save(context, item, callback) {
            var self = this;
            if (_lodash._.isNil(item)) {
                callback();
                return;
            }
            self.execute(function (db, cb) {
                //file default version
                item.version = item.version || 1;
                //file status (0) temporary
                item.status = item.status || 0;
                //file date created (on storage)
                item.dateCreated = new Date();
                //file date modified (on storage)
                item.dateModified = new Date();
                //get collection
                var collection = db.collection('fs');
                //save
                var state = 2;
                if (_lodash._.isNil(item._id)) {
                    state = 1;
                    item.oid = _utils.RandomUtils.randomChars(12);
                }
                collection.save(item, function (err) {
                    cb(err);
                });
            }, function (err) {
                callback(err);
            });
        }

        /**
         * @param {HttpContext} context
         * @param {*} query
         * @param {Function} callback
         */

    }, {
        key: 'findOne',
        value: function findOne(context, query, callback) {
            var self = this;
            if (_lodash._.isNil(query)) {
                callback();
                return;
            }
            self.ensure(function () {
                self.execute(function (db, cb) {
                    //get collection
                    var collection = db.collection('fs');
                    if (query._id) {
                        collection.findOne({ _id: query._id }, function (err, result) {
                            cb(err, result);
                        });
                    } else {
                        collection.findOne(query, function (err, result) {
                            cb(err, result);
                        });
                    }
                }, function (err, result) {
                    callback(err, result);
                });
            });
        }

        /**
         * @param {HttpContext} context
         * @param {*} item
         * @param {Function} callback
         */

    }, {
        key: 'resolvePhysicalPath',
        value: function resolvePhysicalPath(context, item, callback) {
            var _id = item._id;
            var self = this;
            var file_id = void 0;
            if (_id) {
                file_id = _utils.TextUtils.toBase26(_id);
                callback(null, _path2.default.join(self.root, file_id.substr(0, 1), file_id));
            } else {
                self.findOne(context, item, function (err, result) {
                    if (err) {
                        callback(err);
                    } else {
                        if (_lodash._.isNil(result)) {
                            callback(new Error('Item cannot be found'));
                        } else {
                            file_id = _utils.TextUtils.toBase26(result._id);
                            callback(null, _path2.default.join(self.root, file_id.substr(0, 1), file_id));
                        }
                    }
                });
            }
        }

        /**
         * @param {HttpContext} context
         * @param {*} item
         * @param {Function} callback
         */

    }, {
        key: 'resolveUrl',
        value: function resolveUrl(context, item, callback) {
            var oid = item.oid,
                self = this;
            if (oid) {
                callback(null, _util2.default.format(self.virtualPath, oid));
            } else {
                self.findOne(context, item, function (err, result) {
                    if (err) {
                        callback(err);
                    } else {
                        if (_lodash._.isNil(result)) {
                            callback(new Error('Item cannot be found'));
                        } else {
                            callback(null, _util2.default.format(self.virtualPath, result.oid));
                        }
                    }
                });
            }
        }

        /**
         * @param {HttpContext} context
         * @param {*} item
         * @param {Function} callback
         */

    }, {
        key: 'createReadStream',
        value: function createReadStream(context, item, callback) {
            var self = this;
            var filePath = void 0;
            self.findOne(context, item, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    if (_lodash._.isNil(result)) {
                        callback(new Error('Item cannot be found'));
                    } else {
                        //get file id
                        var file_id = _utils.TextUtils.toBase26(result._id);
                        //create file path
                        filePath = _path2.default.join(self.root, file_id.substr(0, 1), file_id);
                        //check file
                        _fs2.default.exists(filePath, function (exists) {
                            if (!exists) {
                                callback(new _errors.FileNotFoundError());
                            } else {
                                callback(null, _fs2.default.createReadStream(filePath));
                            }
                        });
                    }
                }
            });
        }

        /***
         * @param {HttpContext} context
         * @param {*} item
         * @param {function(Boolean)} callback
         */

    }, {
        key: 'exists',
        value: function exists(context, item, callback) {
            callback = callback || function () {};
            this.findOne(context, item, function (err, result) {
                if (err) {
                    _utils.TraceUtils.log(err);
                    callback(false);
                } else {
                    callback(!_lodash._.isNil(result));
                }
            });
        }

        /**
         * @param {HttpContext} context
         * @param {*} query
         * @param {Function} callback
         */

    }, {
        key: 'find',
        value: function find(context, query, callback) {
            var self = this;
            if (_lodash._.isNil(query)) {
                callback();
                return;
            }
            self.ensure(function () {
                self.execute(function (db, cb) {
                    //get collection
                    var collection = db.collection('fs');
                    collection.find(query, function (err, result) {
                        cb(err, result);
                    });
                }, function (err, result) {
                    callback(err, result);
                });
            });
        }

        /**
         * @param {Function} callback
         */

    }, {
        key: 'init',
        value: function init(callback) {
            this.ensure(function (err) {
                callback(err);
            });
        }

        /**
         * @param {HttpContext} context
         * @param {string} src
         * @param {*} attrs
         * @param {Function} callback
         */

    }, {
        key: 'copyFrom',
        value: function copyFrom(context, src, attrs, callback) {
            var self = this;
            callback = callback || function () {};
            self.ensure(function (err) {
                if (err) {
                    callback(err);
                } else {
                    var filename = _path2.default.basename(src);
                    attrs = attrs || {};
                    //set file composition name
                    attrs.filename = attrs.filename || filename;
                    //check source file
                    _fs2.default.exists(src, function (exists) {
                        if (!exists) {
                            callback(new Error('The source file cannot be found'));
                        } else {
                            //save attributes
                            //insert item attributes
                            self.save(context, attrs, function (err) {
                                if (err) {
                                    callback(err);
                                } else {
                                    (function () {
                                        //file operation (save to folder)
                                        var file = _utils.TextUtils.toBase26(attrs._id);
                                        _fs2.default.exists(_path2.default.join(self.root, file.substr(0, 1)), function (exists) {
                                            if (exists) {
                                                copyFile(src, _path2.default.join(self.root, file.substr(0, 1), file), function (err) {
                                                    callback(err);
                                                });
                                            } else {
                                                _fs2.default.mkdir(_path2.default.join(self.root, file.substr(0, 1)), function (err) {
                                                    if (err) {
                                                        callback(err);
                                                    } else {
                                                        copyFile(src, _path2.default.join(self.root, file.substr(0, 1), file), function (err) {
                                                            callback(err);
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    })();
                                }
                            });
                        }
                    });
                }
            });
        }

        /**
         * @param {HttpContext} context
         * @param {string|*} item
         * @param {string} dest
         * @param {Function} callback
         */

    }, {
        key: 'copyTo',
        value: function copyTo(context, item, dest, callback) {
            var self = this;
            callback = callback || function () {};
            if (_lodash._.isNil(item)) {
                callback(new Error('The source item cannot be empty at this context'));
                self.findOne(context, item, function (err, result) {
                    if (err) {
                        callback(err);
                    } else {
                        if (_lodash._.isNil(result)) {
                            callback(new Error('The source item cannot be found.'));
                        } else {
                            (function () {
                                var file = _utils.TextUtils.toBase26(result._id),
                                    src = _path2.default.join(self.root, file.substr(0, 1), file);
                                _fs2.default.exists(src, function (exists) {
                                    if (!exists) {
                                        callback(new Error('The source file cannot be found.'));
                                    } else {
                                        (function () {
                                            var destFile = _path2.default.join(dest, result.filename);
                                            copyFile(src, destFile, function (err) {
                                                callback(err, destFile);
                                            });
                                        })();
                                    }
                                });
                            })();
                        }
                    }
                });
            }
        }
    }]);

    return FileSystemStorage;
}(FileStorage);

/**
 * @classdesc AttachmentFileSystemStorage class describes a file storage for attachments' management on local file system.
 * @class
 * @constructor
 * @augments FileStorage
 */


var AttachmentFileSystemStorage = exports.AttachmentFileSystemStorage = function (_FileStorage2) {
    _inherits(AttachmentFileSystemStorage, _FileStorage2);

    /**
     * @constructor
     * @param {string} physicalPath - The root directory of this storage
     */
    function AttachmentFileSystemStorage(physicalPath) {
        _classCallCheck(this, AttachmentFileSystemStorage);

        var _this2 = _possibleConstructorReturn(this, (AttachmentFileSystemStorage.__proto__ || Object.getPrototypeOf(AttachmentFileSystemStorage)).call(this));

        _this2.root = physicalPath;
        _this2.virtualPath = null;
        _this2.ensure = function (callback) {
            var self = this;
            callback = callback || function () {};
            if (self._initialized) {
                callback();
                return;
            }
            if (_lodash._.isNil(self.root)) {
                callback(new Error('The file system storage root directory cannot be empty at this context.'));
            } else {
                //check directory existence
                _fs2.default.exists(self.root, function (exists) {
                    if (exists) {
                        self._initialized = true;
                        callback();
                    } else {
                        _fs2.default.mkdir(self.root, function (err) {
                            if (err) {
                                _utils.TraceUtils.log(err);
                                callback(new Error('An error occured while trying to initialize file system storage.'));
                            } else {
                                self._initialized = true;
                                callback();
                            }
                        });
                    }
                });
            }
        };
        return _this2;
    }

    /**
     * @param {HttpContext} context
     * @param {*} item
     * @param {function} callback
     */


    _createClass(AttachmentFileSystemStorage, [{
        key: 'save',
        value: function save(context, item, callback) {
            var self = this;
            self.ensure(function (err) {
                if (err) {
                    callback(err);
                } else {
                    if (_lodash._.isNil(item)) {
                        callback();
                        return;
                    }
                    var attachments = context.model('Attachment');
                    if (_lodash._.isNil(attachments)) {
                        callback(new Error('Attachment model cannot be found.'));
                    }
                    //file default version
                    item.version = item.version || 1;
                    //file status (false) not published
                    item.published = item.published || false;
                    //set oid explicitly
                    item.oid = _utils.RandomUtils.randomChars(12);
                    //set url
                    item.url = _util2.default.format(self.virtualPath, item.oid);
                    //save attachment
                    attachments.save(item, function (err) {
                        callback(err);
                    });
                }
            });
        }

        /**
         * @param {HttpContext} context
         * @param {*} query
         * @param {Function} callback
         */

    }, {
        key: 'findOne',
        value: function findOne(context, query, callback) {
            var self = this;
            self.ensure(function (err) {
                if (err) {
                    callback(err);
                } else {
                    if (_lodash._.isNil(query)) {
                        callback();
                        return;
                    }
                    var attachments = context.model('Attachment');
                    if (_lodash._.isNil(attachments)) {
                        callback(new Error('Attachment model cannot be found.'));
                    }
                    attachments.find(query).first(callback);
                }
            });
        }

        /**
         *
         * @param {HttpContext} context
         * @param {*} item
         * @param {Function} callback
         */

    }, {
        key: 'resolvePhysicalPath',
        value: function resolvePhysicalPath(context, item, callback) {
            var id = item.id;
            var self = this;
            var file_id = void 0;
            if (id) {
                file_id = _utils.TextUtils.toBase26(id);
                callback(null, _path2.default.join(self.root, file_id.substr(0, 1), file_id));
            } else {
                self.findOne(context, item, function (err, result) {
                    if (err) {
                        callback(err);
                    } else {
                        if (_lodash._.isNil(result)) {
                            callback(new Error('Item cannot be found'));
                        } else {
                            file_id = _utils.TextUtils.toBase26(result.id);
                            callback(null, _path2.default.join(self.root, file_id.substr(0, 1), file_id));
                        }
                    }
                });
            }
        }

        /**
         *
         * @param {HttpContext} context
         * @param {*} item
         * @param {Function} callback
         */

    }, {
        key: 'resolveUrl',
        value: function resolveUrl(context, item, callback) {
            var oid = item.oid,
                self = this;
            if (oid) {
                callback(null, _util2.default.format(self.virtualPath, oid));
            } else {
                self.findOne(context, item, function (err, result) {
                    if (err) {
                        callback(err);
                    } else {
                        if (_lodash._.isNil(result)) {
                            callback(new Error('Item cannot be found'));
                        } else {
                            callback(null, _util2.default.format(self.virtualPath, item.oid));
                        }
                    }
                });
            }
        }

        /**
         * @param {HttpContext} context
         * @param {*} item
         * @param {Function} callback
         */

    }, {
        key: 'createReadStream',
        value: function createReadStream(context, item, callback) {
            var self = this;
            var filePath = void 0;
            self.findOne(context, item, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    if (_lodash._.isNil(result)) {
                        callback(new Error('Item cannot be found'));
                    } else {
                        //get file id
                        var file_id = _utils.TextUtils.toBase26(result.id);
                        //create file path
                        filePath = _path2.default.join(self.root, file_id.substr(0, 1), file_id);
                        //check file
                        _fs2.default.exists(filePath, function (exists) {
                            if (!exists) {
                                callback(new _errors.FileNotFoundError());
                            } else {
                                callback(null, _fs2.default.createReadStream(filePath));
                            }
                        });
                    }
                }
            });
        }

        /**
         * @param {HttpContext} context
         * @param {*} query
         * @param {Function} callback
         */

    }, {
        key: 'exists',
        value: function exists(context, query, callback) {
            callback = callback || function () {};
            this.findOne(context, query, function (err, result) {
                if (err) {
                    _utils.TraceUtils.log(err);
                    callback(false);
                } else {
                    callback(!_lodash._.isNil(result));
                }
            });
        }

        /**
         * @param {HttpContext} context
         * @param {*} query
         * @param {Function} callback
         */

    }, {
        key: 'find',
        value: function find(context, query, callback) {
            var self = this;
            self.ensure(function (err) {
                if (err) {
                    callback(err);
                } else {
                    if (_lodash._.isNil(query)) {
                        callback();
                    } else {
                        var attachments = context.model('Attachment');
                        if (_lodash._.isNil(attachments)) {
                            callback(new Error('Attachment model cannot be found.'));
                        }
                        attachments.find(query).all(callback);
                    }
                }
            });
        }

        /**
         * @param {Function} callback
         */

    }, {
        key: 'init',
        value: function init(callback) {
            this.ensure(callback);
        }

        /**
         * @param {HttpContext} context
         * @param {string} src
         * @param {*} attrs
         * @param {Function} callback
         */

    }, {
        key: 'copyFrom',
        value: function copyFrom(context, src, attrs, callback) {
            var self = this;
            callback = callback || function () {};
            self.ensure(function (err) {
                if (err) {
                    callback(err);
                } else {
                    var filename = _path2.default.basename(src);
                    attrs = attrs || {};
                    //set file composition name
                    attrs.filename = attrs.filename || filename;
                    //check source file
                    _fs2.default.exists(src, function (exists) {
                        if (!exists) {
                            callback(new Error('The source file cannot be found'));
                        } else {
                            //save attributes
                            //insert item attributes
                            self.save(context, attrs, function (err) {
                                if (err) {
                                    callback(err);
                                } else {
                                    (function () {
                                        //file operation (save to folder)
                                        var file = _utils.TextUtils.toBase26(attrs.id);
                                        _fs2.default.exists(_path2.default.join(self.root, file.substr(0, 1)), function (exists) {
                                            if (exists) {
                                                copyFile(src, _path2.default.join(self.root, file.substr(0, 1), file), function (err) {
                                                    callback(err);
                                                });
                                            } else {
                                                _fs2.default.mkdir(_path2.default.join(self.root, file.substr(0, 1)), function (err) {
                                                    if (err) {
                                                        callback(err);
                                                    } else {
                                                        copyFile(src, _path2.default.join(self.root, file.substr(0, 1), file), function (err) {
                                                            callback(err);
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    })();
                                }
                            });
                        }
                    });
                }
            });
        }

        /**
         * @param {HttpContext} context
         * @param {string|*} item
         * @param {string} dest
         * @param {Function} callback
         */

    }, {
        key: 'copyTo',
        value: function copyTo(context, item, dest, callback) {
            var self = this;
            callback = callback || function () {};
            self.ensure(function (err) {
                if (err) {
                    callback(err);
                } else {
                    if (_lodash._.isNil(item)) {
                        callback(new Error('The source item cannot be empty at this context'));
                        self.findOne(context, item, function (err, result) {
                            if (err) {
                                callback(err);
                            } else {
                                if (_lodash._.isNil(result)) {
                                    callback(new Error('The source item cannot be found.'));
                                } else {
                                    (function () {
                                        var file = _utils.TextUtils.toBase26(result.id),
                                            src = _path2.default.join(self.root, file.substr(0, 1), file);
                                        _fs2.default.exists(src, function (exists) {
                                            if (!exists) {
                                                callback(new Error('The source file cannot be found.'));
                                            } else {
                                                (function () {
                                                    var destFile = _path2.default.join(dest, result.filename);
                                                    copyFile(src, destFile, function (err) {
                                                        callback(err, destFile);
                                                    });
                                                })();
                                            }
                                        });
                                    })();
                                }
                            }
                        });
                    }
                }
            });
        }
    }]);

    return AttachmentFileSystemStorage;
}(FileStorage);

/**
 * @param {string} src
 * @param {string} dest
 * @param {Function} callback
 * @private
 */


function copyFile(src, dest, callback) {
    //create read stream
    var source = _fs2.default.createReadStream(src);
    //create write stream
    var destination = _fs2.default.createWriteStream(dest);
    //copy file
    source.pipe(destination);
    source.on('end', function () {
        callback();
    });
    source.on('error', function (err) {
        callback(err);
    });
}
//# sourceMappingURL=files.js.map
