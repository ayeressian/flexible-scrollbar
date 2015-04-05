module.export = function(grunt) {
    'use strict';
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jsbeautifier: {
            files: ['Gruntfile.js', '**/*.js', '**/*.css', '**/*.html'],
            options: {}
        },
        jshint: {
            all: ['Gruntfile.js', '**/*.js', '!bower_components/'],
            options: {
                jshintrc: true
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    
    grunt.registerTask('default', ['jshint', 'jsbeautifier']);
    grunt.registerTask('jshint', ['jshint']);
};