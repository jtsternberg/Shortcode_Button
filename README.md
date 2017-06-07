WordPress Shortcode Button (1.0.7)
================

Tinymce and Quicktag buttons (and modals) for outputting shortcodes. Built to work with [CMB2](https://github.com/WebDevStudios/CMB2).

Checkout the "[Cool Shortcode](https://github.com/jtsternberg/Cool-Shortcode)" demo plugin which demonstrates how to use [WDS-Shortcodes](https://github.com/WebDevStudios/WDS-Shortcodes), [CMB2](https://github.com/WebDevStudios/CMB2) and this library.

#### Todo:
* Testing with all CMB2 field types

### Example Use

```php
<?php
// Include the library
require_once( 'Shortcode_Button/shortcode-button.php' );

function init_my_shortcode_button() {

	// the button slug should be your shortcodes name.
	// The same value you would use in `add_shortcode`
	// Only numbers, letters and underscores are allowed.
	$button_slug = 'shortcode_name';

	// Set up the button data that will be passed to the javascript files
	$js_button_data = array(
		// Actual quicktag button text (on the text edit tab)
		'qt_button_text' => __( 'Shortcode Button', 'shortcode-button' ),
		// Tinymce button hover tooltip (on the html edit tab)
		'button_tooltip' => __( 'Shortcode Button', 'shortcode-button' ),
		// Tinymce button icon. Use a dashicon class or a 20x20 image url
		'icon'           => 'dashicons-admin-appearance',

		// Optional parameters
		'author'         => 'Justin Sternberg',
		'authorurl'      => 'http://dsgnwrks.pro',
		'infourl'        => 'https://github.com/jtsternberg/Shortcode_Button',
		'version'        => '1.0.0',
		'include_close'  => true, // Will wrap your selection in the shortcode
		'mceView'        => true, // Live preview of shortcode in editor. YMMV.

		// Use your own textdomain
		'l10ncancel'     => __( 'Cancel', 'shortcode-button' ),
		'l10ninsert'     => __( 'Insert Shortcode', 'shortcode-button' ),

		// Optional modal settings override
		// 'dialogClass' => 'wp-dialog',
		// 'modalHeight' => 'auto',
		// 'width'       => 500,
	);

	// Optional additional parameters
	$additional_args = array(
		// Can be a callback or metabox config array
		'cmb_metabox_config'   => 'shortcode_button_cmb_config',
		// Set the conditions of the shortcode buttons
		'conditional_callback' => 'shortcode_button_only_pages',

		// Use if you are not using CMB2 to generate the form fields
		// 'form_display_callback' => '',
	);

	$button = new Shortcode_Button( $button_slug, $js_button_data, $additional_args );
}
// This hook, with this priority ensures the Shortcode_Button library is loaded.
add_action( 'shortcode_button_load', 'init_my_shortcode_button', ( SHORTCODE_BUTTONS_LOADED + 1 ) );

/**
 * Return CMB2 config array
 *
 * @param  array  $button_data Array of button data
 *
 * @return array               CMB2 config array
 */
function shortcode_button_cmb_config( $button_data ) {

	return array(
		'id'     => 'shortcode_'. $button_data['slug'],
		'fields' => array(
			array(
				'name'    => __( 'Test Text Small', 'shortcode-button' ),
				'desc'    => __( 'field description (optional)', 'shortcode-button' ),
				'default' => __( 'default shortcode param value', 'shortcode-button' ),
				'id'      => 'shortcode_param',
				'type'    => 'text_small',
			),
		),
		// keep this w/ a key of 'options-page' and use the button slug as the value
		'show_on' => array( 'key' => 'options-page', 'value' => $button_data['slug'] ),
	);

}

/**
 * Callback dictates that shortcode button will only display if we're on a 'page' edit screen
 *
 * @return bool Expects a boolean value
 */
function shortcode_button_only_pages() {
	if ( ! is_admin() || ! function_exists( 'get_current_screen' ) ) {
		return false;
	}

	$current_screen = get_current_screen();

	if ( ! isset( $current_screen->parent_base ) || $current_screen->parent_base != 'edit' ) {
		return false;
	}

	if ( ! isset( $current_screen->post_type ) || $current_screen->post_type != 'page' ) {
		return false;
	}

	// Ok, guess we're on a 'page' edit screen
	return true;
}
```

### Screenshots

![button hover](http://dsgnwrks.pro/file-drop/images/button-hover.png)
*Button hover*

![button-click-show-modal](http://dsgnwrks.pro/file-drop/images/button-click-show-modal.png)
*Click button and open modal*

![button-click-show-modal](http://dsgnwrks.pro/file-drop/images/submit-add-shortcode.png)
*Submitted form inserts shortcode with params*

![button-click-show-modal](http://dsgnwrks.pro/file-drop/images/text-tab-quicktag-button.png)
*Text tab quicktag button (operates identically)*


#### Changelog

* 1.0.7
	* Introduce `Shortcode_Button_MCE` object for properly handling/parsing the MCE view for ajax, and add that object as an additional property to the `'shortcode_button_parse_mce_view_before_send'` and `"shortcode_button_parse_mce_view_before_send_{$button_slug}"` filters. ([#17](https://github.com/jtsternberg/Shortcode_Button/issues/17))
	* Make `text_medium` and `text_small` CMB2 fields work properly. Fixes [#20](https://github.com/jtsternberg/Shortcode_Button/issues/20).
	* More consistent checkbox field styling. Props [@JiveDig](https://github.com/JiveDig), [#19](https://github.com/jtsternberg/Shortcode_Button/pull/19) (and [#18](https://github.com/jtsternberg/Shortcode_Button/issues/18)).

* 1.0.6
	* Remove the custom recursive QTags button in the shortcode modal wysiwyg editor. Props (@nonsensecreativity)[https://github.com/nonsensecreativity], (#14)[https://github.com/jtsternberg/Shortcode_Button/pull/14].

* 1.0.5
	* Fix incorrect content displaying when editing shortcodes with self-closing tags and content.
	* Fix radio button 'checked' value displays when editing shortcode.
	* Fix multicheck checkboxes 'selected' value displays when editing shortcode.
	* Fix select 'selected' value displays when editing shortcode.

* 1.0.4
	* Make sure "file" field type inputs are populated when using MCE views and editing a shortcode.
	* When editing a snippet with content, normalize the content to address tinymce auto-paragraph issues.

* 1.0.3
	* Hide modal manually to ensure it is hidden before CSS loads. Prevents flash of content.

* 1.0.2
	* Fix broken loader. Needs to hook into a WordPress hook, and uses first available (`'muplugins_loaded'`, `'plugins_loaded'`, `'after_setup_theme'`) to fire the include action.

* 1.0.1
	* Handle repeatable groups for attribute values (or any array value) with a modified JSON string (which will need to be converted in your shortcode).

* 1.0.0
	* Add a conflict-resolution loader (like CMB2), so that only one version of Shortcode_Button is loaded, and it always loads the newest version.
	* Use WordPress core `wp.shortcode()` javascript api.
	* Better handling for populating edit modal with CMB2 defaults, if set.
	* A _bunch_ of fixes for when `'mceView'` is enabled:
		* Add a wysiwyg editor to the edit modal to handle wrapping shortcodes (`'include_close'`)
		* Better handling for populating edit modal with contents of shortcode being edited.
		* Better shortcode rendering in mce view. Your mileage may vary.

* 0.2.3
	* Fix focus issue when modal opens. ([#9](https://github.com/jtsternberg/Shortcode_Button/issues/9))
	* Fix modal height/scroll issues when modal opens.

* 0.2.2
	* Remove hidden image id from CMB2 `file` field type when closing the modal.

* 0.2.1
	* Enables tinymce views, though the implementation needs manual effort per-shortcode. Can use the `"shortcode_button_parse_mce_view_before_send"` and `"shortcode_button_parse_mce_view_before_send_$slug"` to modify the shortcode display before it's returned to the view.
	* Added javascript events, `'shortcode_button:jquery_init_complete'`, `'shortcode_button:buttons_init_complete'`, `'shortcode_button:populate'`, `'shortcode_button:button_init_complete_'+ buttonSlug`.

* 0.2.0
	* Removes jQuery-UI dialog dependency which caused some obscure bugs.
	* Enable non-modal buttons for simply inserting shortcodes via the mce button.
	* Rename to more-sane `Shortcode_Button` classname.
	* Added javascript events, `'shortcode_button:clear'`, `'shortcode_button:open'` and `'shortcode_button:close'`.

* 0.1.2
	* Add 'include_close' parameter for self-closing shortcodes. This also allows wrapping a selection with the shortcode.
	* Added a way that the `"{$button_slug}_shortcode_fields"` filter can pass content to be added inside the shortcode.
	* Add `shortcode_button_js_url` filter in case the JS assets are not enqueued properly.
	* Add the modal to the footer at an earlier priority so that scripts can be enqueued properly.
	* Added ability to register a shortcode button that does NOT open a modal (no fields, or added programatically)
	* Added javascript events, `'shortcode_button:click'` and `'shortcode_button:insert'`.
	* Better handling for nested field keys (i.e. <input name="name[value]" />).
	* New hook, `"shortcode_button_before_modal_{$button_slug}"`, added before the modal markup is output (for things like conditional enqueueing).

* 0.1.1
	* Add override options for dialog modal's class, height, and width.
	* Better styling for CMB2 fields.

* 0.1.0
	* Hello World!
