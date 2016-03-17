module.exports = function(grunt) {
    grunt.initConfig({
        clean: {
            dev: {
                src: 'dist'
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
                },
                {
                    expand: true,
                    cwd: 'bower_components/knockout/dist',
                    src: 'knockout.js',
                    dest: 'dist/js/lib',
                },
                {
                    expand: true,
                    cwd: 'bower_components/map-icons/dist/js',
                    src: 'map-icons.js',
                    dest: 'dist/js/lib',
                },
                {
                    expand: true,
                    cwd: 'bower_components/map-icons/dist/fonts',
                    src: '**',
                    dest: 'dist/fonts',
                },
                {
                    expand: true,
                    cwd: 'bower_components/map-icons/dist/css',
                    src: 'map-icons.min.css',
                    dest: 'dist/css/lib',
                },
                {
                    expand: true,
                    cwd: 'bower_components/bootstrap/dist/js',
                    src: 'bootstrap.min.js',
                    dest: 'dist/js/lib',
                },
                {
                    expand: true,
                    cwd: 'bower_components/bootstrap/dist/css',
                    src: 'bootstrap.min.js',
                    dest: 'dist/css/lib',
                }]
            }
        },
    });
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.registerTask('default', ['clean', 'mkdir', 'copy']);
}
