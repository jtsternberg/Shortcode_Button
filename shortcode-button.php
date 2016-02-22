<?php
if ( ! class_exists( 'Shortcode_Button' ) ) :
/**
 * Tinymce and Quicktag buttons for outputting shortcodes
 *
 * @version 0.2.3
 */
class Shortcode_Button {

	/**
	 * Current version
	 *
	 * @var  string
	 * @since  0.1.2
	 */
	const VERSION = '0.2.3';

	protected $button_data = array();
	protected $args        = array();
	protected static $handle      = 'shortcode_button';
	protected static $enqueued     = false;
	protected static $buttons_data = array();
	protected static $scripts_url = '';

	/**
	 * Button name
	 *
	 * @since 0.1.0
	 *
	 * @param string $button_slug    Button name/slug
	 * @param array  $js_button_data Button arguments passed to Javascript
	 * @param array  $args           (optional) Override arguments
	 */
	public function __construct( $button_slug, $js_button_data, $args = array() ) {
		// Keep this handy
		$this->button_slug = $button_slug;
		// Stash for JS access
		$js_button_data['slug'] = $this->button_slug;

		$this->button_data = wp_parse_args( $js_button_data, array(
			'icon'           => '',
			'qt_button_text' => $this->button_slug,
			'button_tooltip' => $this->button_slug,
			'author'         => '',
			'authorurl'      => '',
			'infourl'        => '',
			'version'        => '',
			'l10ncancel'     => __( 'Cancel' ),
			'l10ninsert'     => __( 'Insert Shortcode' ),
			'l10nupdate'     => __( 'Update Shortcode', 'snippet-cpt' ),
			'include_close'  => false,
			'slug'           => '',
			'modalClass'     => 'wp-dialog',
			'modalHeight'    => 'auto',
			'modalWidth'     => 500,
			'mceView'        => false,
		) );

		$this->args = wp_parse_args( $args, array(
			'cmb_metabox_config'    => array(),
			'form_display_callback' => '',
			'conditional_callback'  => false,
		) );

		self::$buttons_data[] = $this->button_data;

		add_action( 'init', array( $this, 'hooks' ) );
	}

	/**
	 * Hook it all in. non-ajax hooks check for a conditional callback
	 *
	 * @since  0.1.0
	 */
	public function hooks() {
		static $once = false;

		add_action( 'wp_ajax_wp_sc_form_process_'. $this->button_slug, array( $this, 'process_form' ) );

		// If we have a conditional callback and the return of the callback is false
		if ( $this->args['conditional_callback'] && is_callable( $this->args['conditional_callback'] ) && ! call_user_func( $this->args['conditional_callback'], $this ) ) {
			// Then that means we should bail
			return;
		}

		add_action( 'admin_init', array( $this, 'button_init' ) );
		add_action( 'scb_modal', array( $this, 'add_modal_form' ) );

		if ( ! $once ) {

			self::$scripts_url = apply_filters( 'shortcode_button_assets_url', set_url_scheme( str_ireplace( ABSPATH, site_url( '/' ), trailingslashit( dirname( __FILE__ ) ) ) ) );

			add_action( 'admin_footer', array( __CLASS__, 'add_quicktag_button_script' ), 7 );
			add_action( 'wp_ajax_scb_parse_shortcode', array( __CLASS__, 'ajax_parse_shortcode' ) );

			$once = true;
		}
	}

	/**
	 * Hook our buttons in to tinymce
	 *
	 * @since  0.1.0
	 */
	public function button_init() {
		add_filter( 'mce_buttons', array( $this, 'register_button' ) );
		add_filter( 'mce_external_plugins', array( $this, 'add_button' ) );
	}

	// register it with tinymce
	public function register_button( $buttons ) {
		$buttons[] = $this->button_slug;
		return $buttons;
	}

	// and tell tinymce where it lives
	public function add_button( $plugin_array ) {
		$plugin_array[ $this->button_slug ] = self::url( 'js/shortcode-button.js' );
		return $plugin_array;
	}

	/**
	 * Enqueue our quicktag/general purpose button script, and localize our button data
	 *
	 * @since 0.1.0
	 */
	public static function add_quicktag_button_script() {
		$current_screen = get_current_screen();
		if ( empty( self::$buttons_data ) || ! isset( $current_screen->parent_base ) || $current_screen->parent_base != 'edit' ) {
			return;
		}

		$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		wp_enqueue_script( self::$handle, self::url( "js/shortcode-quicktag-button{$suffix}.js" ), array( 'jquery', 'quicktags' ), self::VERSION, true );

		// wp-jquery-ui-dialog css still needed as we're borrowing some dialog markup.
		wp_enqueue_style( self::$handle, self::url( "css/shortcode-button{$suffix}.css" ), array( 'wp-jquery-ui-dialog' ), self::VERSION );

		wp_localize_script( self::$handle, 'shortcodeButtonsl10n', array_reverse( self::$buttons_data ) );

		self::$buttons_data = array();

		include_once trailingslashit( dirname( __FILE__ ) ) . 'templates/modal.php';
	}

