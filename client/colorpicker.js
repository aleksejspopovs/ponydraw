/*
© 2012 Aleksejs Popovs <me@popoffka.ru>
Licensed under MIT License. See ../LICENSE for more info.
*/

function getOffset(e) {
	return {
		x: typeof e.offsetX != 'undefined' ? e.offsetX : e.layerX,
		y: typeof e.offsetY != 'undefined' ? e.offsetY : e.layerY
	}
}

function vectorIntersection(a, b) {
	// returns NaN if a and b are parallel
	return ((b.x - a.x) * b.vy - (b.y - a.y) * b.vx) / (b.vy * a.vx - b.vx * a.vy);
}

function rgb2hsv(r, g, b){
    r /= 255;
    g /= 255;
    b /= 255;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if(max == min){
        h = 0; // achromatic
    }else{
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return {h: h, s: s, v: v };
}

function hsv2rgb(h, s, v){
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return {r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255)};
}


function drawSlider(ctx, x, y, w, h) {
	var gr = ctx.createLinearGradient(0, 0, 0, h - 1);

	var colors = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000'];
	for (var i = 0; i < colors.length; i++) {
		gr.addColorStop(i / (colors.length - 1), colors[i]);
	}

	ctx.fillStyle = gr;
	ctx.fillRect(x, y, w, h);
}

function drawPicker(ctx, x, y, w, h) {
	var gr = ctx.createLinearGradient(0, h, w, h);

	gr.addColorStop(0, '#FFFFFF');
	gr.addColorStop(1, 'rgba(204, 154, 129, 0)');

	ctx.fillStyle = gr;
	ctx.fillRect(x, y, w, h);

	var gr = ctx.createLinearGradient(0, h, 0, 0);

	gr.addColorStop(0, '#000000');
	gr.addColorStop(1, 'rgba(204, 154, 129, 0)');

	ctx.fillStyle = gr;
	ctx.fillRect(x, y, w, h);
}

var pickerSetColor, pickerAddCallback;

