'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.extend = extend;
/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */

/**
 * @param {*} $
 */
function extend($) {
    $.fn.outerHTML = $.fn.outer = function () {
        return $(this).clone().wrap('<div></div>').parent().html();
    };

    $.extend($.expr[':'], {
        required: function required(a) {
            return $(a).attr('required') === 'required';
        }
    });
}
//# sourceMappingURL=server_extensions.js.map
