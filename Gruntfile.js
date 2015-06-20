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
    uglify: {
      my_target: {
        options: {
          sourceMap: true
        },
        files: {
          'flexible-scrollbar/flexible-scrollbar.min.js': ['flexible-scrollbar/flexible-scrollbar.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-githooks');
  grunt.loadNpmTasks('grunt-jsbeautifier');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['jshint', 'jsbeautifier']);
  grunt.registerTask('pre-commit', ['jshint']);
};
