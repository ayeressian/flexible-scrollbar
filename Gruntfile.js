/*global module:false */

module.exports = function(grunt) {
    'use strict';

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jsbeautifier: {
            files: ['**/*.js', '**/*.css', '**/*.html', '!bower_components/**/*', '!node_modules/**/*'],
            options: {}
        },
        jshint: {
            all: ['**/*.js', '!bower_components/**/*', '!node_modules/**/*'],
            options: {
                jshintrc: true
            }
        },
        githooks: {
            all: {
                options: {},
                'pre-commit': 'jshint jsbeautifier',
                'post-merge': {
                    taskNames: 'bower:install'
                }
            }
        },
        'http-server': {
            dev: {
                port: 3000,
                host: "0.0.0.0"
            }
        }
    });

    grunt.loadNpmTasks('grunt-githooks');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-http-server');

    grunt.registerTask('default', ['jshint', 'jsbeautifier']);
    grunt.registerTask('pre-commit', ['jshint']);
};
