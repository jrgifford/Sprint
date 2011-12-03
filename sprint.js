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
	var quotes = /(?=['"])/g;
	
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
	
	function escapeQuotes(str) {
		return str.replace(quotes, '\\');
	}
	
	/**
	 * Tokenizes the specified selector into an array of tokens.
	 * Not currently used because order is enforced.
	 *\/
	var singleTokens = '()+~>,';
		
	function tokenizeSelector(selector) {
		var tokens = [];
		var addWhitespace = false;
		var shouldAddWhitespace = false;
		var isEscaped = false;
		var isSingleQuoted = false;
		var currentToken = '';
		var i = 0, c;
		
		function pushToken() {
			if(currentToken) {
				tokens.push(currentToken);
				currentToken = '';
			}
		}
		
		loop: for(; c = selector.charAt(i); i++) {
			if(isEscaped) {
				// The character is escaped, so we'll add it regardless.
				isEscaped = false;
			} else if(~singleTokens.indexOf(c)) {
				// The whitespace is meaningless.
				addWhitespace = false;
				shouldAddWhitespace = false;
				
				// Add the last token, *and* add this as a separate token:
				pushToken();
				tokens.push(c);
				
				// Also, we don't add this character, since it was already added:
				continue loop;
			} else if(c === ' ' || c === '\t') {
				// It's whitespace; could be meaningless, but might not be.
				// Set our whitespace flag variable, if we're allowed:
				if(shouldAddWhitespace) {
					addWhitespace = true;
				}
				
				// Also, we'll add the last token:
				pushToken();
			} else {
				// Whitespace *will* matter now, and if whitespace exists, it matters.
				shouldAddWhitespace = true;
				if(addWhitespace) {
					tokens.push(' ');
					addWhitespace = false;
				}
			}
			
			// Finally, add the current character to the current token:
			currentToken += c;
		}
		
		// If there's still a token, we add it. Any whitespace here is also ignored.
		pushToken();
		
		return tokens;
	}
	
	window.tokenize = tokenizeSelector;*/
	
	function compileSelector(selector) {
		// Order: [tagSelector]{[idSelector][classSelector]*}[attributeSelector]*[pseudoClassSelector]*
		var i, j, type;
		var tag, id;
		var fText = [];
		
		i = selector.search(/[^a-zA-Z0-9_-]/); // TODO: Enforce tag limitations?
		tag = selector.substr(0, i); // i will not be -1 because if we got here, the selector shouldn't be empty
		type = selector.charAt(i);
		
		if(type === '#') {
			j = selector.substr(i + 1).search(/[^a-zA-Z0-9_-]/); // TODO: Escaping?
			
			if(~j) {
				// Something else there:
				id = selector.substr(i + 1, j);
			} else {
				// The rest of it is ID:
				id = selector.substr(i + 1);
			}
		}
		
		if(tag) {
			fText.push('el.tagName.toLowerCase()===\'' + escapeQuotes(tag.toLowerCase()) + '\'');
		}
		
		if(id) {
			fText.push('el.id===\'' + escapeQuotes(id) + '\'');
		}
		
		return new Function(['el'], 'return ' + fText.join('&&') + ';');
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
			return wrapOrEmpty(document.getElementById(stripSlashes(selector.substr(1))));
		}
		
		if(context.getElementsByClassName && simpleClassSelector.test(selector)) {
			return toArray(context.getElementsByClassName(selector.replace(/\./g, ' ')));
		}
		
		if(context.querySelectorAll) {
			try {
				//// DEBUG:
				//throw new Error();
			
				return toArray(context.querySelectorAll(selector));
			} catch(ex) {
				// Ignore it and move on.
			}
		}
		
		// If we got here, there are no optimizations. Compile the selector and go:
		// TODO:
		return filter(context.getElementsByTagName('*'), compileSelector(selector));
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
		
		return Sprint;
	};
	
	// Finally, assign `Sprint` to `window` for public access:
	window.Sprint = Sprint;
})(this);