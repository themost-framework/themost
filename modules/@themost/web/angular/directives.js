/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
var _ = require('lodash');
var fs = require('fs');
/**
 * @ngdoc directive
 * @name ngServerBindHtml
 * @restrict A
 * @element ANY
 */


/**
 * @ngdoc directive
 * @name ngServerIf
 * @restrict A
 * @element ANY
 */

/**
 * @ngdoc directive
 * @name ngServerInit
 * @restrict AC
 * @element ANY
 */

/**
 * @ngdoc directive
 * @name ngServerRepeat
 * @restrict AC
 * @element ANY
 */

/**
 * @ngdoc directive
 * @name ngServerClass
 * @restrict AC
 * @element ANY
 */

/**
 * @ngdoc directive
 * @name ngServerClassOdd
 * @restrict AC
 * @element ANY
 */

/**
 * @ngdoc directive
 * @name ngServerClassEven
 * @restrict AC
 * @element ANY
 */

/**
 * @ngdoc directive
 * @name ngServerStyle
 * @restrict AC
 * @element ANY
 */

/**
 * @ngdoc directive
 * @name ngServerValue
 * @restrict A
 * @element ANY
 */

/**
 * @ngdoc directive
 * @name ngServerSwitch
 * @restrict EA
 * @element ANY
 */

/**
 * @ngdoc directive
 * @name ngServerSwitchWhen
 * @restrict EA
 * @element ANY
 */

/**
 * @ngdoc directive
 * @name ngServerSwitchDefault
 * @restrict EA
 * @element ANY
 */

/**
 * @ngdoc directive
 * @name ngServerInclude
 * @restrict EA
 * @element ANY
 */

/**
 * @ngdoc directive
 * @name ngServerLoc
 * @restrict A
 * @element ANY
 */

/**
 * @ngdoc directive
 * @name ngServerLocHtml
 * @restrict A
 * @element ANY
 */

/**
 * @ngdoc directive
 * @name ngServerUserInRole
 * @restrict A
 * @element ANY
 */

/**
 * @ngdoc directive
 * @name serverUiView
 * @restrict A
 * @element ANY
 */

