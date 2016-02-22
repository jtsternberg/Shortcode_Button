<div id="scb-wrap" class="scb-wrap">
	<div class="ui-dialog" id="scb-modal" tabindex="-1"><?php // http://stackoverflow.com/a/32912224 ?>
		<div class="ui-dialog-titlebar">
			<span class="ui-dialog-title scb-title">
			</span>
			<button type="button" class="ui-button ui-button-icon-only ui-dialog-titlebar-close scb-close" role="button" title="<?php _e( 'Close' ); ?>">
				<span class="ui-button-icon-primary ui-icon ui-icon-closethick">
				</span>
				<span class="ui-button-text scb-close"><?php _e( 'Close' ); ?></span>
			</button>
		</div>
		<div id="scb-inner">
			<?php do_action( 'scb_modal' ); ?>
		</div>
		<div class="ui-dialog-buttonpane ui-widget-content ui-helper-clearfix">
			<div class="ui-dialog-buttonset">
				<button type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only scb-cancel" role="button">
				</button>
				<button type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only button-primary scb-insert" role="button">
				</button>
			</div>
		</div>
	</div>
	<div id="scb-overlay" class="ui-widget-overlay ui-front" style="z-index: 100101;">
	</div>
</div>
