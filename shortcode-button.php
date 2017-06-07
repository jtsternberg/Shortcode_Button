<?php
/**
 * Shortcode_Button loader
 * Handles checking for and smartly loading the newest version of this library.
 *
 * Shortcode_Button - Tinymce and Quicktag buttons for outputting shortcodes.
 *
 * @category  WordPressLibrary
 * @package   Shortcode_Button
 * @author    Justin Sternberg <justin@dsgnwrks.pro>
 * @copyright 2015-2016 Justin Sternberg <justin@dsgnwrks.pro>
 * @license   GPL-2.0+
 * @version   1.0.7
 * @link      https://github.com/jtsternberg/Shortcode_Button
 * @since     1.0.0
 */

/**
 * Copyright (c) 2015-2016 Justin Sternberg (email : justin@dsgnwrks.pro)
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2 or, at
 * your discretion, any later version, as published by the Free
 * Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */

/**
 * Loader versioning: http://jtsternberg.github.io/wp-lib-loader/
 */

if ( ! class_exists( 'Shortcode_Button_107', false ) ) {

	/**
	 * Versioned loader class-name
	 *
	 * This ensures each version is loaded/checked.
	 *
	 * @category WordPressLibrary
	 * @package  Shortcode_Button
	 * @author   Justin Sternberg <justin@dsgnwrks.pro>
	 * @license  GPL-2.0+
	 * @version  1.0.7
	 * @link     https://github.com/jtsternberg/Shortcode_Button
	 * @since    1.0.0
	 */
	class Shortcode_Button_107 {

		/**
		 * Shortcode_Button version number
		 * @var   string
		 * @since 1.0.0
		 */
		const VERSION = '1.0.7';

		/**
		 * Current version hook priority.
		 * Will decrement with each release
		 *
		 * @var   int
		 * @since 1.0.0
		 */
		const PRIORITY = 9992;

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
			if ( ! defined( 'SHORTCODE_BUTTONS_LOADED' ) ) {
				/**
				 * A constant you can use to check if Shortcode_Button is loaded
				 * for your plugins/themes with Shortcode_Button dependency.
				 *
				 * Can also be used to determine the priority of the hook
				 * in use for the currently loaded version.
				 */
				define( 'SHORTCODE_BUTTONS_LOADED', self::PRIORITY );
			}

			// Use the hook system to ensure only the newest version is loaded.
			add_action( 'shortcode_button_load', array( $this, 'include_lib' ), self::PRIORITY );

			/*
			 * Hook in to the first hook we have available and
			 * fire our `shortcode_button_load' hook.
			 */
			add_action( 'muplugins_loaded', array( __CLASS__, 'fire_hook' ), 9 );
			add_action( 'plugins_loaded', array( __CLASS__, 'fire_hook' ), 9 );
			add_action( 'after_setup_theme', array( __CLASS__, 'fire_hook' ), 9 );
		}

		/**
		 * Fires the shortcode_button_load action hook.
		 *
		 * @since 1.0.0
		 */
		public static function fire_hook() {
			if ( ! did_action( 'shortcode_button_load' ) ) {
				// Then fire our hook.
				do_action( 'shortcode_button_load' );
			}
		}

		/**
		 * A final check if Shortcode_Button exists before kicking off
		 * our Shortcode_Button loading.
		 *
		 * SHORTCODE_BUTTONS_VERSION and SHORTCODE_BUTTONS_DIR constants are
		 * set at this point.
		 *
		 * @since  1.0.0
		 */
		public function include_lib() {
			if ( class_exists( 'Shortcode_Button', false ) ) {
				return;
			}

			if ( ! defined( 'SHORTCODE_BUTTONS_VERSION' ) ) {
				/**
				 * Defines the currently loaded version of Shortcode_Button.
				 */
				define( 'SHORTCODE_BUTTONS_VERSION', self::VERSION );
			}

			if ( ! defined( 'SHORTCODE_BUTTONS_DIR' ) ) {
				/**
				 * Defines the directory of the currently loaded version of Shortcode_Button.
				 */
				define( 'SHORTCODE_BUTTONS_DIR', dirname( __FILE__ ) . '/' );
			}

			// Include and initiate Shortcode_Button.
			require_once SHORTCODE_BUTTONS_DIR . 'lib/class-shortcode-button.php';
		}

	}

	// Kick it off.
	new Shortcode_Button_107;
}
