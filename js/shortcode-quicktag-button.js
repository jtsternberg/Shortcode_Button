window.wp_sc_buttons = window.wp_sc_buttons || {};

window.wp_sc_buttons.qt = ( function( window, document, $, QTags, buttons, scbuttons, undefined ) {
	'use strict';

	if ( ! buttons ) {
		return;
	}

	scbuttons.log = function() {
		scbuttons.log.history = scbuttons.log.history || [];
		scbuttons.log.history.push( arguments );
		if ( window.console ) {
			window.console.log( Array.prototype.slice.call( arguments) );
		}
	};

	var Button = function( params ) {
		var btn = {
			params   : params,
			isVisual : false,
			$        : {}
		};
		var cached = false;

		btn.cache = function() {
			if ( cached ) {
				return;
			}

			btn.$.body = $( document.body );
			btn.$.modal = $( document.getElementById( params.slug +'-form' ) );
			btn.$.form = btn.$.modal.length ? btn.$.modal.find( 'form' ) : false;
			cached = true;
		};

		btn.create = function() {

			var $this = $(this);
			var $form = $this.parent();
			var $submitBtn = $form.find('.ui-dialog-buttonpane button:last-child');

			// focus first button and bind enter to it
			$submitBtn.focus().addClass( 'button-primary' );

			$this.on( 'keypress', function(evt) {
				if ( evt.keyCode === 13 ) {
					evt.preventDefault();
					$submitBtn.click();
				}
			});
		};

		btn.close = function() {
			if ( btn.$.form ) {
				btn.$.form.trigger( 'reset' );
			}
		};

		btn.cancel = function() {
			if ( btn.$.modal.length ) {
				btn.$.modal.dialog( 'close' );
			}
		};

		btn.insert = function() {
			var ajaxData = {
				fields : btn.$.form ? btn.$.form.serialize() : {},
				action : 'wp_sc_form_process_'+ params.slug,
			};

			var formFail = function( response ) {
				scbuttons.log( 'response failure', response );
				scbuttons.log( 'ajaxurl', ajaxurl );
				scbuttons.log( 'fields', ajaxData.fields );
				scbuttons.log( 'buttonParams', params );

				btn.cancel();
			};

			$.post( ajaxurl, ajaxData, function( response ) {
				if ( response.success ) {
					btn.insertCallback( response.data );
				} else {
					formFail( response );
				}
			})
			.fail( formFail );

		};

		btn.getSelectedText = function() {
			if ( btn.isVisual && window.tinymce.activeEditor ) {
				return window.tinymce.activeEditor.selection.getContent();
			}

			btn.canvas.focus();

			if ( document.selection ) { // IE
				return document.selection.createRange().text;
			}

			var startPos = btn.canvas.selectionStart;
			var endPos = btn.canvas.selectionEnd;

			// No need to do all this fancy substring stuff unless we have a selection
			if ( startPos !== endPos ) {
				return btn.canvas.value.substring( startPos, endPos );
			}

			return '';
		};

		btn.buildShortCode = function( shortcode_params ) {

			var shortcode = '['+ params.slug;
			var selected_text = btn.getSelectedText();
			var content = '';

			$.each( shortcode_params, function( key, value ) {
				if ( 'sc_content' === key ) {
					content = value;
				} else {
					shortcode += ' '+ key +'="'+ value +'"';
				}
			});

			shortcode += ']';

			// Force closing if we are indeed supposed to
			if ( params.include_close || content ) {
				shortcode = shortcode + selected_text + content + '[/' + params.slug + ']';
			}

			return shortcode;
		};

		btn.insertCallback = function( shortcode_params ) {
			var shortcodeToInsert = btn.buildShortCode( shortcode_params );

			if ( ! shortcodeToInsert ) {
				return;
			}

			if ( btn.isVisual && scbuttons.visualmode[ params.slug ] ) {
				scbuttons.visualmode[ params.slug ].execCommand( 'mceInsertContent', 0, shortcodeToInsert );
			} else {
				QTags.insertContent( shortcodeToInsert );
			}

			// handy event for listening when a shortcode is inserted
			btn.$.body.trigger( 'shortcode_button:insert', { btn : btn, inserted: shortcodeToInsert } );

			btn.cancel();
		};

		btn.init = function() {
			btn.cache();

			var buttons = {};
			buttons[ params.l10ncancel ] = btn.cancel;
			buttons[ params.l10ninsert ] = btn.insert;

			if ( ! btn.$.modal.length ) {
				return;
			}

			var args = {
				'dialogClass'   : params.modalClass,
				'modal'         : true,
				'autoOpen'      : false,
				'draggable'     : false,
				'height'        : params.modalHeight,
				'width'         : params.modalWidth,
				'closeOnEscape' : true,
				'buttons'       : buttons,
				'create'        : btn.create,
				'close'         : btn.close
			};

			btn.$.modal.dialog( args );
		};

		btn.click = function( isVisual, canvas ) {
			btn.cache();

			btn.isVisual = true === isVisual;
			btn.canvas = canvas || '';

			// handy event for listening when a shortcode button is clicked
			btn.$.body.trigger( 'shortcode_button:click', { btn : btn } );

			if ( btn.$.modal.length ) {
				return btn.$.modal.dialog( 'open' );
			}

			btn.insert();
		};

		return btn;
	};

	var qt = {};

	for (var i = buttons.length - 1; i >= 0; i--) {
		var button = new Button( buttons[i] );

		button.init();

		// text editor quicktags button
		QTags.addButton( button.params.slug, button.params.qt_button_text, button.click );

		qt[ button.params.slug ] = button;
	}

	return qt;

} )( window, document, jQuery, QTags, shortcodeButtonsl10n, wp_sc_buttons );
