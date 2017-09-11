/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-06-10
 */


/**
 * HttpRoute class provides routing functionality to HTTP requests
 * @class
 * @constructor
 * @param {string|*=} route - A formatted string or an object which represents an HTTP route response url (e.g. /pages/:name.html, /user/edit.html).
 * */
function HttpRoute(route) {
    if (typeof route === 'string') {
        this.route = { url:route };
    }
    else if (typeof route === 'object') {
        this.route = route;
    }
    this.routeData = { };

    this.patterns = {
        int:function() {
            return "^[1-9]([0-9]*)$";
        },
        boolean:function() {
            return "^true|false$"
        },
        decimal:function() {
            return "^\d*\.?\d*$";
        },
        float:function() {
            return "^\d*\.?\d*$";
        },
        guid:function() {
            return "^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$";
        }
    }

}

/**
 * @param {string} urlToMatch
 * @return {boolean}
 */
HttpRoute.prototype.isMatch = function (urlToMatch) {
    var self = this;
    if (typeof self.route === 'undefined' || self.route===null) {
        throw new Error("Route may not be null");
    }
    self.routeData = self.routeData || { };
    if (typeof urlToMatch !== 'string')
        return false;
    if (urlToMatch.length == 0)
        return false;
    var str1 = urlToMatch, patternMatch;
    var k = urlToMatch.indexOf('?');
    if (k >= 0)
        str1 = urlToMatch.substr(0, k);
    var re = /(\{([\w\[\]]+)(?::\s*((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*})+))?})|((:)([\w\[\]]+))/ig;
    var match = re.exec(this.route.url), params = [];
    while(match) {
        if (typeof match[2] === 'undefined') {
            //parameter with colon (e.g. :id)
            params.push({
                name: match[6]
            });
        }
        else if (typeof match[3] !== 'undefined') {
            //common expressions
            patternMatch = match[3];
            if (typeof self.patterns[match[3]] === 'function') {
                patternMatch = self.patterns[match[3]]();
            }
            params.push({
                name: match[2],
                pattern: new RegExp(patternMatch, "ig")
            });
        }
        else {
            params.push({
                name: match[2]
            });
        }
        match = re.exec(this.route.url);
    }
    var str = this.route.url.replace(re, "([\\w-]+)"),
        matcher = new RegExp("^" + str + "$", "ig");
    match = matcher.exec(str1);
    if (typeof match === 'undefined' || match == null) {
        return false;
    }
    for (var i = 0; i < params.length; i++) {
        var param = params[i];
        if (typeof param.pattern !== 'undefined') {
            if (!param.pattern.test(match[i+1])) {
                return false;
            }
        }
        param.value = match[i+1];
    }
    params.forEach(function(x) {
        self.routeData[x.name] = x.value;
    });
    if (self.route.hasOwnProperty("controller")) { self.routeData["controller"] = self.route["controller"]; }
    if (self.route.hasOwnProperty("action")) { self.routeData["action"] = self.route["action"]; }
    return true;
};


if (typeof exports !== 'undefined') {
    module.exports = {
        /**
         * Creates a new instance of HttpRoute class
         * @param {string|*=} route
         * @returns {HttpRoute}
         */
        createInstance: function (route) {
            return new HttpRoute(route);
        }
    };
}