/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-11-07
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