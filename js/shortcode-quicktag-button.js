window.wp_sc_buttons = window.wp_sc_buttons || {};

window.wp_sc_buttons.qt = (function(window, document, $, QTags, buttons, scbuttons, undefined){
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

	$.fn.serializeObject = function() {
		var o = {};
		var a = this.serializeArray();

		$.each( a, function() {
			if ( o[this.name] !== undefined ) {
				if ( !o[this.name].push ) {
					o[this.name] = [o[this.name]];
				}
				o[this.name].push(this.value || '');
			} else {
				o[this.name] = this.value || '';
			}
		});
		return o;
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

			btn.$.modal = $( document.getElementById( params.slug +'-form' ) );
			btn.$.form = btn.$.modal.find( 'form' );
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
			btn.$.form.trigger( 'reset' );
		};

		btn.cancel = function() {
			btn.$.modal.dialog( 'close' );
		};

		btn.insert = function() {

			var formData = btn.$.form.serializeObject();

			formData.action = 'wp_sc_form_process_'+ params.slug;

			var formFail = function( response ) {
				scbuttons.log( 'response failure', response );
				scbuttons.log( 'ajaxurl', ajaxurl );
				scbuttons.log( 'formData', formData );
				scbuttons.log( 'buttonParams', params );

				btn.$.modal.dialog( 'close' );
			};

			$.post( ajaxurl, formData, function( response ) {
				if ( response.success ) {
					btn.insertCallback( response.data );
				} else {
					formFail( response );
				}
			})
			.fail( formFail );

		};

		btn.buildShortCode = function( shortcode_params ) {

			var shortcode = '['+ params.slug;

			$.each( shortcode_params, function( key, value ) {
				shortcode += ' '+ key +'="'+ value +'"';
			});

			shortcode += ']';

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

			btn.$.modal.dialog( 'close' );
		};

		btn.init = function() {
			btn.cache();

			var buttons = {};
			buttons[ params.l10ncancel ] = btn.cancel;
			buttons[ params.l10ninsert ] = btn.insert;

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

		btn.open = function( isVisual ) {
			btn.cache();

			btn.isVisual = true === isVisual;

			btn.$.modal.dialog( 'open' );
		};

		return btn;
	};


	var qt = {};

	for (var i = buttons.length - 1; i >= 0; i--) {
		var button = new Button( buttons[i] );

		button.init();

		// text editor quicktags button
		QTags.addButton( button.params.slug, button.params.qt_button_text, button.open );

		qt[ button.params.slug ] = button;
	}

	return qt;

})(window, document, jQuery, QTags, shortcodeButtonsl10n, wp_sc_buttons);
