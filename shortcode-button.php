<?php
/**
 * Tinymce and Quicktag buttons for outputting shortcodes
 *
 * @todo Fix generic ids possibly conflicting (maybe add a prefix to all fields)
 *
 * @version 1.0.1
 */
if ( ! class_exists( 'Shortcode_Button_101', false ) ) {

	/**
	 * Handles checking for and loading the newest version of Shortcode_Button
	 *
	 * @since  1.0.0
	 *
	 * @category  WordPress_Plugin
	 * @package   Shortcode_Button
	 * @author    WebDevStudios
	 * @license   GPL-2.0+
	 * @link      http://webdevstudios.com
	 */
	class Shortcode_Button_101 {

		/**
		 * Current version number
		 * @var   string
		 * @since 1.0.0
		 */
		const VERSION = '1.0.1';

		/**
		 * Current version hook priority.
		 * Will decrement with each release
		 *
		 * @var   int
		 * @since 1.0.0
		 */
		const PRIORITY = 9998;

		/**
		 * Starts the version checking process.
		 * Creates SHORTCODE_BUTTONS_LOADED definition for early detection by
		 * other scripts.
		 *
		 * Hooks Shortcode_Button inclusion to the shortcode_button_load hook
		 * on a high priority which decrements (increasing the priority) with
		 * each version release.
		 *
		 * @since 1.0.0
		 */
		public function __construct() {
			/**
			 * A constant you can use to check if Shortcode_Button is loaded
			 * for your plugins/themes with Shortcode_Button dependency
			 */
			if ( ! defined( 'SHORTCODE_BUTTONS_LOADED' ) ) {
				define( 'SHORTCODE_BUTTONS_LOADED', true );
			}

			// Use the hook system to ensure only the newest version is loaded.
			add_action( 'shortcode_button_load', array( $this, 'include_lib' ), self::PRIORITY );

			// And do our hook.
			do_action( 'shortcode_button_load', $this );
		}

		/**
		 * A final check if Shortcode_Button exists before kicking off our
		 * Shortcode_Button loading.
		 *
		 * SHORTCODE_BUTTONS_VERSION and SHORTCODE_BUTTONS_DIR constants are set at this point.
		 *
		 * @since  1.0.0
		 */
		public function include_lib() {
			if ( class_exists( 'Shortcode_Button', false ) ) {
				return;
			}

			if ( ! defined( 'SHORTCODE_BUTTONS_VERSION' ) ) {
				define( 'SHORTCODE_BUTTONS_VERSION', self::VERSION );
			}

			if ( ! defined( 'SHORTCODE_BUTTONS_DIR' ) ) {
				define( 'SHORTCODE_BUTTONS_DIR', trailingslashit( dirname( __FILE__ ) ) );
			}

			// Include Shortcode_Button lib
			require_once 'lib/class-shortcode-button.php';
		}

	}

	// Make it so...
	new Shortcode_Button_101;
}
