/*!
 * Sprint JavaScript selector engine v1.3
 *
 * The third major revision of the Sprint JavaScript library, now only a selector engine.
 * Created by Ryan O'Hara (minitech)
 * http://git.io/ry
 *
 */

(function(window, undefined) {
	'use strict'; // We use strict mode in Sprint 3!
	
	// Some useful regular expressions:
	var simpleTagSelector = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;
	var simpleIdSelector = /^#([a-zA-Z_]|\\.)([a-zA-Z0-9_-]|\\.)*$/;
	var simpleClassSelector = /^(\.([a-zA-Z_]|\\.)([a-zA-Z0-9_-]|\\.)*)*$/;
	
	var escapedCharacter = /\\(.)/g;
	
	// Check if comments are included in `getElementsByTagName('*')` and `children`: (this happens in IE8 and under)
	var elementsRequireFiltering = (function() {
		var el = document.createElement('div');
		el.innerHTML = 'a<!-- -->b';
		return !!el.children.length;
	})();
	
	var filter = Array.prototype.filter ?
		function(o, p) {
			return Array.prototype.filter.call(o, p);
		} :
		function(o, p) {
			var r = [];
			var i, l;
			
			for(i = 0, l = o.length; i < l; i++) {
				if(p(o[i])) {
					r.push(o[i]);
				}
			}
			
			return r;
		};
	
	/**
	 * Returns the second argument passed to it.
	 */
	function second(a, b) {
		return b;
	}
	
	/**
	 * Returns `true` if `obj` appears to be an HTML element, `false` otherwise.
	 */
	function isElement(obj) {
		return obj.nodeType === 1;
	}
	
	/**
	 * Returns an array containing `obj` if `obj` is truthy, or an empty array otherwise.
	 */
	function wrapOrEmpty(obj) {
		if(obj) {
			return [obj];
		}
		
		return [];
	}
	
	/**
	 * Converts the specified object to an array.
	 */
	function toArray(obj) {
		var r = new Array(obj.length);
	
		for(var i = 0, l = obj.length; i < l; i++) {
			r[i] = obj[i];
		}
		
		return r;
	}
	
	/**
	 * Removes all backslashes (\) from a string.
	 */
	function stripSlashes(str) {
		return str.replace(escapedCharacter, second);
	}

	/**
	 * Finds all elements within `context` matching the selector `selector` and returns them as an array.
	 */
	function Sprint(selector, context) {
		// Make sure it's a valid context:
		if(context && context.nodeType !== 1 && context.nodeType !== 9) {
			throw new TypeError('The context passed to Sprint() was invalid. Expected 1, 9 but got ' + context.nodeType);
		}
	
		// Try most optimizations here:
		var contextIsDocument = context === document;
		
		if(!context) {
			context = document;
			contextIsDocument = true;
		}
		
		if(selector === 'body') {
			if(contextIsDocument || context === document.documentElement) {
				return wrapOrEmpty(document.body);
			}
			
			// There should never be another <body> in the document.
			// If there is... who cares! We enforce good habits.
			return [];
		}
		
		if(selector === 'html') {
			if(contextIsDocument) {
				return wrapOrEmpty(document.documentElement);
			}
			
			// Same as for 'body':
			return [];
		}
		
		if(selector === '*') {
			if(elementsRequireFiltering) {
				return filter(context.getElementsByTagName('*'), isElement);
			} else {
				return toArray(context.getElementsByTagName('*'));
			}
		}
		
		if(simpleTagSelector.test(selector)) {
			return toArray(context.getElementsByTagName(selector));
		}
		
		if(simpleIdSelector.test(selector)) {
			return wrapOrEmpty(document.getElementById(stripSlashes(selector.substring(1))));
		}
		
		if(context.getElementsByClassName && simpleClassSelector.test(selector)) {
			return toArray(context.getElementsByClassName(selector.replace(/\./g, ' ')));
		}
		
		if(context.querySelectorAll) {
			try {
				return toArray(context.querySelectorAll(selector));
			} catch(ex) {
				// Ignore it and move on.
			}
		}
	}
	
	// Get ready for no-conflict mode:
	var oldSprintDefined, oldSprint;
	
	if('Sprint' in window) {
		oldSprintDefined = true;
		oldSprint = window.Sprint;
	}
	
	/**
	 * Removes Sprint from the global namespace.
	 */
	Sprint.noConflict = function() {
		if(oldSprintDefined) {
			window.Sprint = oldSprint;
		} else {
			delete window.Sprint;
		}
	};
	
	// Finally, assign `Sprint` to `window` for public access:
	window.Sprint = Sprint;
})(this);