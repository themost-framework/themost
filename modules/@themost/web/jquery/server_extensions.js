/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
/**
 * @param $
 * @ignore
 */
exports.extend = function($) {
    $.fn.outerHTML = $.fn.outer = function () {
        return $(this).clone().wrap('<div></div>').parent().html();
    };
    $.extend($.expr[':'],{
        required: function(a) {
            return $(a).attr('required') === 'required';
        }
    });
};