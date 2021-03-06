/**
* @preserve $dom library (v0.9.1b) copyright 2009, Keith Clark
* Licensed under the MIT License.
* http://www.keithclark.co.uk/
*/


(function ()
{
    var 
    /* these references exist to reduce size in Dean Edwards packer */
		_document = document,
		_true = true,
		_false = false,
		_undefined = undefined,
		animTimer, time, animItems = [],

    /* dom vars */
		re_css_property = /^(.*?)(px|deg)?$/,
		re_selector_fragment = /^\s*([>+~])?\s*([*a-z0-9\-_]+)?(?:#([a-z0-9\-_]+))?(?:\.([a-z0-9\.\-_]+))?\s*/i,
		isIE = /*@cc_on!@*/_false,
		loadHandlers = [],
        ieEvents = [],

    // styleAlias is a css-name to camelCaseName lookup that's automatically populated when calling
    // the _getStyle() and _setStyle() methods. It's pre-populated with the float css lookup.

		styleAlias = { "float": isIE ? "styleFloat" : "cssFloat" },


    // style handers are used to extend or override existing css properties. When calling _getStyle()
    // or _setStyle() this object is checked first to see if a get/set handler exists for the passed 
    // propertyName. Handlers are camelCase.

		styleHandlers = isIE
		?
    // Internet Explorer style handlers
			{
			"opacity":
				{
				    set: function (e, v)
				    {
				        var f = e["filters"]["alpha"];

				        if (!f)
				        {
				            e.style.filter += " Alpha(opacity=" + (v * 100) + ")";
				        }
				        else
				        {
				            f.opacity = v * 100;
				        }
				    },
				    get: function (e)
				    {
				        var f = e["filters"]["alpha"];
				        return f ? f.opacity / 100 : 1;
				    }
				},
			"width":
				{
				    get: function (e) { return e.style.width || e.clientWidth || e.offsetWidth }
				},
			"height":
				{
				    get: function (e) { return e.style.height || e.clientHeight || e.offsetHeight }
				}
			}
		:
    // Standards based style handlers

			{
			"borderWidth":
				{
				    get: function (e)
				    {
				        return _getStyle(e, "border-left-width");
				    }
				},
			"padding":
				{
				    get: function (e)
				    {
				        return _getStyle(e, "padding-left");
				    }
				},
			"margin":
				{
				    get: function (e)
				    {
				        return _getStyle(e, "margin-left");
				    }
				}
			},

     _addEvent = isIE
        ?
            function (elm, name, handler)
            {
                var eventKey = elm.uniqueID + name + handler;
                ieEvents[eventKey] = function () { var e = window.event; e.target = e.srcElement; handler(e); }
                elm.attachEvent("on" + name, ieEvents[eventKey]);
            }
        :
            function (elm, name, handler)
            {
                elm.addEventListener(name, handler, false);
            },

     _removeEvent = isIE
        ?
            function (elm, name, handler)
            {
                var eventKey = elm.uniqueID + name + handler;
                elm.detachEvent("on" + name, ieEvents[eventKey]);
                delete (ieEvents[eventKey]);
            }
        :
            function (elm, name, handler)
            {
                elm.removeEventListener(name, handler, false);
            },

    _getStyle = isIE
		?
			function (elm, property)
			{
			    var prop = _getAlias(property), handler = styleHandlers[prop];
			    return ((handler && handler.get) ? handler.get(elm) : elm.currentStyle[prop]);
			}
		:
			function (elm, property)
			{
			    var prop = _getAlias(property), handler = styleHandlers[prop];
			    return handler && handler.get ?
					handler.get(elm)
				:
					elm.ownerDocument.defaultView.getComputedStyle(elm, null).getPropertyValue(property)
			};

    function _setStyle(elm, property, value)
    {
        var prop = _getAlias(property), handler = styleHandlers[prop];
        return (handler && handler.set) ? handler.set(elm, value) : elm.style[prop] = value;
    }


    function _getAlias(property)
    {
        return styleAlias[property] || (styleAlias[property] = property.replace(/\-(.)/g, function (m, l) { return l.toUpperCase() }))
    }


    function _style(elm, property, value)
    {
        if (value === _undefined)
        {
            if (typeof property == "string")
            {
                return _getStyle(elm, property) || 0;
            }
            for (var x in property)
            {
                _setStyle(elm, x, property[x]);
            }
        }
        else
        {
            _setStyle(elm, property, value);
        }
    }


    // _sel returns an array of simple selector fragment objects from the passed complex selector string
    function _sel(selector)
    {
        var f, out = [];
        if (typeof selector == "string")
        {
            while (selector != "")
            {
                f = selector.match(re_selector_fragment);
                if (f[0] == "") return null;
                out.push({ rel: f[1], tag: f[2], uTag: (f[2] || "").toUpperCase(), id: f[3], classes: (f[4]) ? f[4].split(".") : _undefined });
                selector = selector.substring(f[0].length);
            }
        }
        return out;
    }


    // determines if the passed element is a descentand of anthor element
    function _isDescendant(elm, ancestor)
    {
        while ((elm = elm.parentNode) && elm != ancestor) { }
        return elm !== null;
    }


    // $dom's CSS selector
    function _get(refelm, selector)
    {

        function find(elm, selectorFragment)
        {
            var c, results = selectorFragment.id
			?
				((c = ((elm && elm.ownerDocument) || _document).getElementById(selectorFragment.id)) && _isDescendant(c, elm)) ? [c] : []
			:
				toArray(elm.getElementsByTagName(selectorFragment.tag ? selectorFragment.uTag : "*"));
            c = results.length;

            if (c > 0 && (selectorFragment.id || selectorFragment.classes))
            {
                while (c--)
                {
                    if (!_match(results[c], selectorFragment)) results.splice(c, 1)
                }
            }
            return results
        }


        function toArray(nodes)
        {
            try
            {
                return Array.prototype.slice.call(nodes)
            }
            catch (e)
            {
                var arr = [];
                for (var i = 0; i < nodes.length; i++) arr.push(nodes[i]);
                return arr
            }
        }


        function contains(o)
        {
            for (var c = results.length; c--; )
            {
                if (results[c] === o) return _true;
            }
            return _false
        }

        var results = [],
			elements = [refelm],
			selectorFragments = _sel(selector),
			c, lc,
			d, ld,
			e, le,
			fragment,
			elm, elms;

        if (selectorFragments.length == 0) selectorFragments = [{}];

        for (c = 0, lc = selectorFragments.length; c < lc; c++)
        {
            fragment = selectorFragments[c];
            for (d = 0, ld = elements.length; d < ld; d++)
            {
                elm = elements[d];
                switch (fragment.rel)
                {
                    case ">":
                        var children = elm.childNodes;
                        for (e = 0, le = children.length; e < le; e++)
                        {
                            if (_match(children[e], fragment))
                            {
                                results.push(children[e])
                            }
                        }
                        break;

                    case "~":
                        while (elm = elm.nextSibling)
                        {
 							
							if (_match(elm, fragment))
                            {
                                if (contains(elm))
                                {
                                    break;
                                }
                                results.push(elm);
                            }
                        }
                        break;

                    case "+":
                        while ((elm = elm.nextSibling) && elm.nodeType != 1) { };
                        if (elm && _match(elm, fragment))
                        {
                            results.push(elm)
                        }
						
                        break;

                    default:
                        elms = find(elm, fragment);
                        if (c > 0)
                        {
                            for (e = 0, le = elms.length; e < le; e++)
                            {
                                if (!contains(elms[e])) results.push(elms[e])
                            }
                        }
                        else { results = results.concat(elms) }
                        break;
                }
            }

            if (results.length === 0) return [];
            elements = results.splice(0, results.length)

        }
        return elements
    }


    function _match(elm, selector)
    {
        return (elm.nodeType == 1 && selector) &&
		!(selector.tag && selector.uTag != elm.tagName) &&
		!(selector.id && selector.id != elm.id) &&
		!(selector.classes && !_hasClasses(elm, selector.classes))
    }

    function _find(elm, property, selectorFragment)
    {
        selectorFragment = _sel(selectorFragment);
		//if(selectorFragment===_undefined || !selectorFragment.tag)selectorFragment = _sel(selectorFragment);
        selectorFragment = selectorFragment.length > 0 ? selectorFragment[0] : null;
        while (elm && (elm = elm[property]) && (selectorFragment ? (!_match(elm, selectorFragment)) : (elm.nodeType != 1))) { }
        return elm
    }

    function _hasClasses(elm, classNames)
    {
        if (elm.className == "") return _false;
        for (var c = 0; c < classNames.length; c++)
        {
            if (!$dom["hasClass"](elm, classNames[c])) { return _false }
        }
        return _true
    }


    function _removeAnim(index, fin)
    {
        var item = animItems.splice(index, 1)[0];
        if (typeof item.callback == "function")
        {
            item.callback(fin, item.elm)
        }
    }

    function _anim(elm, properties, duration, callback)
    {
        var property, props = [], s, e, i = -1, c;

        for (c = animItems.length - 1; c >= 0; c--)
        {
            if (animItems[c].elm == elm)
            {
                i = c; break;
            }
        }

        if (properties === _undefined) return i > -1;
        if (i > -1) _removeAnim(i, _false);

        if (duration === _undefined) duration = 500;


        for (property in properties)
        {
            s = re_css_property.exec(_style(elm, property));
            e = re_css_property.exec(properties[property]);
            props[property] = { s: parseFloat(s[1]), e: parseFloat(e[1]), u: s[2] || e[2] || "" }
        }

        animItems.push({ elm: elm, startTime: new Date(), properties: props, callback: callback, duration: duration });

        if (animTimer == null)
        {
            animTimer = setInterval(function ()
            {
                for (var c = animItems.length - 1; c >= 0; c--)
                {
                    var styles = {},
					prop,
					style,
					anim = animItems[c],
                    duration = anim.duration,
					ticks = new Date() - anim.startTime,
					ref = 1 - (0.5 - (Math.cos(ticks / duration * (Math.PI)) / 2));

                    for (prop in anim.properties)
                    {
                        style = anim.properties[prop];
                        styles[prop] = Number(ticks >= duration
							?
								style.e
							:
								style.s > style.e
								?
									style.e + (style.s - style.e) * ref
								:
									style.s + (style.e - style.s) * (1 - ref)).toFixed(2) + style.u;

                        if (styles[prop] == "NaNpx") styles[prop] = "0";
                    }
                    _style(anim.elm, styles);

                    if (ticks >= duration)
                    {
                        _removeAnim(c, _true);
                    }
                }

                if (animItems.length == 0)
                {
                    animTimer = clearInterval(animTimer)
                }
            }, 10)
        }
    }



    function dom()
    {
        var done, timer, handler, fn = function (e)
        {
            if (!done)
            {
                done = true;
                if (timer) timer = clearTimeout(timer);
                for (handler in loadHandlers) { loadHandlers[handler]() }
            }
        };

        window.onload = fn;

        if (_document.addEventListener)
        {
            _document.addEventListener('DOMContentLoaded', fn, _false)
        }


        (function ()
        {
            var ready = /loaded|complete/.test(_document.readyState);
            if (!ready && isIE)
            {
                try
                {
                    // Diego Perini's doScroll trick
					_document.documentElement.doScroll("left");
                    ready = _true
                }
                catch (e) { }
            }
            if (ready)
            {
                fn(/*{ type: "timer" }*/);
            }
            else
            {
                setTimeout(arguments.callee, 50);
            }
        })();
    }


    dom["prototype"] =
	{
	    /* -- Experimental methods --*/

	    "create": function (selector, doc) { var s = _sel(selector)[0], e = (doc || _document).createElement(s.tag); if (s.id) { e.id = s.id }; if (s.classes) { e.className = s.classes.join(" ") }; return e },
	    "onready": function (handler) { loadHandlers.push(handler) },

	    /* events */
	    "addEvent": _addEvent,
	    "removeEvent": _removeEvent,

	    /* selections */
	    "get": function (selector, doc) { return this["descendants"]((doc || _document), selector) },
	    "descendants": function (elm, selector) { return _get(elm, selector) },
	    "ancestor": function (elm, selector) { return _find(elm, "parentNode", selector) },
	    "next": function (elm, selector) { return _find(elm, "nextSibling", selector) },
	    "previous": function (elm, selector) { return _find(elm, "previousSibling", selector) },
	    "first": function (elm, selector) { var p = elm.parentNode; return _find(p, "firstChild", selector) || this["next"](p.firstChild, selector) },
	    "last": function (elm, selector) { var p = elm.parentNode; return _find(p, "lastChild", selector) || this["previous"](p.lastChild, selector) },

	    /* styling */
	    "hasClass": function (elm, className) { return (" " + elm.className + " ").indexOf(" "+className+" ") > -1 },
	    "addClass": function (elm, className) { if (!this["hasClass"](elm, className)) elm.className += (elm.className != "" ? " " : "") + className },
	    "removeClass": function (elm, className) { if (this["hasClass"](elm, className)) elm.className = elm.className.replace(new RegExp("(^|\\s)" + className + "(\\s|$)"), " ").replace(/\s$/, "") },
	    "toggleClass": function (elm, className, expr) { this[(expr === _true) ? "addClass" : "removeClass"](elm, className) },
	    "style": function (elm, property, value) { return _style(elm, property, value) },
	    "transform": function (elm, properties, duration, callback) { return _anim(elm, properties, duration, callback) }
	};

    window["$dom"] = new dom();
})();