	/**
	 * Include our button form in a modal
	 *
	 * @since 0.1.0
	 */
	public function add_modal_form() {
		$current_screen = get_current_screen();
		if ( ! isset( $current_screen->parent_base ) || $current_screen->parent_base != 'edit' ) {
			return;
		}

		// Determine if we should use CMB or generic form callback.
		$callback    = $this->form_callback();
		$cmb_config  = $this->get_cmb_config();
		$is_callable = is_callable( $callback );
		$is_cmb      = ! empty( $cmb_config );
		$output_form = $is_callable || $is_cmb;

		do_action( "shortcode_button_before_modal_{$this->button_slug}", $this, $output_form );

		if ( ! $output_form ) {
			return;
		}

		?>
		<div class="scb-form-wrap" style="padding: 0 10px 20px;" id="<?php echo esc_attr( $this->button_slug ); ?>-form" title="<?php echo esc_attr( $this->button_data['button_tooltip'] ); ?>">
			<?php if ( $is_cmb ) {
				$this->do_cmb_form();
			} else {
				echo call_user_func( $callback, $this->button_data, $this->args );
			} ?>
		</div>
		<?php
	}

	/**
	 * Check button data for form dislay callback
	 *
	 * @since  0.1.0
	 *
	 * @return mixed Form display callback (or false)
	 */
	public function form_callback() {
		if ( isset( $this->btnc ) ) {
			return $this->btnc;
		}

		$cmb_config = $this->get_cmb_config();
		$this->btnc = empty( $cmb_config ) ? $this->args['form_display_callback'] : false;

		return $this->btnc;
	}

	/**
	 * Get the cmb config array from button args
	 *
	 * @since  0.1.0
	 *
	 * @return mixed CMB2 form args (or false)
	 */
	public function get_cmb_config() {
		if ( isset( $this->cmbmc ) ) {
			return $this->cmbmc;
		}

		$this->cmbmc = false;

		if ( ! empty( $this->args['cmb_metabox_config'] ) ) {
			// Config can be passed as an array or a callback (which returns the array).
			$this->cmbmc = is_callable( $this->args['cmb_metabox_config'] ) ? call_user_func( $this->args['cmb_metabox_config'], $this->button_data, $this->args ) : (array) $this->args['cmb_metabox_config'];

		}
		return $this->cmbmc;
	}

	/**
	 * Use CMB2 cmb2_metabox_form to output form display
	 *
	 * Only applies if cmb_metabox_config parameter exists.
	 * CMB2 must be included prior to running this script.
	 *
	 * @since  0.1.0
	 */
	public function do_cmb_form() {
		if ( ! function_exists( 'cmb2_metabox_form' ) ) {
			return;
		}

		$form = '<form class="cmb-form" method="post" id="%1$s" enctype="multipart/form-data" encoding="multipart/form-data"><input type="hidden" name="object_id" value="%2$s">%3$s</form>';
		cmb2_metabox_form( $this->get_cmb_object(), $this->button_slug, array( 'form_format' => $form ) );
	}

	/**
	 * Use the passed-in CMB2 form args to retrieve a CMB2 object
	 *
	 * @since  0.1.0
	 *
	 * @return mixed Returns a CMB2 object or null;
	 */
	public function get_cmb_object() {
		if ( ! function_exists( 'cmb2_metabox_form' ) ) {
			return false;
		}

		if ( isset( $this->cmb_object ) ) {
			return $this->cmb_object;
		}
		$this->cmb_object = cmb2_get_metabox( $this->get_cmb_config(), $this->button_slug );

		return $this->cmb_object;
	}

	/**
	 * Ajax form processing.
	 *
	 * Uses dynamic filter before returning: "{$button_slug}_shortcode_fields"
	 *
	 * @since  0.1.0
	 */
	public function process_form() {
		$cmb_config = $this->get_cmb_config();

		$fields = array();

		if ( isset( $_REQUEST['fields'] ) ) {
			// Parse the URL query string of the fields array.
			parse_str( $_POST['fields'], $fields );
		}

		// no cmb? just filter and send it back
		if ( empty( $cmb_config ) ) {
			wp_send_json_success( $this->filter_form_fields( $fields ) );
		}

		$this->process_cmb_form( $fields );
	}

