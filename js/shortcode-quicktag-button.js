window.wp_sc_buttons = window.wp_sc_buttons || {};

( function( window, document, $, QTags, l10n, btns, undefined ) {
	'use strict';

	if ( ! l10n ) {
		return;
	}

	var $c = {};
	btns.qt = {};

	btns.log = function() {
		btns.log.history = btns.log.history || [];
		btns.log.history.push( arguments );
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

			btn.$.wrap = $( document.getElementById( params.slug +'-form' ) );
			btn.$.form = btn.$.wrap.length ? btn.$.wrap.find( 'form' ) : false;
			cached = true;
		};

		btn.close = function() {
			if ( btn.$.form ) {
				btn.$.form.trigger( 'reset' );
				btn.$.form.find( '[class^="cmb-row cmb-type-"]' ).trigger( 'shortcode_button:clear' );
			}

			$( document ).off( 'keyup', btn.keyup );
			$c.modal.off( 'click', '.scb-insert', btn.insert );
			$c.wrap.removeClass( 'scbshow' );
		};

		btn.insert = function() {
			var ajaxData = {
				fields : btn.$.form ? btn.$.form.serialize() : {},
				action : 'wp_sc_form_process_'+ params.slug,
			};

			var formFail = function( response ) {
				btns.log( 'response failure', response );
				btns.log( 'ajaxurl', ajaxurl );
				btns.log( 'fields', ajaxData.fields );
				btns.log( 'buttonParams', params );

				btn.close();
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

			if ( btn.isVisual && btns.visualmode[ params.slug ] ) {
				btns.visualmode[ params.slug ].execCommand( 'mceInsertContent', 0, shortcodeToInsert );
			} else {
				QTags.insertContent( shortcodeToInsert );
			}

			// handy event for listening when a shortcode is inserted
			$c.body.trigger( 'shortcode_button:insert', { btn : btn, inserted: shortcodeToInsert } );

			btn.close();
		};

		btn.initModal = function() {
			if ( ! btn.$.wrap.length ) {
				return;
			}

			$c.modal.addClass( params.modalClass ).css({ height: params.modalHeight, width: params.modalWidth });
			$c.modal.find( '.scb-title' ).text( params.button_tooltip );
			$c.modal.find( '.scb-cancel' ).text( params.l10ncancel );
			$c.modal.find( '.scb-insert' ).text( params.l10ninsert );
		};

		btn.keyup = function( evt ) {
			if ( 13 === evt.keyCode ) {
				evt.preventDefault();
				btn.insert();
			}
			if ( 27 === evt.keyCode ) {
				btns.close();
			}
		};

		btn.openModal = function() {
			btns.open( btn.$.wrap );
			$c.modal.find( '.scb-insert' ).trigger( 'focus' );
			$c.modal.one( 'click', '.scb-insert', btn.insert );
			$( document ).on( 'keyup', btn.keyup );
		};

		btn.click = function( isVisual, canvas ) {
			btn.cache();
			btn.isVisual = true === isVisual;
			btn.canvas = canvas || '';

			// handy event for listening when a shortcode button is clicked
			$c.body.trigger( 'shortcode_button:click', { btn : btn } );

			// If no form, just insert the shortcode.
			if ( ! btn.$.wrap.length ) {
				return btn.insert();
			}

			btn.initModal();
			btn.openModal();
		};

		return btn;
	};

	( function() {
		var button;
		for ( var i = l10n.length - 1; i >= 0; i-- ) {
			button = new Button( l10n[i] );

			// text editor quicktags button
			QTags.addButton( button.params.slug, button.params.qt_button_text, button.click );

			btns.qt[ button.params.slug ] = button;
		}
	} )();

	btns.open = function( el ) {
		$c.body.trigger( 'shortcode_button:open', el );
	};

	btns.close = function() {
		$c.body.trigger( 'shortcode_button:close' );
	};

	btns.clearFields = function( evt ) {
		var $this = $( evt.target );
		var type = $this.attr( 'class' ).replace( 'cmb-row cmb-type-', '' ).split( ' ' )[0];

		// TODO: Reset all types
		switch ( type ) {
			case 'file':
			case 'file-list':
				return $this.find( '.cmb2-media-status' ).html( '' );
			case 'colorpicker':
				return $this.find( '.wp-picker-clear' ).click();
		}
	};

	btns.init = function() {
		$c.body = $( document.body );

		$c.body
			.on( 'click', '#scb-overlay, .scb-close, .scb-cancel', btns.close )
			.on( 'shortcode_button:clear', btns.clearFields )
			.on( 'shortcode_button:close', function() {
				$.each( btns.qt, function( slug, btn ) { btn.close(); });
				$c.wrap.removeClass( 'scbshow' );
			} )
			.on( 'shortcode_button:open', function( evt, el ) {
				$c.wrap.addClass( 'scbshow' );

				if ( el ) {
					$c.forms.removeClass( 'scbshow' );
					$( el ).addClass( 'scbshow' );
				}

				var width  = $c.modal.outerWidth();
				var height = $c.modal.outerHeight();
				var css    = {};

				if ( window.innerWidth > width ) {
					css.left = (window.innerWidth - width) / 2;
				}

				if ( window.innerHeight > height ) {
					css.top = (window.innerHeight * 0.15) + window.scrollY;
				}

				$c.modal.css( css );
			} );

		$c.wrap  = $( document.getElementById( 'scb-wrap' ) );
		$c.modal = $( document.getElementById( 'scb-modal' ) );
		$c.forms = $( '.scb-form-wrap' );
	};

	$( btns.init );

} )( window, document, jQuery, QTags, shortcodeButtonsl10n, wp_sc_buttons );
