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

import {_} from 'lodash';
import fs from 'fs';
import util from 'util';
import path from 'path';
import {FileNotFoundError} from '@themost/common/errors';
import {RandomUtils,TraceUtils,TextUtils} from '@themost/common/utils';

/**
 * @classdesc An abstract class that describes a file storage.
 * @class
 * @property {string} root - Gets or sets a string that represents the physical root path of this file storage
 * @property {string} virtualPath - Gets or sets a string that represents the virtual path of this file storage
 */
export class FileStorage {

    /**
     * @constructor
     */
    constructor() {
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
    copyFrom(context, src, attrs, callback) {
        callback  = callback || function() {};
        callback();
    }

    /**
     * @param {HttpContext} context
     * @param {*} item
     * @param {string} destination
     * @param {Function} callback
     */
    copyTo(context, item, destination, callback) {
        callback  = callback || function() {};
        callback();
    }

    /**
     * @param {HttpContext} context
     * @param {*} item
     * @param {Function} callback
     */
    resolvePhysicalPath(context, item, callback) {
        callback  = callback || function() {};
        callback();
    }

    /**
     * @param {HttpContext} context
     * @param {*} item
     * @param {Function} callback
     */
    resolveUrl(context, item, callback) {
        callback  = callback || function() {};
        callback();
    }

    /**
     * @param {HttpContext} context
     * @param {*} item
     * @param {Function} callback
     */
    createReadStream(context, item, callback) {
        callback  = callback || function() {};
        callback();
    }

    /**
     * @param {Function} callback
     */
    init(callback) {
        callback  = callback || function() {};
        callback();
    }

    /**
     * @param {HttpContext} context
     * @param {*} query
     * @param {Function} callback
     */
    find(context, query, callback) {
        callback  = callback || function() {};
        callback();
    }

    /**
     * @param {HttpContext} context
     * @param {*} query
     * @param {Function} callback
     */
    findOne(context, query, callback) {
        callback  = callback || function() {};
        callback();
    }

    /**
     * @param {HttpContext} context
     * @param {*} item
     * @param {Function} callback
     */
    remove(context, item, callback) {
        callback  = callback || function() {};
        callback();
    }

    /**
     * @param {HttpContext} context
     * @param {*} item
     * @param {Function} callback
     */
    exists(context, item, callback) {
        callback  = callback || function() {};
        callback(false);
    }
}

/**
 * @classdesc FileSystemStorage class describes a file storage on local file system.
 * @class
 * @constructor
 * @augments FileStorage
 * @deprecated
 * @ignore
 */
export class FileSystemStorage extends FileStorage {
    /**
     * @constructor
     * @param {string} physicalPath - The root directory of this storage
     */
    constructor(physicalPath) {
        super();
        this.root = physicalPath;
        this.virtualPath = null;
        this.ensure = function(callback) {
            const self = this;
            callback = callback || function() {};
            if (self._initialized) {
                callback();
                return;
            }
            if (typeof self.root === 'undefined' || self.root==null) {
                callback(new Error('The file system storage root directory cannot be empty at this context.'));
            }
            else {
                //check directory existence
                fs.exists(self.root, function(exists) {
                   if (exists) {
                       self._initialized = true;
                       callback();
                   }
                    else {
                       fs.mkdir(self.root,function(err) {
                          if (err) {
                              TraceUtils.log(err);
                              callback(new Error('An error occured while trying to initialize file system storage.'));
                          }
                           else {
                              const Db = require('tingodb')().Db, db = new Db(self.root, {nativeObjectID:true});
                              //Fetch a collection to insert document into
                              const collection = db.collection("fs");
                              db.close(function() {
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

        this.execute = function(fn, callback) {
            fn = fn || function() {};
            try {
                const Db = require('tingodb')().Db, db = new Db(physicalPath, { nativeObjectID:true });
                fn(db, function(err, result) {
                    db.close(function() {
                       callback(err, result);
                    });
                });
            }
            catch (e) {
                callback(e);
            }
        }

    }

    /**
     * @param {HttpContext} context
     * @param {*} item
     * @param {function} callback
     */
    save(context, item, callback) {
        const self = this;
        if (_.isNil(item)) {
            callback();
            return;
        }
        self.execute(function(db, cb) {
            //file default version
            item.version = item.version || 1;
            //file status (0) temporary
            item.status = item.status || 0;
            //file date created (on storage)
            item.dateCreated = new Date();
            //file date modified (on storage)
            item.dateModified = new Date();
            //get collection
            const collection = db.collection('fs');
            //save
            let state = 2;
            if (_.isNil(item._id)) {
                state=1;
                item.oid = RandomUtils.randomChars(12);
            }
            collection.save(item, function(err) {
                cb(err);
            });
        }, function(err) {
            callback(err);
        });
    }

    /**
     * @param {HttpContext} context
     * @param {*} query
     * @param {Function} callback
     */
    findOne(context, query, callback) {
        const self = this;
        if (_.isNil(query)) {
            callback();
            return;
        }
        self.ensure(function() {
            self.execute(function(db, cb) {
                //get collection
                const collection = db.collection('fs');
                if (query._id) {
                    collection.findOne({_id:query._id}, function(err, result) {
                        cb(err, result);
                    });
                }
                else {
                    collection.findOne(query, function(err, result) {
                        cb(err, result);
                    });
                }
            }, function(err, result) {
                callback(err, result);
            });
        });
    }

    /**
     * @param {HttpContext} context
     * @param {*} item
     * @param {Function} callback
     */
    resolvePhysicalPath(context, item, callback) {
        const _id = item._id;
        const self = this;
        let file_id;
        if (_id) {
            file_id = TextUtils.toBase26(_id);
            callback(null, path.join(self.root, file_id.substr(0,1), file_id));
        }
        else {
            self.findOne(context, item, function(err, result) {
                if (err) {
                    callback(err);
                }
                else {
                    if (_.isNil(result)) {
                        callback(new Error('Item cannot be found'));
                    }
                    else {
                        file_id = TextUtils.toBase26(result._id);
                        callback(null, path.join(self.root, file_id.substr(0,1), file_id));
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
    resolveUrl(context, item, callback) {
        const oid = item.oid, self = this;
        if (oid) {
            callback(null, util.format(self.virtualPath, oid));
        }
        else {
            self.findOne(context, item, function(err, result) {
                if (err) {
                    callback(err);
                }
                else {
                    if (_.isNil(result)) {
                        callback(new Error('Item cannot be found'));
                    }
                    else {
                        callback(null, util.format(self.virtualPath, result.oid));
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
    createReadStream(context, item, callback) {
        const self = this;
        let filePath;
        self.findOne(context, item, function(err, result) {
            if (err) {
                callback(err);
            }
            else {
                if (_.isNil(result)) {
                    callback(new Error('Item cannot be found'));
                }
                else {
                    //get file id
                    const file_id = TextUtils.toBase26(result._id);
                    //create file path
                    filePath = path.join(self.root, file_id.substr(0,1), file_id);
                    //check file
                    fs.exists(filePath, function(exists) {
                        if (!exists) {
                            callback(new FileNotFoundError());
                        }
                        else {
                            callback(null, fs.createReadStream(filePath));
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
    exists(context, item, callback) {
        callback  = callback || function() {};
        this.findOne(context, item, function(err, result) {
            if (err) {
                TraceUtils.log(err);
                callback(false);
            }
            else {
                callback(!_.isNil(result));
            }
        });
    }

    /**
     * @param {HttpContext} context
     * @param {*} query
     * @param {Function} callback
     */
    find(context, query, callback) {
        const self = this;
        if (_.isNil(query)) {
            callback();
            return;
        }
        self.ensure(function() {
            self.execute(function(db, cb) {
                //get collection
                const collection = db.collection('fs');
                collection.find(query, function(err, result) {
                    cb(err, result);
                });
            }, function(err, result) {
                callback(err, result);
            });
        });
    }

    /**
     * @param {Function} callback
     */
    init(callback) {
        this.ensure(function(err) {
            callback(err);
        });
    }

    /**
     * @param {HttpContext} context
     * @param {string} src
     * @param {*} attrs
     * @param {Function} callback
     */
    copyFrom(context, src, attrs, callback) {
        const self = this;
        callback = callback || function() {};
        self.ensure(function(err) {
            if (err) {
                callback(err);
            }
            else {
                const filename = path.basename(src);
                attrs = attrs || {};
                //set file composition name
                attrs.filename = attrs.filename || filename;
                //check source file
                fs.exists(src, function(exists) {
                   if (!exists) {
                       callback(new Error('The source file cannot be found'));
                   }
                    else {
                       //save attributes
                       //insert item attributes
                       self.save(context, attrs, function(err) {
                           if (err) {
                               callback(err);
                           }
                           else {
                               //file operation (save to folder)
                               const file = TextUtils.toBase26(attrs._id);
                               fs.exists(path.join(self.root, file.substr(0,1)), function(exists) {
                                   if (exists) {
                                       copyFile(src,path.join(self.root, file.substr(0,1), file), function(err) {
                                          callback(err);
                                       });
                                   }
                                   else {
                                       fs.mkdir(path.join(self.root, file.substr(0,1)), function(err) {
                                          if (err) {
                                              callback(err);
                                          }
                                           else {
                                              copyFile(src,path.join(self.root, file.substr(0,1), file), function(err) {
                                                  callback(err);
                                              });
                                          }
                                       });
                                   }
                               });
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
    copyTo(context, item, dest, callback) {
        const self = this;
        callback  = callback || function() {};
        if (_.isNil(item)) {
            callback(new Error('The source item cannot be empty at this context'));
            self.findOne(context, item, function(err, result) {
               if (err) {
                    callback(err);
               }
                else {
                   if (_.isNil(result)) {
                       callback(new Error('The source item cannot be found.'));
                   }
                   else {
                       const file = TextUtils.toBase26(result._id), src = path.join(self.root, file.substr(0,1), file);
                       fs.exists(src, function(exists) {
                          if (!exists) {
                              callback(new Error('The source file cannot be found.'));
                          }
                           else {
                              const destFile = path.join(dest, result.filename);
                              copyFile(src, destFile, function(err) {
                                  callback(err, destFile);
                              });
                          }
                       });
                   }
               }
            });
        }
    }
}

/**
 * @classdesc AttachmentFileSystemStorage class describes a file storage for attachments' management on local file system.
 * @class
 * @constructor
 * @augments FileStorage
 */
export class AttachmentFileSystemStorage extends FileStorage {
    /**
     * @constructor
     * @param {string} physicalPath - The root directory of this storage
     */
    constructor(physicalPath) {
        super();
        this.root = physicalPath;
        this.virtualPath = null;
        this.ensure = function(callback) {
            const self = this;
            callback = callback || function() {};
            if (self._initialized) {
                callback();
                return;
            }
            if (_.isNil(self.root)) {
                callback(new Error('The file system storage root directory cannot be empty at this context.'));
            }
            else {
                //check directory existence
                fs.exists(self.root, function(exists) {
                    if (exists) {
                        self._initialized = true;
                        callback();
                    }
                    else {
                        fs.mkdir(self.root,function(err) {
                            if (err) {
                                TraceUtils.log(err);
                                callback(new Error('An error occured while trying to initialize file system storage.'));
                            }
                            else {
                                self._initialized = true;
                                callback();
                            }
                        });
                    }
                });
            }
        };
    }

    /**
     * @param {HttpContext} context
     * @param {*} item
     * @param {function} callback
     */
    save(context, item, callback) {
        const self = this;
        self.ensure(function(err) {
            if (err) {
                callback(err);
            }
            else {
                if (_.isNil(item)) {
                    callback();
                    return;
                }
                const attachments = context.model('Attachment');
                if (_.isNil(attachments)) {
                    callback(new Error('Attachment model cannot be found.'));
                }
                //file default version
                item.version = item.version || 1;
                //file status (false) not published
                item.published = item.published || false;
                //set oid explicitly
                item.oid = RandomUtils.randomChars(12);
                //set url
                item.url = util.format(self.virtualPath, item.oid);
                //save attachment
                attachments.save(item, function(err) {
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
    findOne(context, query, callback) {
        const self = this;
        self.ensure(function(err) {
            if (err) {
                callback(err);
            }
            else {
                if (_.isNil(query)) {
                    callback();
                    return;
                }
                const attachments = context.model('Attachment');
                if (_.isNil(attachments)) {
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
    resolvePhysicalPath(context, item, callback) {
        const id = item.id;
        const self = this;
        let file_id;
        if (id) {
            file_id = TextUtils.toBase26(id);
            callback(null, path.join(self.root, file_id.substr(0,1), file_id));
        }
        else {
            self.findOne(context, item, function(err, result) {
                if (err) {
                    callback(err);
                }
                else {
                    if (_.isNil(result)) {
                        callback(new Error('Item cannot be found'));
                    }
                    else {
                        file_id = TextUtils.toBase26(result.id);
                        callback(null, path.join(self.root, file_id.substr(0,1), file_id));
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
    resolveUrl(context, item, callback) {
        const oid = item.oid, self = this;
        if (oid) {
            callback(null, util.format(self.virtualPath, oid));
        }
        else {
            self.findOne(context, item, function(err, result) {
                if (err) {
                    callback(err);
                }
                else {
                    if (_.isNil(result)) {
                        callback(new Error('Item cannot be found'));
                    }
                    else {
                        callback(null, util.format(self.virtualPath, item.oid));
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
    createReadStream(context, item, callback) {
        const self = this;
        let filePath;
        self.findOne(context, item, function(err, result) {
            if (err) {
                callback(err);
            }
            else {
                if (_.isNil(result)) {
                    callback(new Error('Item cannot be found'));
                }
                else {
                    //get file id
                    const file_id = TextUtils.toBase26(result.id);
                    //create file path
                    filePath = path.join(self.root, file_id.substr(0,1), file_id);
                    //check file
                    fs.exists(filePath, function(exists) {
                        if (!exists) {
                            callback(new FileNotFoundError());
                        }
                        else {
                            callback(null, fs.createReadStream(filePath));
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
    exists(context, query, callback) {
        callback  = callback || function() {};
        this.findOne(context, query, function(err, result) {
            if (err) {
                TraceUtils.log(err);
                callback(false);
            }
            else {
                callback(!_.isNil(result));
            }
        });
    }

    /**
     * @param {HttpContext} context
     * @param {*} query
     * @param {Function} callback
     */
    find(context, query, callback) {
        const self = this;
        self.ensure(function(err) {
            if (err) {
                callback(err);
            }
            else {
                if (_.isNil(query)) {
                    callback();
                }
                else {
                    const attachments = context.model('Attachment');
                    if (_.isNil(attachments)) {
                        callback(new Error('Attachment model cannot be found.'));
                    }
                    attachments.find(query).all(callback)
                }
            }
        });
    }

    /**
     * @param {Function} callback
     */
    init(callback) {
        this.ensure(callback);
    }

    /**
     * @param {HttpContext} context
     * @param {string} src
     * @param {*} attrs
     * @param {Function} callback
     */
    copyFrom(context, src, attrs, callback) {
        const self = this;
        callback = callback || function() {};
        self.ensure(function(err) {
            if (err) {
                callback(err);
            }
            else {
                const filename = path.basename(src);
                attrs = attrs || {};
                //set file composition name
                attrs.filename = attrs.filename || filename;
                //check source file
                fs.exists(src, function(exists) {
                    if (!exists) {
                        callback(new Error('The source file cannot be found'));
                    }
                    else {
                        //save attributes
                        //insert item attributes
                        self.save(context, attrs, function(err) {
                            if (err) {
                                callback(err);
                            }
                            else {
                                //file operation (save to folder)
                                const file = TextUtils.toBase26(attrs.id);
                                fs.exists(path.join(self.root, file.substr(0,1)), function(exists) {
                                    if (exists) {
                                        copyFile(src,path.join(self.root, file.substr(0,1), file), function(err) {
                                            callback(err);
                                        });
                                    }
                                    else {
                                        fs.mkdir(path.join(self.root, file.substr(0,1)), function(err) {
                                            if (err) {
                                                callback(err);
                                            }
                                            else {
                                                copyFile(src,path.join(self.root, file.substr(0,1), file), function(err) {
                                                    callback(err);
                                                });
                                            }
                                        });
                                    }
                                });
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
    copyTo(context, item, dest, callback) {
        const self = this;
        callback  = callback || function() {};
        self.ensure(function(err) {
            if (err) {
                callback(err);
            }
            else {
                if (_.isNil(item)) {
                    callback(new Error('The source item cannot be empty at this context'));
                    self.findOne(context, item, function(err, result) {
                        if (err) {
                            callback(err);
                        }
                        else {
                            if (_.isNil(result)) {
                                callback(new Error('The source item cannot be found.'));
                            }
                            else {
                                const file = TextUtils.toBase26(result.id), src = path.join(self.root, file.substr(0,1), file);
                                fs.exists(src, function(exists) {
                                    if (!exists) {
                                        callback(new Error('The source file cannot be found.'));
                                    }
                                    else {
                                        const destFile = path.join(dest, result.filename);
                                        copyFile(src, destFile, function(err) {
                                            callback(err, destFile);
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });

    }
}

/**
 * @param {string} src
 * @param {string} dest
 * @param {Function} callback
 * @private
 */
function copyFile(src, dest, callback) {
    //create read stream
    const source = fs.createReadStream(src);
    //create write stream
    const destination = fs.createWriteStream(dest);
    //copy file
    source.pipe(destination);
    source.on('end', function() {
            callback();
    });
    source.on('error', function(err) {
        callback(err);
    });
}
