## Sprint 1.3 Selector Specification

---

### General structure:

    [whitespace]* ;Leading whitespace
    [
    	[tagSelector][idSelector][classSelector]*[pseudoClass]* ;Single selector
    	[whitespace]* ;Padding whitespace
    	combinator ;Combinator, see below
    	[whitespace]* ;Padding whitespace
    ]* ;Other selectors
    [tagSelector]{[idSelector][classSelector]*}[attributeSelector]*[pseudoClass]* ;Root selector
    [whitespace]* ;Trailing whitespace

**Multiple selectors may be combined** using `,`, with optional padding.

The selectors passed to `Sprint()` **must be in the specified order**, i.e. class selectors before pseudo-class selectors; however, items within `{}` may be rearranged, i.e. class selectors may also be found before ID selectors (although this isn't recommended usually<sup>1</sup>).

---

### Combinators:

The standard CSS3 combinators are as follows:

 - `(space)`: Descendant selector. `a b` matches all `b` elements descended from an `a` element.
 - `>`: Direct-child selector. `a > b` matches all `b` elements that are children of an `a` element.
 - `+`: Adjacent-sibling selector. `a + b` matches all `b` elements that are immediately preceded by an `a` element.
 - `~`: General-sibling selector. `a ~ b` matches all `b` elements that are preceded by an `a` element.

In addition to the standard combinators, Sprint introduces new combinators:

 - `&`: The "has-descendant" selector. The following item must be surrounded in parentheses `()`. For example, `a & (b c)` will match all `a` elements that have a descendant `c` that is a descendant of a `b`.
 - `&>`: The "has-child" selector. The following item must be surrounded in parentheses. For example, `a &> (b c)` will match all `a` elements that have children `b` that have a descendant of type `c`.
 - `&+` and `&~` work in the same manner.

---

### Miscellaneous changes:

You may no longer escape tag name selectors, period. Please don't make tags like that in the first place.

---

### `Sprint()` function:

`Sprint` takes the following arguments:

 - `selector`: The selector that the selected items must match.
 - `context`: The element in which to search for elements. This can be `null` or `undefined`. By default, it is `document`. If it is not passed an element or document, it throws a `TypeError`.

<sup>1</sup> When items may be identified by ID alone and their class does not matter, it is preferred to refer to them solely by ID to allow optimization.