window.wp_sc_buttons = window.wp_sc_buttons || {};

( function( window, document, $, wp, QTags, l10n, btns, undefined ) {
	'use strict';

	if ( ! l10n ) {
		return;
	}

	var $c = {};
	btns.qt = {};

	var normalizeContent = function( content ) {
		content = content.trim();

		// Fix weird autop issues from tinymce.
		if ( '<p>' === content.substr( content.length - 3 ) ) {
			content = content.substr( 0, content.length - 3 ).trim();
		}
		if ( '<p>' !== content.substring( 0, 3 ) && '</p>' === content.substr( content.length - 4 ) ) {
			content = '<p>' + content;
		}

		return content;
	};

	/**
	 * Event handler to remove the custom Quicktags button
	 * from wysiwyg editor added to shortcode modal if "include_close" is set to true,
	 * by hooking into the "quicktags-init" event
	 *
	 * @param {document#event:quicktags-init} evt
	 * @param {object} ed - The current quicktags editor instance
	 * @see {@link https://github.com/WordPress/WordPress/blob/master/wp-includes/js/quicktags.js#L266-L325|WordPress Quicktags}
	 * @see {@link https://github.com/jtsternberg/Shortcode_Button/blob/master/lib/class-shortcode-button.php#L236-L247|Shortcode Button}
	 * @see {@link https://github.com/WebDevStudios/WDS-Shortcodes/issues/7|WDS-Shortcodes Issue #7}
	 */
	var removeQTagsButton = function( evt, ed ) {
		var id;
		if ( 'sccontent' === ed.id && btns.qt ) {
			for ( id in btns.qt ) {
				// Remove the HTML element from the quicktags editor toolbar
				ed.toolbar.removeChild( QTags.getInstance( 'sccontent' ).getButtonElement( id ) );

				// Remove the custom button object from the quicktags editor
				delete ed.theButtons[ id ];
			}
		}
	};

	btns.log = function() {
		btns.log.history = btns.log.history || [];
		btns.log.history.push( arguments );
		if ( window.console ) {
			window.console.log( Array.prototype.slice.call( arguments) );
		}
	};

	var Button = function( params ) {
		var btn = {
			originalEditor : '',
			params         : params,
			values         : false,
			isVisual       : false,
			editMode       : false,
			postID         : 0,
			content        : '',
			givenContent   : '',
			mceView        : {},
			$              : {}
		};
		var cached = false;

		btn.cache = function() {
			if ( cached ) {
				return;
			}

			btn.$.wrap = $( document.getElementById( params.slug +'-form' ) );
			btn.$.form = btn.$.wrap.length ? btn.$.wrap.find( 'form' ) : false;
			btn.$.editor = btn.$.wrap.length ? btn.$.form.find( '.wp-editor-area' ).first() : false;
			btn.$.editor = btn.$.editor.length ? btn.$.editor : false;

			btn.postID = $( '#post_ID' ).val() || 0;
			cached = true;
		};

		btn.close = function() {
			if ( btn.$.form ) {
				btn.$.form.trigger( 'reset' );
				btn.$.form.find( '[class^="cmb-row cmb-type-"]' ).trigger( 'shortcode_button:clear' );
				btn.$.form.find( '.cmb-row.cmb-repeat-group-wrap' ).trigger( 'shortcode_button:clear' );
			}

			$( document ).off( 'keyup', btn.keyup );
			$c.modal.off( 'click', '.scb-insert', btn.insert );
			$c.wrap.removeClass( 'scbshow' );
		};

		btn.insert = function() {
			var ajaxData = {
				fields  : btn.$.form ? btn.$.form.serialize() : {},
				content : btn.shortcodeContent(),
				action  : 'wp_sc_form_process_'+ params.slug,
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

		btn.shortcodeContent = function() {
			var content = '';

			// If we have a sc content editor
			if ( btn.$.editor ) {
				// Get contents of quicktag edit textarea
				content = btn.$.editor.val();

				// If the tinymce/visual editor is active...
				if ( btn.$.editor.parents( '.wp-editor-wrap' ).hasClass( 'tmce-active' ) ) {
					// Then get our editor instance, and the content from that view.
					var editor = window.tinymce.get( btn.$.editor.attr( 'id' ) );
					if ( editor ) {
						content = editor.getContent();
					}
				}
			}

			return content;
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

		btn.buildShortCode = function( scparams ) {
			var selectedContent = btn.getSelectedText();
			var newContent = '';

			// back-compat. for sc_content
			if ( scparams.sc_content ) {
				scparams.sccontent = scparams.sc_content;
				delete scparams.sc_content;
			}

			if ( scparams.sccontent ) {
				btn.givenContent = newContent = btn.content = scparams.sccontent;
				delete scparams.sccontent;
			}

			if ( btn.givenContent ) {
				btn.givenContent = normalizeContent( btn.givenContent );
			}

			var options = {
				tag     : params.slug,
				attrs   : scparams,
				type    : params.include_close ? 'closed' : 'single',
				content : btn.params.mceView ? newContent : selectedContent + newContent,
			};

			return new wp.shortcode( options ).string();
		};

		btn.insertCallback = function( shortcode_params ) {
			var shortcode = btn.buildShortCode( shortcode_params );

			if ( ! shortcode ) {
				return;
			}

			if ( btn.editMode ) {
				btn.editMode( shortcode );
			} else if ( btn.isVisual && btns.visualmode[ params.slug ] ) {
				// Insert the shortcode to the visual mode editor
				btns.visualmode[ params.slug ].execCommand( 'mceInsertContent', 0, shortcode );
			} else {
				// reset active editor to original editor
				window.wpActiveEditor = btn.originalEditor;
				// And insert the shortcode
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

			btn.maybePopulate();
		};

		btn.maybePopulate = function() {
			if ( btn.values ) {
				btn.triggerPopulation( btn.values );
				btn.values = false;
				return;
			}

			var attrs = {};
			var has = false;
			if ( params.cmb && params.cmb.fields ) {
				var field;
				var i;
				for ( i = 0; i < params.cmb.fields.length; i++ ) {
					field = params.cmb.fields[i];
					if ( field.default && field.id ) {
						has = true;
						attrs[ field.id ] = field.default;
					}
				}
			}

			if ( has ) {
				btn.triggerPopulation( attrs );
			}
		};

		btn.triggerPopulation = function( attrs ) {
			$.each( attrs, function( name ) {
				btn.$.form.find( '[name="' + name + '"], [name="' + name + '[]"]' ).trigger( 'shortcode_button:populate', { btn : btn, attrs: attrs, name: name } );
			} );

			if ( btn.$.editor ) {
				btn.$.editor.trigger( 'shortcode_button:populate', { btn : btn, attrs: attrs, name: btn.$.editor.attr( 'name' ), type : 'wysiwyg' } );
			}
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
			btn.originalEditor = window.wpActiveEditor;
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
				// We don't want to be in edit mode on the html side, since we can only do inserts.
				if ( ! btn.isVisual ) {
					btn.editMode = false;
				}
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
			 * X Make selected content (for self-closing shortcodes) be editable.
			 *   This is mostly done.
			 * - Document process for properly displaying rendered shortcode.
			 * X Populate modal fields with attribute values.
			 *   This is mostly done.
			 */

			btn.mceView = {
				action : 'scb_parse_shortcode',
				state  : [],
				sc     : false
			};

			btn.mceView.initialize = function() {
				var that = this;
				btn.mceView.sc = that.shortcode;

				if ( that.url ) {
					that.loader = false;
					that.shortcode = wp.media.embed.shortcode( {
						url: that.text
					} );
				}

				if ( btn.givenContent ) {
					that.shortcode.content = btn.givenContent;
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

				btn.content = this.shortcode.content;
				btn.values = this.shortcode.attrs.named;
				btn.cache();
				$c.modal.find( '.scb-insert' ).text( params.l10nupdate );
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
		var classes = $this.attr( 'class' );
		var type = $this.hasClass( 'cmb-repeat-group-wrap' ) ? 'group' : classes.replace( 'cmb-row cmb-type-', '' ).split( ' ' )[0];

		// TODO: Reset all types
		switch ( type ) {
			case 'text':
			case 'text-medium':
			case 'text-small':
				return $this.find( '[type="text"]' ).val( '' );
			case 'file':
				$this.find( '.cmb2-upload-file-id' ).val( '' );
				return $this.find( '.cmb2-media-status' ).html( '' );
			case 'file-list':
				return $this.find( '.cmb2-media-status' ).html( '' );
			case 'colorpicker':
				return $this.find( '.wp-picker-clear' ).click();
			case 'group':
				return $this.find( '.cmb-repeatable-grouping:not(:first-child)' ).remove();
		}
	};

	btns._populateFields = function( evt, _data ) {
		var $field  = $( evt.target );
		var $row    = $field.parents( '[class^="cmb-row cmb-type-"]' );
		var classes = $row.attr( 'class' ).replace( 'cmb-row cmb-type-', '' ).split( ' ' );
		var data    = $.extend( true, {}, _data );
		var btn     = data.btn;
		data.type = classes[0];
		data.value = data.attrs[ data.name ] ? data.attrs[ data.name ] : '';

		// Allow override
		if ( btn.populateField ) {
			return btn.populateField( $field, data );
		}

		// TODO: Set fields for all types
		switch ( data.type ) {
			case 'text':
			case 'text-medium':
			case 'text-small':
			case 'textarea':
			case 'file':
				return $field.val( data.value );
			case 'colorpicker':
				return $field.wpColorPicker( 'color', data.value );
			case 'multicheck':
			case 'multicheck_inline':
			case 'multicheck-inline':
				if ( data.value ) {
					data.value = data.value.replace( /\|~/g, '[' ).replace( /~\|/g, ']' ).replace( /\'/g, '"' );
					try {
						data.value = $.parseJSON( data.value );
					} catch( e ) {
						data.value = [ data.value ];
					}
				} else {
					data.value = [ data.value ];
				}
				return $field.prop( 'checked', -1 !== $.inArray( $field.val(), data.value ) );
			case 'radio':
			case 'radio_inline':
			case 'radio-inline':
				return $field.prop( 'checked', data.value === $field.val() );
			case 'select':
				$field.find( 'option' ).prop( 'selected', false );
				return $field.find( 'option[value="' + data.value + '"]' ).prop( 'selected', true );
			case 'wysiwyg':
				// Set html mode content
				btn.$.editor.val( btn.content );
				var editor = window.tinymce.get( btn.$.editor.attr( 'id' ) );
				if ( editor && btn.content ) {
					// Set visual mode content
					editor.setContent( normalizeContent( btn.content ) );
				}
				return;
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

	$( btns.jQueryInit ).on( 'quicktags-init', removeQTagsButton );

} )( window, document, jQuery, wp, QTags, shortcodeButtonsl10n, wp_sc_buttons );
