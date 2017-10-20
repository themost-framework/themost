'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.bootstrap = bootstrap;
/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
function bootstrap(angular) {
    var serverDirectives = require('./server-directives');
    serverDirectives.bootstrap(angular);

    function helloUser() {
        return {
            restrict: 'EA',
            link: function link(scope, element) {
                element.text('Hello User!!');
            }
        };
    }
    angular.module('server-extensions', []).directive('helloUser', helloUser);
    return angular.module('server', ['server-extensions', 'server-directives']);
}
//# sourceMappingURL=server-app.js.map
