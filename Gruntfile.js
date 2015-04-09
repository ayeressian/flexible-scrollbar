/*global module:false */

module.exports = function (grunt) {
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
                options: {                    
                },
                'pre-commit': 'jshint',
                'post-merge': {
                    taskNames: 'bower:install'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-githooks');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('default', ['jshint']);
    grunt.registerTask('pre-commit', ['jshint']);
};