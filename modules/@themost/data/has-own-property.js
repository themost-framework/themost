/**
 * Copyright (c) 2014-2020, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
function hasOwnProperty(any, name) {
    return Object.prototype.hasOwnProperty.call(any, name);
}

module.exports = {
    hasOwnProperty
};
