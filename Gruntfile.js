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
                    src: ['*', 'js/*.js', 'css/*.css'],
                    dest: 'dist',
                },
                {
                    expand: true,
                    cwd: 'bower_components/jquery/dist',
                    src: 'jquery.min.js',
                    dest: 'dist/js/lib',
                }]
            }
        },
    });
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.registerTask('default', ['clean', 'mkdir', 'copy']);
}
