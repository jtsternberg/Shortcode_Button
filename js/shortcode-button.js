window.wp_sc_buttons = window.wp_sc_buttons || {};
window.wp_sc_buttons.visualmode = window.wp_sc_buttons.visualmode || {};

(function(window, document, $, tinymce, buttons, scbuttons, undefined){
	'use strict';

	if ( ! buttons ) {
		return;
	}

	var Button = function( button ) {

		var buttonArgs = function() {
			var buttonArgs = {
				title : button.button_tooltip,
				cmd   : button.slug
			};

			var notImageURL = button.icon.indexOf( '/' ) === -1 && button.icon.indexOf( '.' ) === -1;
			var isDashIcon  = button.icon.indexOf( 'dashicons' ) > -1;
			var isFontIcon  = button.icon.indexOf( ' ' ) > -1;

			// If they passed a dashicons class, use that.
			if ( notImageURL && isDashIcon ) {

				// we need 'dashicons-before' if they don't have it
				if ( button.icon.indexOf( 'dashicons-before' ) === -1 ) {
					button.icon += ' dashicons-before';
				}

				// and we DON'T need 'dashicons'
				button.icon = button.icon.replace( 'dashicons ', ' ' );

				// first class gets 'mce-i-' prefixed to it,
				// so we don't want to mess up the real dashicons classes
				buttonArgs.icon = 'dashicons ' + button.icon;

			}
			// If passing classes (check for space in value),
			// we'll assume they want to add a font-icon class.
			else if ( notImageURL && isFontIcon ) {

				// first class gets 'mce-i-' prefixed to it,
				// so we don't want to mess up the real dashicons classes
				buttonArgs.icon = 'font-icon ' + button.icon;
			} else {
				// Ok, just use whatever else they passed (image url or blank)
				buttonArgs.image = button.icon;
			}

			return buttonArgs;
		};

		tinymce.create( 'tinymce.plugins.'+ button.slug.toUpperCase() +'_Button', {

			init : function( editor ) {
				editor.addButton( button.slug, buttonArgs() );

				editor.addCommand( button.slug, function() {
					editor.focus();
					scbuttons.visualmode[ button.slug ] = editor;
					scbuttons.qt[ button.slug ].click( true );
				});
			},

			createControl : function() {
				return null;
			},

			getInfo : function() {
				return {
					longname  : button.button_tooltip,
					author    : button.author,
					authorurl : button.authorurl,
					infourl   : button.infourl,
					version   : button.version
				};
			}

		});

		// Visual editor button
		tinymce.PluginManager.add( button.slug, tinymce.plugins[ button.slug.toUpperCase() +'_Button' ] );

	};

	for ( var i = buttons.length - 1; i >= 0; i-- ) {
		new Button( buttons[i] );
	}

})(window, document, jQuery, tinymce, shortcodeButtonsl10n, wp_sc_buttons);
