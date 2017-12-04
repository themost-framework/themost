module.exports = function(grunt) {
    grunt.initConfig({
        jsdoc : {
            dist : {
                jsdoc:"/usr/local/bin/jsdoc",
                options: {
                    destination : '../most-data-docs',
                    template : "../minami",
                    configure : "jsdoc.conf.json"
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-jsdoc');
};
