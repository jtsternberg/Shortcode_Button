WordPress Shortcode Button
================

Tinymce and Quicktag buttons for outputting shortcodes. Built to work with CMB2.

##Example Use

```php
<?php

// Include the library
require_once( 'Shortcode_Button/shortcode-button.php' );

// the button slug should be your shortcodes name.
// The same value you would use in `add_shortcode`
$button_slug = 'shortcode_name';

// Set up the button data that will be passed to the javascript files
$js_button_data = array(
	'icon'           => 'dashicons-admin-appearance',
	'qt_button_text' => __( 'Shortcode Button', 'shortcode-button' ),
	'button_tooltip' => __( 'Shortcode Button', 'shortcode-button' ),

	// Optional parameters
	'author'         => 'Justin Sternberg',
	'authorurl'      => 'http://dsgnwrks.pro',
	'infourl'        => 'https://github.com/jtsternberg/Shortcode_Button',
	'version'        => '1.0.0',
	'l10ncancel'     => __( 'Cancel' ),
	'l10ninsert'     => __( 'Insert Shortcode' ),
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
				'default' => 'default shortcode param value',
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