///
var directives = {
    /**
     * @param {AngularServerModule} app
     */
    apply: function(app) {
// eslint-disable-next-line no-unused-vars
        app.directive('ngServerInclude',['$context', '$window', '$async',  function($context, $window, $async) {
            return {
                replace:true,
                restrict:'EA',
                link: function (scope, element, attrs) {
                    /**
                     * @ngdoc attrs
                     * @property {string} ngServerInclude
                     * @property {string} src
                     */
                    var src = attrs.ngServerInclude || attrs.src;
                    if (src) {
                        return $async(function(resolve, reject) {
                            $context.getApplication().executeRequest({
                                url: src,
                                cookie: $context.request.headers.cookie
                            }, function(err, result) {
                                if (err) {
                                    element.replaceWith(null);
                                    reject(err.message);
                                }
                                else {
                                    element.removeAttr('data-src');
                                    var el =$window.angular.element(result.body.replace(/\n/,''));
                                    element.replaceWith(el);
                                    resolve();
                                }
                            });
                        });
                    }
                }
            };
        }]).directive('ngServerIfPermission', ['$context','$compile', '$q', function($context, $compile, $q) {
            return {
                restrict:'E',
                replace: true,
                scope: { model:'@',mask:'@',state:'@' },
                compile:function() {
                    return {
                        pre: function preLink(scope, element) {
                            element.removeAttr(_.dasherize('ngServerIfPermission'));
                            var DataPermissionEventListener = require('../../data/data-permission').DataPermissionEventListener;
                            var deferred = $q.defer();
                            try {
                                var targetModel = $context.model(scope.model);
                                if (_.isNil(scope.state)) {
                                    if (scope.mask)
                                        if (scope.mask === 1)
                                            scope.state = 0;
                                        else if (scope.mask === 2)
                                            scope.state = 1;
                                        else if (scope.mask === 4)
                                            scope.state = 2;
                                        else if (scope.mask === 8)
                                            scope.state = 4;
                                        else
                                            scope.state = scope.mask;
                                }
                                var p = new DataPermissionEventListener();
                                var eventArgs = {
                                    model: targetModel,
                                    state: scope.state,
                                    throwError: false
                                };
                                p.validate(eventArgs, function() {
                                    if (eventArgs.result) {
                                        var result = $compile(element.contents())(scope);
                                        element.replaceWith(result);
                                        deferred.resolve();
                                    }
                                    else {
                                        element.replaceWith(null);
                                        deferred.resolve();
                                    }
                                });
                            }
                            catch(err) {
                                deferred.reject(err.message);
                            }


                        },
                        post: function() { }
                    }
                }
            };
        }]).directive('ngServerLoc', ['$context', function($context) {
            return {
                restrict: 'A',
                link: function(scope, element, attrs) {
                    /**
                     * @ngdoc
                     * @name attrs
                     * @property {string} ngServerLoc
                     * @private
                     */
                    if (attrs.title)
                        element.attr('title', $context.translate(attrs.title, attrs.ngServerLoc));
                    if (attrs.placeholder)
                        element.attr('placeholder', $context.translate(attrs.placeholder, attrs.ngServerLoc));
                }
            };
        }]).directive('serverUiView', ['$context', '$async', '$serverState', '$templateCache', '$compile', function($context, $async, $serverState, $templateCache, $compile) {
            return {
                restrict: 'EA',
                terminal: true,
                transclude: 'element',
                controller: function() {},
                compile: function() {
                    return function(scope, $element) {
                        return $async(function(resolve, reject) {
                            if ($serverState && $serverState.templatePath) {

// eslint-disable-next-line no-inner-declarations
                                function includeContentTemplate(content, callback) {
                                    try {
                                        var clone = $compile(content)(scope);
                                        $element.replaceWith(clone);
                                    }
                                    catch(err) {
                                        return callback(err);
                                    }
                                    return callback();
                                }
                                var template = $templateCache.get($serverState.templatePath);
                                if (template) {
                                    return includeContentTemplate(template, function(err) {
                                        if (err) {
                                            return reject(err);
                                        }
                                        return resolve();
                                    });
                                }
                                return fs.readFile($serverState.templatePath, 'utf-8', function(err, template) {
                                    if (err) {
                                        return reject(err);
                                    }
                                    $templateCache.put($serverState.templatePath, template);
                                    return includeContentTemplate(template, function(err) {
                                        if (err) {
                                            return reject(err);
                                        }
                                        return resolve();
                                    });
                                });
                            }
                            return resolve();
                        });
                    }
                }
            };
        }]).directive('ngServerLocHtml', ['$context', function($context) {
            return {
                restrict: 'A',
                link: function(scope, element, attrs) {
                    /**
                     * @ngdoc
                     * @name attrs
                     * @property {string} ngServerLocHtml
                     * @private
                     */
                    var text = $context.translate(element.html(), attrs.ngServerLocHtml);
                    if (text)
                        element.html(text);
                }
            };
// eslint-disable-next-line no-unused-vars
        }]).directive('ngServerUserInRole', ['$context', '$compile', function($context, $compile) {
            return {
                restrict:'A',
                replace: true,
                priority: 100,
                compile:function() {
                    return {
                        pre: function preLink(scope, element, attrs) {
                            var user = $context.user;
                            if (typeof user !== 'undefined') {
                                user.groups = user.groups || [];
                                /**
                                 * @ngdoc attrs
                                 * @property {string} ngServerUserInRole
                                 *
                                 * @type {Array}
                                 * @private
                                 */
                                var roles = (attrs.ngServerUserInRole || '').split(',');
                                var inRole = (user.groups.filter(function(x) {
                                    return (roles.indexOf(x.name)>=0);
                                }).length>0);
                                //validate not statement e.g. server-user-in-role='!Administrators'
                                if (!inRole) {
                                    roles.forEach(function(x) {
                                        if (!inRole) {
                                            if (x.indexOf('!')===0) {
                                                inRole = typeof _.find(user.groups,function(y) {
                                                    return (x.substr(1).indexOf(y.name)>=0);
                                                }) !== 'undefined';
                                            }
                                        }
                                    });
                                }
                                if (!inRole) {
                                    element.replaceWith(null);
                                }
                                else {
                                    //--SEC02 remove server attribute(ngServerUserInRole)
                                    element.removeAttr( _.dasherize('ngServerUserInRole'));
                                }
                            }
                        },
                        post: function() {}
                    }
                }
            };
        }]);
    }
};

if (typeof exports !== 'undefined') {
    module.exports.apply = directives.apply;
}