function initPicker() {
	var pickerEnd = 210;
	var sliderStart = 215;
	var slotNumber = 8;

	var curMovement = null;
	var el = document.getElementById('cp_gradients');
	var ctx = el.getContext('2d');
	var slider = document.getElementById('cp_slider');
	var picker = document.getElementById('cp_picker');
	var pos;
	var callbacks = [];
	var slots = {};
	var curSlot;

	drawSlider(ctx, sliderStart, 0, el.width - sliderStart, el.height);
	drawPicker(ctx, 0, 0, pickerEnd, el.height);
	ctx.fillStyle = '#FFFFFF';
	ctx.fillRect(pickerEnd, 0, sliderStart - pickerEnd, el.height);
	slider.style.width = (el.width - sliderStart) + 'px';
	slider.style.left = (sliderStart - 1) + 'px';

	var slotChange = function (e) {
		var id = e.target.id;
		document.getElementById(curSlot).className = 'cp_slot';
		curSlot = id;
		e.target.className = 'cp_slot cp_slot_selected';
		setColor(slots[curSlot].r, slots[curSlot].g, slots[curSlot].b);
	}

	for (var i = 0; i < slotNumber; i++) {
		var slot = document.createElement('div');
		slot.className = 'cp_slot';
		slot.id = 'cp_slot_' + i;
		slot.addEventListener('click', slotChange);
		document.getElementById('cp_slots').appendChild(slot);
		slots[slot.id] = {r: 0, g: 0, b: 0};
	}
	curSlot = 'cp_slot_0';
	document.getElementById(curSlot).className = 'cp_slot cp_slot_selected';

	var addCallback = function (f) {
		callbacks.push(f);
	}
	pickerAddCallback = addCallback;

	var updateColor = function () {
		var size = document.getElementById('cp_gradients').height;
		var s = (parseFloat(picker.style.left) + 1) / (size - 1);
		var v = 1 - (parseFloat(picker.style.top) + 1) / (size - 1);
		var h = parseFloat(slider.style.top) / (size - 1);
		var color = hsv2rgb(h, s, v);
		slots[curSlot] = color;
		document.getElementById(curSlot).style.backgroundColor = 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
		for (var i = 0; i < callbacks.length; i++) {
			callbacks[i](color.r, color.g, color.b);
		}
	}

	var setColor = function (r, g, b) {
		var c = rgb2hsv(r, g, b);
		var size = document.getElementById('cp_gradients').height;
		pickerSet(c.s * (size - 1), (1 - c.v) * (size - 1));
		sliderSet(c.h * (size - 1));
	}
	pickerSetColor = setColor;

	var pickerSet = function (x, y) {
		picker.style.top = (y - 1) + 'px';
		picker.style.left = (x - 1) + 'px';
		updateColor();
	}

	var pickerMove = function (e) {
		var coords = getOffset(e);
		if ((e.target.id == 'cp_gradients') && (coords.x < pickerEnd)) {
			pickerSet(coords.x, coords.y);
		} else {
			if (e.target.id == 'cp_picker')
				return;

			var size = document.getElementById('cp_gradients').height;
			var walls = [
				{ x: 0, y: 0, vx: size - 1, vy: 0},
				{ x: 0, y: 0, vx: 0, vy: size - 1},
				{ x: 0, y: size - 1, vx: size - 1, vy: 0},
				{ x: size - 1, y: 0, vx: 0, vy: size - 1},
			];
			var vector = {
				x: size / 2, y: size / 2
			};
			vector.vx = (e.pageX - pos.x) - vector.x;
			vector.vy = (e.pageY - pos.y) - vector.y;

			for (var i = 0; i < walls.length; i++) {
				var t = [vectorIntersection(vector, walls[i]), vectorIntersection(walls[i], vector)];
				if ((t[0] >= 0) && (t[0] <= 1) && (t[1] >= 0) && (t[1] <= 1)) {
					pickerSet(Math.round(vector.x + t[0] * vector.vx), Math.round(vector.y + t[0] * vector.vy));
					break;
				}
			}
		}
	};

	var sliderSet = function (y) {
		slider.style.top = y + 'px';
		var color = ctx.getImageData(sliderStart + 1, y, 1, 1).data;
		el.style.background = 'rgb(' + color[0] + ', ' + color[1] + ', ' + color[2] + ')';
		updateColor();
	}

	var sliderMove = function (e) {
		var coords = getOffset(e);
		if ((e.target.id == 'cp_gradients') && (coords.x >= sliderStart)) {
			sliderSet(coords.y);
		} else {
			if (e.target.id == 'cp_slider')
				return;

			var size = document.getElementById('cp_gradients').height;
			var sliderWidth = document.getElementById('cp_gradients').width - sliderStart;
			var walls = [
				{ x: 0, y: 0, vx: sliderWidth - 1, vy: 0},
				{ x: 0, y: 0, vx: 0, vy: size - 1},
				{ x: 0, y: size - 1, vx: sliderWidth - 1, vy: 0},
				{ x: sliderWidth - 1, y: 0, vx: 0, vy: size - 1},
			];
			var vector = {
				x: sliderWidth / 2,
				y: size / 2
			};
			vector.vx = (e.pageX - pos.x - sliderStart) - vector.x;
			vector.vy = (e.pageY - pos.y) - vector.y;

			for (var i = 0; i < walls.length; i++) {
				var t = [vectorIntersection(vector, walls[i]), vectorIntersection(walls[i], vector)];
				if ((t[0] > 0) && (t[0] < 1) && (t[1] > 0) && (t[1] < 1)) {
					sliderSet(Math.round(vector.y + t[0] * vector.vy));
					break;
				}
			}
		}
	};

	el.addEventListener('mousedown', function (e) {
		e.preventDefault();
		var coords = getOffset(e);
		pos = {
			x: e.pageX - coords.x,
			y: e.pageY - coords.y
		};

		if (coords.x < pickerEnd) {
			document.addEventListener('mousemove', pickerMove);
			pickerMove(e);
		} else if (coords.x >= sliderStart) {
			document.addEventListener('mousemove', sliderMove);
			sliderMove(e);
		}
	});

	document.addEventListener('mouseup', function (e) {
		document.removeEventListener('mousemove', pickerMove);
		document.removeEventListener('mousemove', sliderMove);
	});
}
