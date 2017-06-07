<?php
/**
 * Exception class w/ data property.
 */
class Shortcode_Button_Exception extends Exception {

	/**
	 * Additional data for the exception.
	 *
	 * @var mixed
	 */
	protected $data = null;

	/**
	 * Constructor. Handles assigning the data property.
	 *
	 * @since 3.0.0
	 *
	 * @param strin $message Exception message.
	 * @param mixed $data    Additional data.
	 * @param int   $code    Exception code.
	 */
	public function __construct( $message = null, $data = null, $code = 0, Exception $previous = null ) {
		parent::__construct( $message, $code, $previous );
		if ( null !== $data ) {
			$this->data = $data;
		}
	}

	/**
	 * Fetch the Exception data.
	 *
	 * @since  3.0.0
	 *
	 * @return mixed Exception data
	 */
	public function get_data() {
		return $this->data;
	}
}


/**
 * Tinymce View Handler for Shortcode_Button
 *
 * @version 1.0.7
 */
class Shortcode_Button_MCE {

	/**
	 * The full shortcode being parsed in the tinymce instance.
	 *
	 * @var string
	 */
	protected $full_shortcode = '';

	/**
	 * The admin post being edited.
	 *
	 * @var integer
	 */
	protected $post_id = 0;

	/**
	 * The parsed shortcode attributes.
	 *
	 * @var array
	 */
	protected $atts = array();

	/**
	 * Shortcode_Button object.
	 *
	 * @var Shortcode_Button
	 */
	protected $btn;

	public static function ajax_parse_shortcode( $args, Shortcode_Button $btn ) {
		if ( empty( $args['shortcode'] ) ) {
			throw new Shortcode_Button_Exception( 'Missing Shortcode' );
		}

		return new self( $args, $btn );
	}

	public function __construct( $args, Shortcode_Button $btn ) {
		$this->full_shortcode = wp_kses_post( wp_unslash( $args['shortcode'] ) );
		$this->post_id        = ! empty( $args['post_ID'] ) ? absint( $args['post_ID'] ) : 0;
		$this->btn            = $btn;
	}

	public function get_output() {
		global $wp_scripts;

		add_filter( 'pre_do_shortcode_tag', array( $this, 'store_shortcode_atts' ), 10, 3 );

		$shortcode = do_shortcode( $this->full_shortcode );

		if ( empty( $shortcode ) ) {
			$send = array(
				'type'    => 'no-items',
				'message' => __( 'No items found.' ),
			);
			throw new Shortcode_Button_Exception( $send['message'], $send );
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
		$body = ob_get_clean();

		$send = compact( 'head', 'body' );

		$button_slug = $this->btn->button_slug;
		$send = apply_filters( "shortcode_button_parse_mce_view_before_send", $send, $this );
		$send = apply_filters( "shortcode_button_parse_mce_view_before_send_{$button_slug}", $send, $this );

		return $send;
	}

	public static function store_shortcode_atts( $return, $tag, $atts ) {
		$this->atts = $atts;
		return $return;
	}

	/**
	 * Magic getter for our object.
	 *
	 * @since  0.1.0
	 *
	 * @param  string $property Object property to retrieve
	 *
	 * @return mixed
	 */
	public function __get( $property ) {
		return $this->{$property};
	}
}
