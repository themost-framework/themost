/**
 * Created by kbarbounakis on 15/02/2017.
 */

export function bootstrap(angular) {

    angular.module('server-directives',[]).directive('helloText', function() {
       return {
           restrict:'A',
           link:function(scope, element, attrs) {
               element.text(attrs['helloText']);
           }
       };
    });

}