var rollupResolve = require('rollup-plugin-node-resolve');
var rollupCommon = require('rollup-plugin-commonjs');
var autoExternal = require('rollup-plugin-auto-external');
var dts = require('rollup-plugin-dts').default;

var dist = './dist/';
var name = 'themost_xml';

module.exports = [{
    input: './src/index.js',
    output: [
        {
            file: dist + name + '.cjs.js',
            format: 'cjs'
        },
        {
            file: dist + name + '.esm.js',
            format: 'esm'
        },
        {
            name: '@themost/xml',
            file: dist + name + '.js',
            format: 'umd'
        }
    ],
    plugins: [
        rollupResolve(),
        rollupCommon(),
        autoExternal()
    ]
}, {
    input: './src/index.d.ts',
    output: [ { file: dist + name + '.d.ts', format: 'es' } ],
    plugins: [
        dts()
    ],
}];
