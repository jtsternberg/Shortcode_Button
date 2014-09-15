module.exports = function(grunt) {

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		jshint: {
    		files: ['Gruntfile.js', 'js/**/*.js', '!js/**/*.min.js'],
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
				predef  :['document','window','ajaxurl','jQuery','shortcodeButtonsl10n','tinymce', 'QTags', 'wp_sc_buttons']
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

		watch: {
			js: {
				files: ['Gruntfile.js', 'js/**/*.js', '!js/**/*.min.js'],
				tasks: ['default'],
			}
		}

	});


	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['jshint', 'uglify']);
};
