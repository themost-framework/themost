/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
 *                     Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
'use strict';
import 'source-map-support/register';
import {_} from 'lodash';
import {DataPermissionEventListener} from '@themost/data/permission';

function toBoolean(value) {
    if (typeof value === 'function') {
        value = true;
    } else if (value && value.length !== 0) {
        const v = _.lowerCase("" + value);
        value = !(v === 'f' || v === '0' || v === 'false' || v === 'no' || v === 'n' || v === '[]');
    } else {
        value = false;
    }
    return value;
}
function getBlockElements(angular, nodes) {
    const startNode = nodes[0], endNode = nodes[nodes.length - 1];
    if (startNode === endNode) {
        return angular.element(startNode);
    }

    let element = startNode;
    const elements = [element];

    do {
        element = element.nextSibling;
        if (!element) break;
        elements.push(element);
    } while (element !== endNode);

    return angular.element(elements);
}

export class AngularServerModuleDefaults {
    /**
     * @param {AngularServerModule} module
     */
    static applyDirectives(module) {
        module.directive('serverInclude', function($context, $async, $parse) {
            return {
                replace:true,
                restrict:'EA',
                link: function (scope, element, attrs) {
                    return $async(function(resolve, reject) {
                        //get angular instance
                        const angular = this.angular;
                        /**
                         * @ngdoc attrs
                         * @property {string} serverInclude
                         * @property {string} src
                         */
                        const src = $parse(attrs.serverInclude)(scope);
                        if (src) {
                            $context.getApplication().executeRequest({
                                url: src,
                                cookie: $context.request.headers.cookie
                            }).subscribe((result)=>{
                                element.removeAttr('data-src');
                                element.replaceWith(angular.element(result.body.replace(/\n/,'')));
                                resolve();
                            }, (err) => {
                                element.replaceWith(null);
                                reject(err.message);
                            });
                        }
                    });
                }
            };
        }).directive('serverInit', function() {
            return {
                priority:400,
                restrict:'A',
                link: function (scope, element, attrs) {
                    /**
                     * @ngdoc attrs
                     * @property {string} serverInit
                     */
                    scope.$eval(attrs.serverInit);
                }
            };
        }).directive('serverIf', function($animate, $document) {
            return {
                transclude: 'element',
                priority: 600,
                terminal: true,
                restrict: 'A',
                $$tlb: true,
                link: function ($scope, $element, $attr, ctrl, $transclude) {
                    let block, childScope, previousElements;
                    const serverIf = $attr['serverIf'], parentDocument = $document.get(0);
                    $scope.$watch(serverIf, function ngIfWatchAction(value) {
                        if (toBoolean(value)) {
                            if (!childScope) {
                                childScope = $scope.$new(false);
                                $transclude(childScope, function (clone) {
                                    clone.push(parentDocument.createComment(''));
                                    //clone[clone.length++] = parentDocument.createComment('');
                                    block = {
                                        clone: clone
                                    };
                                    $animate.enter(clone, $element.parent(), $element);
                                });
                            }
                        } else {
                            if (previousElements) {
                                previousElements.remove();
                                previousElements = null;
                            }
                            if (childScope) {
                                childScope.$destroy();
                                childScope = null;
                            }
                            if (block) {
                                previousElements = getBlockElements(angular, block.clone);
                                $animate.leave(previousElements, function () {
                                    previousElements = null;
                                });
                                block = null;
                            }
                        }
                    });
                }
            };
        }).directive('serverIfPermission', ['$context','$compile', '$async', function($context, $compile, $async) {
            return {
                restrict:'E',
                replace: true,
                scope: { model:'@',mask:'@',state:'@' },
                compile:function() {
                    return {
                        pre: function preLink(scope, element) {
                            return $async(function(resolve, reject) {
                                try {
                                    const targetModel = $context.model(scope.model);
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
                                    const p = new DataPermissionEventListener(),
                                        event = { model: targetModel, state: scope.state, throwError:false };
                                    p.validate(event, function(err) {
                                        if (event.result) {
                                            const result = $compile(element.contents())(scope);
                                            element.replaceWith(result);
                                            resolve();
                                        }
                                        else {
                                            element.replaceWith(null);
                                            resolve();
                                        }
                                    });
                                }
                                catch(err) {
                                    reject(err.message);
                                }
                            });
                        },
                        post: angular.noop
                    };
                }
            };
        }]).directive('serverLoc', ['$context', function($context) {
            return {
                restrict: 'A',
                link: function(scope, element, attrs) {
                    /**
                     * @ngdoc
                     * @name attrs
                     * @property {string} serverLoc
                     * @private
                     */
                    if (attrs.title)
                        element.attr('title', $context.translate(attrs.title, attrs.serverLoc));
                    if (attrs.placeholder)
                        element.attr('placeholder', $context.translate(attrs.placeholder, attrs.serverLoc));
                }
            };
        }]).directive('serverLocHtml', ['$context', function($context) {
            return {
                restrict: 'A',
                link: function(scope, element, attrs) {
                    /**
                     * @ngdoc
                     * @name attrs
                     * @property {string} serverLocHtml
                     * @private
                     */
                    const text = $context.translate(element.html(), attrs.serverLocHtml);
                    if (text)
                        element.html(text);
                }
            };
        }]).directive('serverUserInRole', ['$context', '$compile', function($context) {
            return {
                restrict:'A',
                replace: true,
                priority: 100,
                compile:function() {
                    return {
                        pre: function preLink(scope, element, attrs) {
                            const user = $context.user;
                            if (typeof user !== 'undefined') {
                                user.groups = user.groups || [];
                                /**
                                 * @ngdoc attrs
                                 * @property {string} serverUserInRole
                                 *
                                 * @type {Array}
                                 * @private
                                 */
                                const roles = (attrs.serverUserInRole || '').split(',');
                                let inRole = (typeof _.find(user.groups, (x) => {
                                    return (roles.indexOf(x.name)>=0);
                                }) !== 'undefined');
                                //validate not statement e.g. server-user-in-role='!Administrators'
                                if (!inRole) {
                                    _.forEach(roles, function(x) {
                                        if (!inRole) {
                                            if (x.indexOf('!')===0) {
                                                inRole = (typeof _.find(user.groups, function(y) {
                                                    return (x.substr(1).indexOf(y.name)>=0);
                                                }) !== 'undefined');
                                            }
                                        }
                                    });
                                }
                                if (!inRole) {
                                    element.replaceWith(null);
                                }
                                else {
                                    //do nothing (remove server attributes)
                                    element.removeAttr('server-user-in-role').removeAttr('server:user-in-role');
                                }
                            }
                        },
                        post: angular.noop
                    };
                }
            };
        }]);
    }
}
