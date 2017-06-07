<?php
/**
 * Tinymce and Quicktag buttons for outputting shortcodes
 *
 * @todo Fix generic ids possibly conflicting (maybe add a prefix to all fields)
 *
 * @version 1.0.7
 */
class Shortcode_Button {

	/**
	 * Current version
	 *
	 * @var  string
	 * @since  0.1.2
	 */
	const VERSION = SHORTCODE_BUTTONS_VERSION;

	protected $button_slug         = '';
	protected $button_data         = array();
	protected $args                = array();
	protected $index               = 0;
	protected static $handle       = 'shortcode_button';
	protected static $enqueued     = false;
	protected static $buttons_data = array();
	protected static $scripts_url  = '';
	protected static $dir          = SHORTCODE_BUTTONS_DIR;
	protected static $_index       = 0;

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
			'icon'                => '',
			'qt_button_text'      => $this->button_slug,
			'button_tooltip'      => $this->button_slug,
			'author'              => '',
			'authorurl'           => '',
			'infourl'             => '',
			'version'             => '',
			'l10ncancel'          => __( 'Cancel' ),
			'l10ninsert'          => __( 'Insert Shortcode' ),
			'l10nupdate'          => __( 'Update Shortcode' ),
			'l10nsccontents'      => __( 'Shortcode Contents' ),
			'l10nsccontents_desc' => '',
			'include_close'       => false,
			'slug'                => '',
			'modalClass'          => 'wp-dialog',
			'modalHeight'         => 'auto',
			'modalWidth'          => 500,
			'mceView'             => false,
		) );

		$this->args = wp_parse_args( $args, array(
			'cmb_metabox_config'    => array(),
			'form_display_callback' => '',
			'conditional_callback'  => false,
		) );

		self::$buttons_data[] = $this->button_data;
		$this->index = self::$_index++;

		add_action( 'init', array( $this, 'hooks' ) );
	}

	/**
	 * Hook it all in. non-ajax hooks check for a conditional callback
	 *
	 * @since  0.1.0
	 */
	public function hooks() {
		add_action( 'wp_ajax_wp_sc_form_process_'. $this->button_slug, array( $this, 'process_form' ) );

		// If we have a conditional callback and the return of the callback is false
		if ( $this->args['conditional_callback'] && is_callable( $this->args['conditional_callback'] ) && ! call_user_func( $this->args['conditional_callback'], $this ) ) {
			// Then that means we should bail
			return;
		}

		add_action( 'admin_init', array( $this, 'button_init' ) );
		add_action( 'scb_modal', array( $this, 'add_modal_form' ) );

		add_action( 'admin_footer', array( $this, 'get_cmb_config' ), 6 );
		add_action( 'admin_footer', array( __CLASS__, 'add_quicktag_button_script' ), 7 );
		add_action( 'wp_ajax_scb_parse_shortcode', array( $this, 'ajax_parse_shortcode' ) );

		if ( ! self::$scripts_url ) {
			$url = set_url_scheme( str_ireplace( ABSPATH, site_url( '/' ), self::$dir ) );
			self::$scripts_url = apply_filters( 'shortcode_button_assets_url', $url );
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
		static $once = false;

		if ( $once || ! self::$scripts_url ) {
			return;
		}

		$current_screen = get_current_screen();

		if (
			empty( self::$buttons_data )
			|| ! isset( $current_screen->parent_base )
			|| $current_screen->parent_base != 'edit'
		) {
			return;
		}

		$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		wp_enqueue_script( self::$handle, self::url( "js/shortcode-quicktag-button{$suffix}.js" ), array( 'jquery', 'quicktags' ), self::VERSION, true );

		// wp-jquery-ui-dialog css still needed as we're borrowing some dialog markup.
		wp_enqueue_style( self::$handle, self::url( "css/shortcode-button{$suffix}.css" ), array( 'wp-jquery-ui-dialog' ), self::VERSION );

		wp_localize_script( self::$handle, 'shortcodeButtonsl10n', array_reverse( self::$buttons_data ) );

		self::$buttons_data = array();

		include_once self::$dir . 'templates/modal.php';
		$once = true;
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

		// Determine if we should use CMB2 or generic form callback.
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

		if ( $this->button_data['mceView'] && $this->button_data['include_close'] && is_array( $this->cmbmc['fields'] ) ) {
			$this->cmbmc['fields'][] = array(
				'name'    => $this->button_data['l10nsccontents'],
				'desc'    => $this->button_data['l10nsccontents_desc'],
				'id'      => 'sccontent',
				'type'    => 'wysiwyg',
				'options' => array(
					'textarea_rows' => 5,
					'teeny'         => true,
				),
			);
		}

		self::$buttons_data[ $this->index ]['cmb'] = array(
			'id' => $this->cmbmc['id'],
			'fields' => $this->cmbmc['fields'],
		);

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

		if ( isset( $_REQUEST['content'] ) && ! empty( $_REQUEST['content'] ) ) {
			$fields['sccontent'] = $_REQUEST['content'];
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
		$cmb       = $this->get_cmb_object();
		$object_id = $cmb->object_id( $this->button_slug );
		$allvalues = $cmb->get_sanitized_values( $fields );

		// output buffer on the action so we don't pollute our JSON response
		ob_start();
		// Preserve CMB action
		do_action( 'cmb2_save_options-page_fields', $object_id, $cmb->cmb_id, $cmb->updated, $cmb );
		ob_end_clean();

		$cmb_config = $this->get_cmb_config();
		$values     = array();

		// Keep only the form values that correspond to the CMB2 fields
		foreach ( $cmb_config['fields'] as $field ) {
			$key = $field['id'];

			$value = isset( $allvalues[ $key ] ) && ! empty( $allvalues[ $key ] ) ? $allvalues[ $key ] : '';

			// Don't keep empty values
			if ( $value ) {
				// Make checkbox values boolean
				$values[ $key ] = 'on' == $value ? true : $value;
			}

			if ( 'file' === $field['type'] ) {
				// Handle file ID.
				$values[ $key . '_id' ] = isset( $allvalues[ $key . '_id' ] ) ? $allvalues[ $key . '_id' ] : '';
			}
		}

		return $this->filter_form_fields( $values, $allvalues );
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
	function filter_form_fields( $updated, $allvalues = array() ) {
		// Pass updated form values through a filter and return
		$filtered = (array) apply_filters( "{$this->button_slug}_shortcode_fields", $updated, $this, empty( $allvalues ) ? $updated : $allvalues );

		foreach ( $filtered as $key => $value ) {
			// If value is an array, we need to create a modified JSON-encoded string.
			if ( is_array( $value ) ) {
				$filtered[ $key ] = str_replace(
					array( '"', '[', ']' ),
					array( "'", '|~', '~|' ),
					wp_json_encode( $value )
				);
			}
		}

		return $filtered;
	}

	/**
	 * Parse shortcode for display within a TinyMCE view.
	 */
	public function ajax_parse_shortcode() {
		if ( empty( $_POST['type'] ) ) {
			wp_send_json_error();
		}

		if ( $this->button_slug !== $_POST['type'] ) {
			return;
		}

		require_once trailingslashit( dirname( __FILE__ ) ) . 'class-shortcode-button-mce.php';

		try {
			$mce = Shortcode_Button_MCE::ajax_parse_shortcode( $_POST, $this );
			wp_send_json_success( $mce->get_output() );
		} catch ( Shortcode_Button_Exception $e ) {
			wp_send_json_error( $e->get_data() );
		}
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
