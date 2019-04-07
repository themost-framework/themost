/* global System */
// noinspection JSDeprecatedSymbols
System.config({
    paths: {
        'unpkg:*': '//unpkg.com/*'
    },
    baseURL: './',
    transpiler: 'plugin-babel',
    babelOptions: {
        sourceMaps: true,
        stage0: true
    },
    map: {
        'showdown': '//unpkg.com/showdown@1.9.0/dist/showdown.js',
        'jquery':'//unpkg.com/jquery@3.3.1/dist/jquery.js',
        'popper.js': '//unpkg.com/popper.js@1.11.0/dist/umd/popper.js',
        'bootstrap': '//unpkg.com/bootstrap@4.3.1/dist/js/bootstrap.js',
        'material-kit':'//unpkg.com/material-kit@2.0.4/assets/js/',
        'plugin-babel': '//unpkg.com/systemjs-plugin-babel@0/plugin-babel.js',
        'systemjs-babel-build': '//unpkg.com/systemjs-plugin-babel@0/systemjs-babel-browser.js',
        'angular': '//unpkg.com/angular@1.7.8/angular.min.js',
        '@uirouter/angularjs': '//unpkg.com/@uirouter/angularjs/release/angular-ui-router.min.js',
        'angular-sanitize': '//unpkg.com/angular-sanitize@1.7.8/angular-sanitize.js',
        'prettier':'//unpkg.com/prettier@1.16.4/standalone.js',
        'prettier/parser-html': '//unpkg.com/prettier@1.16.4/parser-html.js',
        'highlight.js':'//unpkg.com/highlight.js@9.15.6/'
    }
});
