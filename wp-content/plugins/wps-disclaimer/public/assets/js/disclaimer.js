jQuery(document).ready(function () {
	/*!
	 * Simple Age Verification (https://github.com/Herudea/age-verification))
	 */

	var modal_content, modal_screen;

	// Start Working ASAP.
	jQuery(document).ready(function () {
		av_legality_check();
	});

	av_legality_check = function () {
		if (jQuery.cookie('is_legal') == 'yes') {
			// legal!
			// Do nothing?
		} else {
			av_showmodal();

			// Make sure the prompt stays in the middle.
			jQuery(window).on('resize', av_positionPrompt);
		}
	};

	av_showmodal = function () {
		modal_screen = jQuery('<div id="dclm_modal_screen"></div>');
		modal_content = jQuery(
			'<div id="dclm_modal_content" style="display:none"></div>',
		);
		var modal_content_wrapper = jQuery(
			'<div id="dclm_modal_content_wrapper" class="content_wrapper"></div>',
		);
		var modal_regret_wrapper = jQuery(
			'<div id="dclm_modal_regret_wrapper" class="content_wrapper" style="display:none;"></div>',
		);

		// Logo content
		if (dclm_ajax_var.logo == 'on' && dclm_ajax_var.logo_file != '') {
			var content_logo = jQuery(
				'<div id="dclm-logo"><img src="' +
					dclm_ajax_var.logo_file +
					'" width="' +
					dclm_ajax_var.logo_width +
					'%"></div>',
			);
		}

		// Question Content
		var content_heading = jQuery('<h2>' + dclm_ajax_var.title + '</h2>');
		if (dclm_ajax_var.nope_redirect_url != '') {
			var content_buttons = jQuery(
				'<nav><ul><li><a href="#nothing" class="av_btn av_go" rel="yes">' +
					dclm_ajax_var.yes_button_text +
					'</a></li><li><a href="' +
					dclm_ajax_var.nope_redirect_url +
					'" class="av_btn av_no">' +
					dclm_ajax_var.no_button_text +
					'</a></li></nav>',
			);
		} else {
			var content_buttons = jQuery(
				'<nav><ul><li><a href="#nothing" class="av_btn av_go" rel="yes">' +
					dclm_ajax_var.yes_button_text +
					'</a></li><li><a href="#nothing" class="av_btn av_no" rel="no">' +
					dclm_ajax_var.no_button_text +
					'</a></li></nav>',
			);
		}

		var content_text = jQuery('<p>' + dclm_ajax_var.description + '</p>');

		// Regret Content
		var regret_heading = jQuery('<h2>' + dclm_ajax_var.nope_title + '</h2>');
		var regret_buttons = jQuery(
			'<nav><small>' +
				dclm_ajax_var.nope_under_title +
				'</small> <ul><li><a href="#nothing" class="av_btn av_go" rel="yes">' +
				dclm_ajax_var.nope_button_text +
				'</a></li></ul></nav>',
		);
		var regret_text = jQuery('<p>' + dclm_ajax_var.nope_description + '</p>');

		modal_content_wrapper.append(
			content_logo,
			content_heading,
			content_buttons,
			content_text,
		);
		modal_regret_wrapper.append(regret_heading, regret_buttons, regret_text);
		modal_content.append(modal_content_wrapper, modal_regret_wrapper);

		// Append the prompt to the end of the document
		jQuery('body').append(modal_screen, modal_content);

		// Center the box
		av_positionPrompt();

		// Condition option administrator
		modal_content.find('a.av_btn').on('click', av_setCookie);
	};

	if (
		dclm_ajax_var.disclaimer_disable_cookie_admin == 'on' &&
		dclm_ajax_var.disclaimer_current_user_can == 1
	) {
		setTimeout(function () {
			jQuery.removeCookie('is_legal', { path: '/' });
		}, 200);
	}

	av_setCookie = function (e) {
		e.preventDefault();

		var is_legal = jQuery(e.currentTarget).attr('rel');

		var cookieDuration = parseInt(dclm_ajax_var.disclaimer_cookie_duration, 10);
		var cookieOptions = { path: '/' };
		if (cookieDuration > 0) {
			cookieOptions.expires = new Date(
				new Date().getTime() + cookieDuration * 3600 * 1000,
			);
		}
		jQuery.cookie('is_legal', is_legal, cookieOptions);

		if (is_legal == 'yes') {
			if (dclm_ajax_var.disclaimer_redirect_url != '') {
				if (dclm_ajax_var.disclaimer_redirect_stay_on_site == 'on') {
					window.open(window.location.href, '_blank');
					window.location.replace(dclm_ajax_var.disclaimer_redirect_url);
				} else {
					window.open(dclm_ajax_var.disclaimer_redirect_url, '_blank');
				}
			}
			av_closeModal();
			jQuery(window).off('resize');
		} else {
			if (dclm_ajax_var.nope_redirect_url != '') {
				window.location.replace(dclm_ajax_var.nope_redirect_url);
			} else {
				av_showRegret();
			}
		}
	};

	av_closeModal = function () {
		modal_content.fadeOut();
		modal_screen.fadeOut();
	};

	av_showRegret = function () {
		modal_screen.addClass('nope');
		modal_content.find('#dclm_modal_content_wrapper').hide();
		modal_content.find('#dclm_modal_regret_wrapper').show();
	};

	av_positionPrompt = function () {
		var top =
			(jQuery(window).outerHeight() -
				jQuery('#dclm_modal_content').outerHeight()) /
			2;
		var left =
			(jQuery(window).outerWidth() -
				jQuery('#dclm_modal_content').outerWidth()) /
			2;
		modal_content.css({
			top: top,
			left: left,
		});

		if (modal_content.is(':hidden') && jQuery.cookie('is_legal') != 'yes') {
			modal_content.fadeIn('slow');
		}
	};
});
