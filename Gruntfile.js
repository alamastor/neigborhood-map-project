module.exports = function(grunt) {
    grunt.initConfig({
        clean: {
            dev: {
                src: ['dist', 'docs']
            }
        },
        mkdir: {
            dev: {
                create: ['dist/js/lib', 'dist/css/lib']
            }
        },
        copy: {
            dev: {
                files: [{
                    expand: true,
                    cwd: 'src',
                    src: ['**'],
                    dest: 'dist',
                },
                {
                    expand: true,
                    cwd: 'bower_components/jquery/dist',
                    src: 'jquery.min.js',
                    dest: 'dist/js/lib',
                    rename: function(dest, src) {
                        return dest + '/jquery.js';
                    },
                },
                {
                    expand: true,
                    cwd: 'bower_components/knockout/dist',
                    src: 'knockout.js',
                    dest: 'dist/js/lib',
                },
                {
                    expand: true,
                    cwd: 'bower_components/map-icons/dist',
                    src: ['js/map-icons.min.js', 'css/map-icons.min.css', 'fonts/*'],
                    dest: 'dist/lib',
                },
                {
                    expand: true,
                    cwd: 'bower_components/bootstrap/dist',
                    src: ['js/bootstrap.min.js', 'css/bootstrap.min.css', 'fonts/*'],
                    dest: 'dist/lib',
                },
                {
                    expand: true,
                    cwd: 'bower_components/requirejs',
                    src: ['require.js'],
                    dest: 'dist/js/lib',
                },
                {
                    expand: true,
                    cwd: 'bower_components/requirejs-plugins/src',
                    src: ['async.js'],
                    dest: 'dist/js/lib',
                },
                {
                    expand: true,
                    cwd: 'bower_components/oauth-signature/dist',
                    src: ['oauth-signature.min.js'],
                    dest: 'dist/js/lib',
                }]
            }
        },
        jsdoc : {
            dist : {
                src: ['src/js/*'],
                options: {
                    destination: 'docs',
                    readme: 'README.md',
                }
            }
        },
        htmlmin: {
            dev: {
                options: {
                    collapseWhiteSpace: true,
                },
                files: [{
                    expand: true,
                    cwd: 'dist',
                    src: 'index.html',
                    dest: 'dist'
                }]
            }
        },
        cssmin: {
          target: {
            files: [{
              expand: true,
              cwd: 'dist/css',
              src: ['*.css'],
              dest: 'dist/css',
            }]
          }
        },
        uglify: {
            target: {
                files: [{
                    expand: true,
                    cwd: 'dist/js',
                    src: ['*.js'],
                    dest: 'dist/js',
                }]
            }
        },
    });
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['clean', 'mkdir', 'copy', 'htmlmin', 'cssmin', 'uglify', 'jsdoc']);
}