	/**
	 * CMB2 form processing.
	 * (Only applies if cmb_metabox_config parameter exists)
	 *
	 * @since  0.1.0
	 * @param  array $fields Field values to process
	 */
	public function process_cmb_form( $fields ) {
		$cmb = $this->get_cmb_object();

		if (
			isset( $fields['object_id'], $fields[ $cmb->nonce() ] )
			&& wp_verify_nonce( $fields[ $cmb->nonce() ], $cmb->nonce() )
			&& $fields['object_id'] == $this->button_slug
		) {
			wp_send_json_success( $this->sanitize_cmb_fields( $fields ) );
		}

		wp_send_json_error( __( 'failed verification' ) );
	}

	/**
	 * Uses CMB2 field processing to sanitize fields
	 * (Only applies if cmb_metabox_config parameter exists)
	 *
	 * @since  0.1.0
	 *
	 * @param  array $fields Field values to sanitize
	 * @return array         Array of sanitized fields
	 */
	public function sanitize_cmb_fields( $fields ) {
		$cmb = $this->get_cmb_object();

		$cmb->data_to_save = $fields;
		$object_id = $cmb->object_id( $this->button_slug );
		$cmb->object_type( 'options-page' );

		$cmb->process_fields();

		// output buffer on the action so we don't pollute our JSON response
		ob_start();
		// Preserve CMB action
		do_action( 'cmb2_save_options-page_fields', $object_id, $cmb->cmb_id, $cmb->updated, $cmb );
		ob_end_clean();

		$updated_fields = cmb2_options( $object_id )->get_options();
		$cmb_config     = $this->get_cmb_config();

		$whitelist_keys = wp_list_pluck( $cmb_config['fields'], 'id' );
		$whitelist      = array();
		// Keep only the form values that correspond to the CMB2 fields
		foreach ( $whitelist_keys as $key ) {
			$value = isset( $updated_fields[ $key ] ) && ! empty( $updated_fields[ $key ] ) ? $updated_fields[ $key ] : '';

			// Don't keep empty values
			if ( $value ) {
				// Make checkbox values boolean
				$whitelist[ $key ] = 'on' == $value ? true : $value;
			}
		}

		return $this->filter_form_fields( $whitelist, $updated_fields );
	}

	/**
	 * Pass values through a variable filter hook before sending back to JS
	 * "{$button_slug}_shortcode_fields"
	 *
	 * @since  0.1.0
	 *
	 * @param  array  $fields     (Possibly modified) field values
	 * @param  array  $all_fields Unmodified field values
	 *
	 * @return array              Filtered field values
	 */
	function filter_form_fields( $fields, $unmodified_fields = array() ) {
		// Pass updated form values through a filter and return
		return (array) apply_filters( "{$this->button_slug}_shortcode_fields", $fields, $this, empty( $unmodified_fields ) ? $fields : $unmodified_fields );
	}

	/**
	 * Parse shortcode for display within a TinyMCE view.
	 */
	public static function ajax_parse_shortcode() {
		global $wp_scripts;

		if ( empty( $_POST['shortcode'] ) ) {
			wp_send_json_error();
		}

		$slug = sanitize_text_field( wp_unslash( $_POST['shortcode'] ) );
		$shortcode = do_shortcode( $slug );

		if ( empty( $shortcode ) ) {
			wp_send_json_error( array(
				'type' => 'no-items',
				'message' => __( 'No items found.' ),
			) );
		}

		$head  = '';
		$styles = wpview_media_sandbox_styles();

		foreach ( $styles as $style ) {
			$head .= '<link type="text/css" rel="stylesheet" href="' . $style . '">';
		}

		if ( ! empty( $wp_scripts ) ) {
			$wp_scripts->done = array();
		}

		ob_start();
		echo $shortcode;

		$send = array(
			'head' => $head,
			'body' => ob_get_clean(),
		);

		$send = apply_filters( "shortcode_button_parse_mce_view_before_send", $send );
		$send = apply_filters( "shortcode_button_parse_mce_view_before_send_$slug", $send );

		self::send_json_success( $send );
	}

	public static function send_json_success( $send ) {
		wp_send_json_success( $send );
	}

	/**
	 * Get script url
	 *
	 * @since  0.1.0
	 *
	 * @param  string  $path Path to append to url
	 *
	 * @return string        Script url plus path if passed in
	 */
	public static function url( $path = '' ) {
		return trailingslashit( self::$scripts_url ) . $path;
	}

	/**
	 * Magic getter for our object.
	 *
	 * @since  0.1.0
	 *
	 * @param  string $property Object property to retrieve
	 *
	 * @throws Exception Throws an exception if the property is invalid.
	 *
	 * @return mixed
	 */
	public function __get( $property ) {
		switch( $property ) {
			case 'button_data':
			case 'args':
			case 'handle':
			case 'button_slug':
				return $this->{$property};
			default:
				throw new Exception( 'Invalid '. __CLASS__ .' property: ' . $property );
		}
	}
}

endif; // end class_exists check
