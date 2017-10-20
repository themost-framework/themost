'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.bootstrap = bootstrap;
/**
 * Created by kbarbounakis on 15/02/2017.
 */

function bootstrap(angular) {

    angular.module('server-directives', []).directive('helloText', function () {
        return {
            restrict: 'A',
            link: function link(scope, element, attrs) {
                element.text(attrs['helloText']);
            }
        };
    });
}
//# sourceMappingURL=server-directives.js.map
