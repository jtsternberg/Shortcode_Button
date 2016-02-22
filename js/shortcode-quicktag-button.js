window.wp_sc_buttons = window.wp_sc_buttons || {};

( function( window, document, $, wp, QTags, l10n, btns, undefined ) {
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
			editMode : false,
			postID   : 0,
			content  : '',
			mceView  : {},
			$        : {}
		};
		var cached = false;

		btn.cache = function() {
			if ( cached ) {
				return;
			}

			btn.$.wrap = $( document.getElementById( params.slug +'-form' ) );
			btn.$.form = btn.$.wrap.length ? btn.$.wrap.find( 'form' ) : false;
			btn.postID = $( '#post_ID' ).val() || 0;
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
			if ( btn.editMode ) {
				return btn.content;
			}

			if ( btn.isVisual && window.tinymce.activeEditor ) {
				return window.tinymce.activeEditor.selection.getContent();
			}

			if ( ! btn.canvas ) {
				return '';
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
			var shortcode = btn.buildShortCode( shortcode_params );

			if ( ! shortcode ) {
				return;
			}

			if ( btn.editMode ) {
				btn.editMode( shortcode );
			} else if ( btn.isVisual && btns.visualmode[ params.slug ] ) {
				btns.visualmode[ params.slug ].execCommand( 'mceInsertContent', 0, shortcode );
			} else {
				QTags.insertContent( shortcode );
			}

			// handy event for listening when a shortcode is inserted
			$c.body.trigger( 'shortcode_button:insert', { btn : btn, inserted: shortcode } );

			btn.close();
		};

		btn.initModal = function() {
			if ( ! btn.$.wrap.length ) {
				return;
			}

			$c.modal.addClass( params.modalClass ).css({ height: params.modalHeight, width: params.modalWidth });
			$c.modal.find( '.scb-title' ).text( params.button_tooltip );
			$c.modal.find( '.scb-cancel' ).text( params.l10ncancel );
			$c.modal.find( '.scb-insert' ).text( btn.editMode ? params.l10nupdate : params.l10ninsert );
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
			$c.modal.one( 'click', '.scb-insert', btn.insert );
			$( document ).on( 'keyup', btn.keyup );
		};

		btn.click = function( isVisual, canvas ) {
			if ( 'function' === typeof( isVisual ) ) {
				btn.editMode = isVisual;
				isVisual = true;
				btn.isVisual = true;
			} else {
				btn.isVisual = true === isVisual;
			}

			btn.cache();
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

		if ( btn.params.mceView ) {
			/**
			 * TODO
			 * - Make selected content (for self-closing shortcodes) be editable.
			 *   Probably append an editor to the modal?
			 * - Document process for properly displaying rendered shortcode.
			 * - Populate modal fields with attribute values.
			 */

			btn.mceView = {
				action: 'scb_parse_shortcode',
				state: [],
			};

			btn.mceView.initialize = function() {
				var that = this;

				if ( that.url ) {
					that.loader = false;
					that.shortcode = wp.media.embed.shortcode( {
						url: that.text
					} );
				}

				// Cache content property.
				btn.content = that.shortcode.content;

				wp.ajax
					.post( that.action, {
						post_ID   : btn.postID,
						type      : that.shortcode.tag,
						shortcode : that.shortcode.string()
					} )
					.done( function( response ) {
						that.render( response );
					} )
					.fail( btn.mceView.ajaxFail );

			};

			btn.mceView.ajaxFail = function( response ) {
				btns.log( 'response fail', response );
				if ( btn.mceView.url ) {
					btn.mceView.removeMarkers();
				} else {
					btn.mceView.setError( response.message || response.statusText, 'admin-media' );
				}
			};

			btn.mceView.edit = function( text, update ) {

				if ( ! this.shortcode.attrs || ! this.shortcode.attrs.named ) {
					return;
				}

				btn.cache();

				var attrs = this.shortcode.attrs.named;

				btns.log( 'attrs', attrs, this.shortcode.attrs );

				$c.modal.find( '.scb-insert' ).text( params.l10nupdate );

				btn.$.form.find( '[class^="cmb-row cmb-type-"]' ).trigger( 'shortcode_button:populate', { btn : btn, attrs: attrs } );

				btn.click( update );
			};
		}

		return btn;
	};

	btns.init = function() {
		var button;
		for ( var i = l10n.length - 1; i >= 0; i-- ) {
			button = new Button( l10n[i] );

			// text editor quicktags button
			QTags.addButton( button.params.slug, button.params.qt_button_text, button.click );

			btns.qt[ button.params.slug ] = button;

			if ( button.params.mceView ) {
				wp.mce.views.register( button.params.slug, button.mceView );
			}

			$c.body.trigger( 'shortcode_button:button_init_complete_'+ button.params.slug, { btn : button } );
		}

		$c.body.trigger( 'shortcode_button:buttons_init_complete' );
	};

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
				$this.find( '.cmb2-upload-file-id' ).val( '' );
				return $this.find( '.cmb2-media-status' ).html( '' );
			case 'file-list':
				return $this.find( '.cmb2-media-status' ).html( '' );
			case 'colorpicker':
				return $this.find( '.wp-picker-clear' ).click();
		}
	};

	btns._populateFields = function( evt, _data ) {
		var $field = $( evt.target );
		var classes = $field.attr( 'class' ).replace( 'cmb-row cmb-type-', '' ).split( ' ' );
		var data = $.extend( true, {}, _data );
		data.type = classes[0];
		data.name = classes[1].replace( 'cmb2-id-', '' ).split( ' ' )[0];
		data.value = data.attrs[ data.name ] ? data.attrs[ data.name ] : '';

		if ( data.btn.populateField ) {
			return data.btn.populateField( $field, data );
		}

		return btns._populateField( $field, data );
	};

	btns._populateField = function( $field, data ) {
		// TODO: Set fields for all types
		switch ( data.type ) {
			case 'text':
				return $field.find( '[name=' + data.name + ']' ).val( data.value );
			case 'radio':
			case 'radio_inline':
			case 'multicheck':
				$field.find( '[name=' + data.name + '][checked]' ).removeAttr( 'checked' );
				return $field.find( '[name=' + data.name + '][value=' + data.value + ']' ).prop( 'checked', 1 );
		}
	};

	btns.jQueryInit = function() {
		$c.body = $( document.body );

		btns.init();

		$c.body
			.on( 'click', '#scb-overlay, .scb-close, .scb-cancel', btns.close )
			.on( 'shortcode_button:clear', btns.clearFields )
			.on( 'shortcode_button:populate', btns._populateFields )
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

				var width   = $c.modal.outerWidth();
				var height  = $c.modal.outerHeight();
				var fromTop = window.innerHeight > ( height + (window.innerHeight * 0.3) ) ? 0.15 : 0.035;
				var css     = {
					top : window.scrollY + (window.innerHeight * fromTop)
				};

				if ( window.innerWidth > width ) {
					css.left = (window.innerWidth - width) / 2;
				}

				$c.modal.css( css ).trigger( 'focus' );
			} );

		$c.wrap  = $( document.getElementById( 'scb-wrap' ) );
		$c.modal = $( document.getElementById( 'scb-modal' ) );
		$c.forms = $( '.scb-form-wrap' );

		$c.body.trigger( 'shortcode_button:jquery_init_complete' );
	};

	$( btns.jQueryInit );

} )( window, document, jQuery, wp, QTags, shortcodeButtonsl10n, wp_sc_buttons );
