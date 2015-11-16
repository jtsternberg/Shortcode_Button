module.exports = function(grunt) {

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		jshint: {
    		files: ['Gruntfile.js', 'js/**/*.js', '!js/**/*.min.js', '!js/vendor/**/*.js'],
			options: {
				curly   : true,
				eqeqeq  : true,
				immed   : true,
				latedef : true,
				newcap  : true,
				noarg   : true,
				sub     : true,
				unused  : true,
				undef   : true,
				boss    : true,
				eqnull  : true,
				globals : {
					exports : true,
					module  : false
				},
				predef  :['document','window','ajaxurl','jQuery','wp','shortcodeButtonsl10n','tinymce', 'QTags', 'wp_sc_buttons']
			}
		},

		uglify: {
			all: {
				files: {
					'js/shortcode-button.min.js': ['js/shortcode-button.js'],
					'js/shortcode-quicktag-button.min.js': ['js/shortcode-quicktag-button.js']
				},
				options: {
					mangle: false
				}
			}
		},

		cssmin: {
			minify: {
				expand: true,
				cwd: '',
				src: ['css/**/*.css'],
				dest: '',
				ext: '.min.css'
			}
		},

		watch: {
			css: {
				files: ['css/**/*.css'],
				tasks: ['cssmin'],
			},

			js: {
				files: ['Gruntfile.js', 'js/**/*.js', '!js/**/*.min.js', '!js/vendor/**/*.js'],
				tasks: ['default'],
			}
		}

	});


	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	grunt.registerTask('default', ['jshint', 'uglify', 'cssmin']);
};
