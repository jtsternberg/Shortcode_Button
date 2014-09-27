WordPress Shortcode Button
================

Tinymce and Quicktag buttons (and modals) for outputting shortcodes. Built to work with [CMB2](https://github.com/WebDevStudios/CMB2).

#### Todo:
* Properly style CMB2 fields in modal

### Example Use

```php
<?php

// Include the library
require_once( 'Shortcode_Button/shortcode-button.php' );

// the button slug should be your shortcodes name.
// The same value you would use in `add_shortcode`
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

	// Only set if the javascript files cannot be found
	// 'scripts_url' => '',
);

$button = new _Shortcode_Button_( $button_slug, $js_button_data, $additional_args );


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

* 0.1.1
	* Add override options for dialog modal's class, height, and width.
	* Better styling for CMB2 fields.

* 0.1.0
	* Hello World!
