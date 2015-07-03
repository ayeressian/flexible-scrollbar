/*global module:false */

module.exports = function(grunt) {
    'use strict';

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jsbeautifier: {
            files: ['**/*.js', '**/*.css', '**/*.html', '!**/*.min.*', '!bower_components/**/*', '!node_modules/**/*'],
            options: {}
        },
        jshint: {
            all: ['**/*.js', '!**/*.min.js', '!bower_components/**/*', '!node_modules/**/*'],
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
        uglify: {
            my_target: {
                options: {
                    sourceMap: true
                },
                files: {
                    'flexible-scrollbar/flexible-scrollbar.min.js': ['flexible-scrollbar/flexible-scrollbar.js']
                }
            }
        },
        cssmin: {
            target: {
                options: {
                    sourceMap: true
                },
                files: {
                    'flexible-scrollbar/flexible-scrollbar.min.css': ['flexible-scrollbar/flexible-scrollbar.min.css']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-githooks');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('default', ['jshint', 'jsbeautifier', 'uglify', 'cssmin']);
    grunt.registerTask('pre-commit', ['jshint']);
};
