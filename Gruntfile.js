module.exports = function(grunt) {
    grunt.initConfig({
        jshint: {
            options: {
                browserify: true,
                browser: true,
                devel: true
            },
            all: [
                'Gruntfile.js',
                'www/js/**/*.js',
            ]
        },
        jasmine: {
            tests: {
                src: [],
                options: {
                    outfile: 'tests/_SpecRunner.html',
                    specs: 'tests/test-suite.js',
                    junit: {
                        path: 'tests/reports/'
                    }
                }
            }
        },
        watch: {
            options: {
                livereload: true,
                spawn: false
            },
            configFiles: {
                files: ['Gruntfile.js'],
                tasks: ['build'],
                options: {
                    reload: true
                }
            },
            js: {
                files: [
                    'www/js/**/*.js',
                    'www/vendor/**/*'
                ],
                tasks: ['build']
            },
            tpl: {
                files: [
                    'www/js/**/*.html'
                ],
                tasks: ['browserify:dev']
            },
            css: {
                files: [
                    'www/css/page-container.css',
                    'www/vendor/bootstrap-dialog/css/bootstrap-dialog.css',
                    'www/js/**/*.css',
                    'www/css/general.css',
                ],
                tasks: ['cssmin']
            },
        },
        cssmin: {
            options: {
                sourceMap: true,
                roundingPrecision: -1
            },
            target: {
                files: {
                    'www/css/index.css': [
                        './node_modules/bootstrap-slider/css/bootstrap-slider.css',
                        './node_modules/bootstrap/dist/css/bootstrap.min.css',
                        './node_modules/planet-maps/dist/ol.css',
                        './node_modules/swiper/dist/css/swiper.min.css',
                        './www/vendor/bootstrap-dialog/css/bootstrap-dialog.css',
                        './www/css/general.css',
                        './www/css/page-container.css',
                        './www/js/**/*.css'
                    ]
                }
            }
        },
        connect: {
            server: {
                options: {
                    base: 'www',
                    open: true,
                    livereload: true
                }
            }
        },
        browserify: {
            dev: {
                src: ['www/js/**/*.js'],
                dest: 'www/index.js',
                options: {
                    browserifyOptions: {
                        debug: true // Enable (inline) source map
                    }
                }
            },
            test: {
                src: ['tests/**/*_spec.js'],
                dest: 'tests/test-suite.js',
                options: {
                    browserifyOptions: {
                        debug: true // Enable (inline) source map
                    }
                }
            },
            options: {
                transform: [
                    ['node-underscorify', {templateSettings: {variable: 'data'}}]
                ]
            }
        },
        copy: {
            fonts: {
                expand: true,
                src: ['./node_modules/bootstrap/fonts/*'],
                dest: 'www/fonts/',
                filter: 'isFile',
                flatten: true
            },
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('test', ['jshint', 'browserify:test', 'jasmine']);
    grunt.registerTask('build', ['test', 'cssmin', 'browserify:dev','copy']);
    grunt.registerTask('dev', ['build', 'connect', 'watch']);
    grunt.registerTask('default', ['build']);
};

/* TODO:
 * - uglify (prod uniquement)
 * - remplacer connect par ripple et enlever le test "if (window.cordova)" dans init.js
 */
