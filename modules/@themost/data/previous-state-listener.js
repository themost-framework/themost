/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
function previousStateListener(event, callback) {
    var _ = require("lodash");
    if (event.state===1) { return callback(); }
    var key = event.model.primaryKey;
    if (_.isNil(event.target[key])) {
        return callback();
    }
    event.model.where(key).equal(event.target[key]).silent().first(function(err,result) {
        if (err) {
            return callback(err);
        }
        else {
            event.previous = result;
            return callback();
        }
    });
}

/**
 * @module @themost/data/previous-state-listener
 * @ignore
 */

/**
 * Occurs before creating or updating a data object.
 * @param {DataEventArgs|*} event - An object that represents the event arguments passed to this operation.
 * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occurred.
 */
exports.beforeSave = previousStateListener;
/**
 * Occurs before removing a data objects.
 * @param {DataEventArgs|*} event - An object that represents the event arguments passed to this operation.
 * @param {Function} callback - A callback function that should be called at the end of this operation. The first argument may be an error if any occurred.
 */
exports.beforeRemove = previousStateListener;