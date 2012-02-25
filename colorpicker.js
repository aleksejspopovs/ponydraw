/*
	This file is a part of David Durman's Flexi Color Picker project.
	For more information, visit http://www.daviddurman.com/flexi-color-picker
	Modified by mariofag for PonyDraw

	Flexi Color Picker is licensed under the MIT license:

	Copyright (c) 2011 David Durman

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

(function(window, document, undefined) {

	var type = (window.SVGAngle || document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1") ? "SVG" : "VML"),
		picker, slide, hueOffset = 15, svgNS = 'http://www.w3.org/2000/svg';

	/**
	 * Return mouse position relative to the element el.
	 */
	function mousePosition(evt) {
		// IE:
		if (window.event && window.event.contentOverflow !== undefined) {
			return { x: window.event.offsetX, y: window.event.offsetY };
		}
		// Webkit:
		if (evt.offsetX !== undefined && evt.offsetY !== undefined) {
			return { x: evt.offsetX, y: evt.offsetY };
		}
		// Firefox:
		var wrapper = evt.target.parentNode.parentNode;
		return { x: evt.layerX - wrapper.offsetLeft, y: evt.layerY - wrapper.offsetTop };
	}

	/**
	 * Create SVG element.
	 */
	function $(el, attrs, children) {
		el = document.createElementNS(svgNS, el);
		for (var key in attrs)
			el.setAttribute(key, attrs[key]);
		if (Object.prototype.toString.call(children) != '[object Array]') children = [children];
		var i = 0, len = (children[0] && children.length) || 0;
		for (; i < len; i++)
			el.appendChild(children[i]);
		return el;
	}

	/**
	 * Create slide and picker markup depending on the supported technology.
	 */
	if (type == 'SVG') {

		slide = $('svg', { xmlns: 'http://www.w3.org/2000/svg', version: '1.1', width: '100%', height: '100%' },
				  [
					  $('defs', {},
						$('linearGradient', { id: 'gradient-hsv', x1: '0%', y1: '100%', x2: '0%', y2: '0%'},
						  [
							  $('stop', { offset: '0%', 'stop-color': '#FF0000', 'stop-opacity': '1' }),
							  $('stop', { offset: '13%', 'stop-color': '#FF00FF', 'stop-opacity': '1' }),
							  $('stop', { offset: '25%', 'stop-color': '#8000FF', 'stop-opacity': '1' }),
							  $('stop', { offset: '38%', 'stop-color': '#0040FF', 'stop-opacity': '1' }),
							  $('stop', { offset: '50%', 'stop-color': '#00FFFF', 'stop-opacity': '1' }),
							  $('stop', { offset: '63%', 'stop-color': '#00FF40', 'stop-opacity': '1' }),
							  $('stop', { offset: '75%', 'stop-color': '#0BED00', 'stop-opacity': '1' }),
							  $('stop', { offset: '88%', 'stop-color': '#FFFF00', 'stop-opacity': '1' }),
							  $('stop', { offset: '100%', 'stop-color': '#FF0000', 'stop-opacity': '1' })
						  ]
						 )
					   ),
					  $('rect', { x: '0', y: '0', width: '100%', height: '100%', fill: 'url(#gradient-hsv)'})
				  ]
				 );

		picker = $('svg', { xmlns: 'http://www.w3.org/2000/svg', version: '1.1', width: '100%', height: '100%' },
				   [
					   $('defs', {},
						 [
							 $('linearGradient', { id: 'gradient-black', x1: '0%', y1: '100%', x2: '0%', y2: '0%'},
							   [
								   $('stop', { offset: '0%', 'stop-color': '#000000', 'stop-opacity': '1' }),
								   $('stop', { offset: '100%', 'stop-color': '#CC9A81', 'stop-opacity': '0' })
							   ]
							  ),
							 $('linearGradient', { id: 'gradient-white', x1: '0%', y1: '100%', x2: '100%', y2: '100%'},
							   [
								   $('stop', { offset: '0%', 'stop-color': '#FFFFFF', 'stop-opacity': '1' }),
								   $('stop', { offset: '100%', 'stop-color': '#CC9A81', 'stop-opacity': '0' })
							   ]
							  )
						 ]
						),
					   $('rect', { x: '0', y: '0', width: '100%', height: '100%', fill: 'url(#gradient-white)'}),
					   $('rect', { x: '0', y: '0', width: '100%', height: '100%', fill: 'url(#gradient-black)'})
				   ]
				  );

	} else if (type == 'VML') {
		slide = [
			'<DIV style="position: relative; width: 100%; height: 100%">',
			'<v:rect style="position: absolute; top: 0; left: 0; width: 100%; height: 100%" stroked="f" filled="t">',
			'<v:fill type="gradient" method="none" angle="0" color="red" color2="red" colors="8519f fuchsia;.25 #8000ff;24903f #0040ff;.5 aqua;41287f #00ff40;.75 #0bed00;57671f yellow"></v:fill>',
			'</v:rect>',
			'</DIV>'
		].join('');

		picker = [
			'<DIV style="position: relative; width: 100%; height: 100%">',
			'<v:rect style="position: absolute; left: -1px; top: -1px; width: 101%; height: 101%" stroked="f" filled="t">',
			'<v:fill type="gradient" method="none" angle="270" color="#FFFFFF" opacity="100%" color2="#CC9A81" o:opacity2="0%"></v:fill>',
			'</v:rect>',
			'<v:rect style="position: absolute; left: 0px; top: 0px; width: 100%; height: 101%" stroked="f" filled="t">',
			'<v:fill type="gradient" method="none" angle="0" color="#000000" opacity="100%" color2="#CC9A81" o:opacity2="0%"></v:fill>',
			'</v:rect>',
			'</DIV>'
		].join('');

		if (!document.namespaces['v'])
			document.namespaces.add('v', 'urn:schemas-microsoft-com:vml', '#default#VML');
	}

	/**
	 * Convert HSV representation to RGB HEX string.
	 * Credits to http://www.raphaeljs.com
	 */
	function hsv2rgb(h, s, v) {
		var R, G, B, X, C;
		h = (h % 360) / 60;
			C = v * s;
		X = C * (1 - Math.abs(h % 2 - 1));
		R = G = B = v - C;

		h = ~~h;
		R += [C, X, 0, 0, X, C][h];
		G += [X, C, C, X, 0, 0][h];
		B += [0, 0, X, C, C, X][h];

		var r = R * 255,
			g = G * 255,
			b = B * 255;
		return { r: r, g: g, b: b, hex: "#" + (16777216 | b | (g << 8) | (r << 16)).toString(16).slice(1) };
	}

	/**
	 * Convert RGB representation to HSV.
	 * r, g, b can be either in <0,1> range or <0,255> range.
	 * Credits to http://www.raphaeljs.com
	 */
	function rgb2hsv(r, g, b) {
		if (r > 1 || g > 1 || b > 1) {
			r /= 255;
			g /= 255;
			b /= 255;
		}
		var H, S, V, C;
		V = Math.max(r, g, b);
		C = V - Math.min(r, g, b);
		H = (C == 0 ? null :
			 V == r ? (g - b) / C :
			 V == g ? (b - r) / C + 2 :
					  (r - g) / C + 4);
		H = (H % 6) * 60;
		S = C == 0 ? 0 : C / V;
		return { h: H, s: S, v: V };
	}

	/**
	 * Return click event handler for the slider.
	 * Sets picker background color and calls ctx.callback if provided.
	 */
	function slideListener(ctx, slideElement, pickerElement) {
		return function(evt) {
			evt = evt || window.event;
			var mouse = mousePosition(evt);
			ctx.h = mouse.y / slideElement.offsetHeight * 360 + hueOffset;
			ctx.s = ctx.v = 1;
			var c = hsv2rgb(ctx.h, 1, 1);
			pickerElement.style.backgroundColor = c.hex;
			ctx.callback && ctx.callback(c.hex, { h: ctx.h - hueOffset, s: ctx.s, v: ctx.v }, { r: c.r, g: c.g, b: c.b }, undefined, mouse);
			ctx.positionIndicators(mouse);
		}
	};

	/**
	 * Return click event handler for the picker.
	 * Calls ctx.callback if provided.
	 */
	function pickerListener(ctx, pickerElement) {
		return function(evt) {
			evt = evt || window.event;
			var mouse = mousePosition(evt),
				width = pickerElement.offsetWidth,
				height = pickerElement.offsetHeight;

			evt.preventDefault();
			ctx.s = mouse.x / width;
			ctx.v = (height - mouse.y) / height;
			var c = hsv2rgb(ctx.h, ctx.s, ctx.v);
			ctx.callback && ctx.callback(c.hex, { h: ctx.h - hueOffset, s: ctx.s, v: ctx.v }, { r: c.r, g: c.g, b: c.b }, mouse);
			ctx.positionIndicators(undefined, mouse);
		}
	};

	function slideMouseDownListener(ctx, slideElement, pickerElement) {
		return function(evt) {
			slideListener(ctx, slideElement, pickerElement)(evt);
			slideElement.onmousemove = slideListener(ctx, slideElement, pickerElement);
		}
	}

	function slideMouseUpListener(ctx, slideElement, pickerElement) {
		return function(evt) {
			slideElement.onmousemove = null;
		}
	}

	function pickerMouseDownListener(ctx, pickerElement) {
		return function(evt) {
			pickerListener(ctx, pickerElement)(evt);
			pickerElement.onmousemove = pickerListener(ctx, pickerElement);
		}
	}

	function pickerMouseUpListener(ctx, pickerElement) {
		return function(evt) {
			pickerElement.onmousemove = null;
		}
	}

	/**
	 * ColorPicker.
	 * @param {DOMElement} slideElement HSV slide element.
	 * @param {DOMElement} pickerElement HSV picker element.
	 * @param {Function} callback Called whenever the color is changed provided chosen color in RGB HEX format as the only argument.
	 */
	function ColorPicker(slideWrapper, pickerWrapper, callback) {
		if (!(this instanceof ColorPicker)) return new ColorPicker(slideWrapper, pickerWrapper, callback);

		this.callback = callback;
		this.h = 0;
		this.s = 1;
		this.v = 1;

		this.pickerElement = document.createElement('div');
		this.pickerElement.className = 'picker';
		pickerWrapper.appendChild(this.pickerElement);

		this.pickerIndicator = document.createElement('div');
		this.pickerIndicator.className = 'picker-indicator';
		pickerWrapper.appendChild(this.pickerIndicator);

		this.slideElement = document.createElement('div');
		this.slideElement.className = 'slide';
		slideWrapper.appendChild(this.slideElement);

		this.slideIndicator = document.createElement('div');
		this.slideIndicator.className = 'slide-indicator';
		slideWrapper.appendChild(this.slideIndicator);

		this.positionIndicators = function(mouseSlide, mousePicker) {
			if (mouseSlide) {
				this.pickerIndicator.style.left = 'auto';
				this.pickerIndicator.style.right = '0px';
				this.pickerIndicator.style.top = '0px';
				this.slideIndicator.style.top = (mouseSlide.y - this.slideIndicator.offsetHeight/2) + 'px';
			}
			if (mousePicker) {
				this.pickerIndicator.style.top = (mousePicker.y - this.pickerIndicator.offsetHeight/2) + 'px';
				this.pickerIndicator.style.left = (mousePicker.x - this.pickerIndicator.offsetWidth/2) + 'px';
			}
		};

		if (type == 'SVG') {
			this.slideElement.appendChild(slide.cloneNode(true));
			this.pickerElement.appendChild(picker.cloneNode(true));
		} else {
			this.slideElement.innerHTML = slide;
			this.pickerElement.innerHTML = picker;
		}

		slideWrapper.addEventListener('mousedown', slideMouseDownListener(this, this.slideElement, this.pickerElement));
		slideWrapper.addEventListener('mouseup', slideMouseUpListener(this, this.slideElement, this.pickerElement));
		pickerWrapper.addEventListener('mousedown', pickerMouseDownListener(this, this.pickerElement));
		pickerWrapper.addEventListener('mouseup', pickerMouseUpListener(this, this.pickerElement));
	};

	/**
	 * Sets color of the picker in hsv/rgb/hex format.
	 * @param {object} ctx ColorPicker instance.
	 * @param {object} hsv Object of the form: { h: <hue>, s: <saturation>, v: <value> }.
	 * @param {object} rgb Object of the form: { r: <red>, g: <green>, b: <blue> }.
	 * @param {string} hex String of the form: #RRGGBB.
	 */
	 function setColor(ctx, hsv, rgb, hex) {
		ctx.h = hsv.h % 360;
		ctx.s = hsv.s;
		ctx.v = hsv.v;
		var c = hsv2rgb(ctx.h, ctx.s, ctx.v),
			mouseSlide = {
				y: (ctx.h * ctx.slideElement.offsetHeight) / 360,
				x: 0    // not important
			},
			pickerHeight = ctx.pickerElement.offsetHeight,
			mousePicker = {
				x: ctx.s * ctx.pickerElement.offsetWidth,
				y: pickerHeight - ctx.v * pickerHeight
			};
		ctx.pickerElement.style.backgroundColor = hsv2rgb(ctx.h, 1, 1).hex;
		ctx.callback && ctx.callback(hex || c.hex, { h: ctx.h, s: ctx.s, v: ctx.v }, rgb || { r: c.r, g: c.g, b: c.b }, mousePicker, mouseSlide);
		ctx.positionIndicators(mouseSlide, mousePicker);
	};

	/**
	 * Sets color of the picker in rgb format.
	 * @param {object} rgb Object of the form: { r: <red>, g: <green>, b: <blue> }.
	 */
	ColorPicker.prototype.setHsv = function(hsv) {
		setColor(this, hsv);
	};

	/**
	 * Sets color of the picker in rgb format.
	 * @param {object} rgb Object of the form: { r: <red>, g: <green>, b: <blue> }.
	 */
	ColorPicker.prototype.setRgb = function(rgb) {
		setColor(this, rgb2hsv(rgb.r, rgb.g, rgb.b), rgb);
	};

	/**
	 * Sets color of the picker in hex format.
	 * @param {string} hex Hex color format #RRGGBB.
	 */
	ColorPicker.prototype.setHex = function(hex) {
		setColor(this, rgb2hsv(parseInt(hex.substr(1, 2), 16), parseInt(hex.substr(3, 2), 16), parseInt(hex.substr(5, 2), 16)), undefined, hex);
	};

	ColorPicker.hsv2rgb = hsv2rgb;
	ColorPicker.rgb2hsv = rgb2hsv;

	window.ColorPicker = ColorPicker;

})(window, window.document);
