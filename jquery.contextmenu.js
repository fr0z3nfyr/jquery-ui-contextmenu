/*******************************************************************************
 * jquery.contextmenu.js plugin.
 * 
 * jQuery plugin that provides a context menu (based on the jQueryUI menu widget).
 * 
 * @see https://github.com/mar10/jquery-contextmenu
 * 
 * Copyright (c) 2013, Martin Wendt (http://wwWendt.de). Licensed MIT.
 */

(function ($) {
	function getMenuFromEvent(event){
		var menu = $(event.target).closest(":ui-menu"),
		$menu = $(menu);
		return $menu.data("ui-menu") || $menu.data("menu");
	}
	$.widget("ui.contextmenu", {
		version: "0.0.1",
		options: {
			delegate: "[data-menu]",  // selector
			menu: null,      // selector or jQuery or a function returning such
			taphold: 2000, // open menu after 2000 ms long touch
			// Events:
			beforeOpen: $.noop, // menu about to open; return `false` to prevent opening
			blur: $.noop,       // menu option lost focus
			close: $.noop,      // menu was closed
			create: $.noop,     // menu was initialized
			focus: $.noop,      // menu option got focus
			init: $.noop,       // ui-contextmenu was initialized
			open: $.noop,       // menu was opened
			select: $.noop      // menu option was selected; return `false` to prevent closing
		},
		_create: function () {
            this.element.delegate(this.options.delegate, "contextmenu.contextmenu", $.proxy(this._openMenu, this));
            // emulate a 'taphold' event
            /*
            this.element.delegate(this.options.delegate, "mousedown.contextmenu", $.proxy(function(event, ui){
                var self = this;
                console.log("Event ", event.type, this.timer);
                if(this.timer){
                    console.log(" clear " + this.timer);
                    clearTimeout(this.timer);
                    this.timer = null;
                }
                this.timer = setTimeout(function(){
                    console.log("Timeout ", event.type, self.timer);
                    self.open.call(self, $(event.target));
                    self.timer = null;
                }, this.options.taphold);
                console.log("Event started ", event.type, this.timer);
            }, this));
            this.element.delegate(this.options.delegate, "mouseup.contextmenu", $.proxy(function(){
                if(this.timer){
                    console.log("Event ", event.type, "clear" + this.timer);
                    clearTimeout(this.timer);
                    this.timer = null;
                }
            }, this));
            */
			this._trigger("init");
		},
		/** Return menu jQuery object. */
		_getMenu: function(){
			// this.options.menu may be a string, jQuery or a function returning that.
			var $menu = this.options.menu;
			if( $.isFunction($menu) ){
				$menu = $menu();
			}
			return (typeof $menu === "string") ? $($menu) : $menu;
		},
		/** Return menu widget instance (works on pre and post jQueryUI 1.9). */
		_getMenuWidget: function(){
			var $menu = this._getMenu();
			return $menu.data("ui-menu") || $menu.data("menu");
		},
		/** Open dropdown. */
		_openMenu: function(event){
            var self = this, 
                $menu = this._getMenu(),
                openEvent = event;
		    // Prevent browser from opening the system context menu
		    event.preventDefault();
            // Also pass the target that the menu was triggered on as 'relatedTarget'.
		    // This is required because our _trigger() calls will create events
		    // that refer to the contextmenu's context (which is the target *container*) 
            event.relatedTarget = openEvent.target;
            
			if( this._trigger("beforeOpen", event) === false ){
				return false;
			}
			// Create - but hide - context-menu
			$menu
				.hide()
				.addClass("ui-contextmenu")
				// Create a menu instance that delegates events to our widget
				.menu({
					blur: $.proxy(this.options.blur, this),
					create: $.proxy(this.options.create, this),
					focus: $.proxy(this.options.focus, this),
					select: function(event, ui){
					    // Also pass the target that the menu was triggered on:
					    event.relatedTarget = openEvent.target;
						if( self._trigger.call(self, "select", event, ui) !== false ){
							self._closeMenu.call(self);
						}
					}
				});
			// Register global event handlers that close the dropdown-menu
			$(document).bind("keydown.contextmenu", function(event){
				if( event.which === $.ui.keyCode.ESCAPE ){
					self._closeMenu();
				}
			}).bind("mousedown.contextmenu touchstart.contextmenu", function(event){
				// Close menu when clicked outside menu
				if( !$(event.target).closest(".ui-menu-item").length ){
					self._closeMenu();
				}
			});
			$menu
			    .show() // required to fix positioning error (issue #)
				.css({
					position: "absolute",
					left: 0,
					top: 0
				}).position({
					my: "left top", 
					at: "left bottom", 
					of: event, 
					collision: "fit"
				}).hide()
				.slideDown("fast", function(){
					self._trigger.call(self, "open", event);
				});
		},
		/** Close dropdown. */
		_closeMenu: function(){
			var self = this, 
				$menu = this._getMenu();
            if(this.timer){
                clearTimeout(this.timer);
                this.timer = null;
            }
			$menu.fadeOut(function() {
				self._trigger("close");
			});
		},
        /**
         * Handle $().contextmenu("option", ...) calls. 
         */
        _setOption: function(key, value){
            $.Widget.prototype._setOption.apply(this, arguments);
        },
        /**
         * Open context menu on a specific target (must match options.delegate) 
         */
        open: function(target){
            var e = jQuery.Event("contextmenu", {target: target.get(0)});
            return this.element.trigger(e);
        }
	});
} (jQuery));
