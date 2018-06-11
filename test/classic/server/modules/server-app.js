/**
 * Initializes angular server application
 * @param angular
 */
export function bootstrap(angular) {
    let serverExtensions = angular.module('server-extensions',[]);
    serverExtensions
        .directive('serverHello', function() {
            return {
                restrict: 'A',
                scope: {
                    serverHello: '='
                },
                link: function (scope, element) {
                    element.html(scope.serverHello);
                }
            };
        });
    return angular.module('server',['server-extensions']);
}
