var drawingAllowed = false;
var overlay;
var lastPoint;
var layers = [];

function initDrawing() {
	disableDrawing();
	overlay = document.getElementById('touchOverlay');
	document.getElementById('newLayer').onclick = newLayer;
}

function getCoords(e) {
	return {
		x: Math.round((e.offsetX >= 0 ? e.offsetX : e.layerX) / canvasRatio),
		y: Math.round((e.offsetY >= 0 ? e.offsetY : e.layerY) / canvasRatio)
	}
}

function getTool() {
	for (var i = 0; i < form.tool.length; i++) {
		if (form.tool[i].checked) {
			return form.tool[i].value;
		}
	}
	return '';
}

function setTool(tool) {
	for (var i = 0; i < form.tool.length; i++) {
		if (form.tool[i].value == tool) {
			form.tool[i].checked = true;
		}
	}
}

function getDrawingSettings() {
	var res = {};
	res.strokeStyle = 'rgb(' + form.colorR.value + ',' + form.colorG.value + ',' + form.colorB.value + ')';
	res.lineWidth = form.thickness.value;
	res.erase = (getTool() == 'eraser');

	for (var i = 0; i < layers.length; i++) {
		if (document.getElementById('i' + layers[i].id).checked) {
			res.layer = layers[i].id;
		}
	}

	return res;
}

function mouseDown(e) {
	e.preventDefault();
	switch (getTool()) {
		case 'pencil':
		case 'eraser':
			lastPoint = getCoords(e);
			overlay.addEventListener("mousemove", drawHandler);
			drawHandler(e);
		break;
		case 'picker':
			overlay.addEventListener("mousemove", pickerHandler);
			pickerHandler(e);
		break;
	}
}

function mouseUp(e) {
	switch (getTool()) {
		case 'pencil':
		case 'eraser':
			overlay.removeEventListener("mousemove", drawHandler);
		break;
		case 'picker':
			overlay.removeEventListener("mousemove", pickerHandler);
		break
	}
}

function drawHandler(e) {
	e.preventDefault();
	point = getCoords(e);
	var opts = getDrawingSettings();

	if (opts.layer === undefined) {
		return;
	}

	drawLine(lastPoint, point, opts);
	sendLine(lastPoint, point, opts);
	lastPoint = point;
}

function pickerHandler(e) {
	point = getCoords(e);
	var opts = getDrawingSettings();
	var tmpC = document.createElement('canvas');
	tmpC.width = 1;
	tmpC.height = 1;
	var ctx = tmpC.getContext('2d');
	ctx.fillStyle = 'rgba(255, 255, 255, 100)';
	ctx.fillRect(0, 0, 1, 1);
	for (var i = layers.length - 1; i >= 0; i--) {
		var cur = document.getElementById('layer_' + layers[i].id);
		if (cur.style.display != 'none') {
			var curData = cur.getContext('2d').getImageData(point.x, point.y, 1, 1);
			// we can't just put curData onto tmpC, becasue putImageData ignores blending
			ctx.fillStyle = 'rgba('+ curData.data[0] + ',' + curData.data[1] + ',' + curData.data[2] + ',' + (curData.data[3] / 100) +')';
			ctx.fillRect(0, 0, 1, 1);
		}
	}
	var data = ctx.getImageData(0, 0, 1, 1);
	form.colorR.value = data.data[0];
	form.colorG.value = data.data[1];
	form.colorB.value = data.data[2];
	updateToolsPreview(true);
}

function drawLine(from, to, opts) {
	var ctx = document.getElementById('layer_' + opts.layer).getContext('2d');
	if (opts.erase) {
		ctx.globalCompositeOperation = 'destination-out';
		var style = 'rgba(0, 0, 0, 1)';
	} else {
		ctx.globalCompositeOperation = 'source-over';
		var style = opts.strokeStyle;
	}

	ctx.beginPath();
	if ((from.x == to.x) && (from.y == to.y)) {
		ctx.fillStyle = style;
		ctx.arc(to.x, to.y, opts.lineWidth / 2, 0, Math.PI*2, true);
		ctx.closePath();
		ctx.fill();
	} else {
		ctx.strokeStyle = style;
		ctx.lineWidth = opts.lineWidth;
		ctx.lineCap = "round";
		ctx.moveTo(from.x, from.y);
		ctx.lineTo(to.x, to.y);
		ctx.stroke();
		ctx.closePath();
	}
}

function handleLine(msg) {
	drawLine(msg.from, msg.to, msg.opts);
}

handlers['line'] = handleLine;

function sendLine(from, to, opts) {
	var msg = {
		type: 'line',
		from: from,
		to: to,
		opts: opts
	};
	ws.send(JSON.stringify(msg));
}

function newLayer() {
	if (!roomOpts) {
		return;
	}

	var msg = {
		type: 'newLayer'
	};
	ws.send(JSON.stringify(msg));
}

function handleNewLayer(layer) {
	layers.push(layer);
	layers.sort(layerSorter);
	var next;
	for (var i = 0; i < layers.length; i++) {
		if (layers[i].id == layer.id) {
			next = (i + 1 < layers.length) ? document.getElementById('label_' + layers[i + 1].id) : false;
		}
	}

	var c = document.createElement('canvas');
	c.id = 'layer_' + layer.id;
	c.width = roomOpts.width;
	c.height = roomOpts.height;
	c.style.width = Math.floor(roomOpts.width * canvasRatio) + 'px';
	c.style.height = Math.floor(roomOpts.height * canvasRatio) + 'px';
	c.className = 'layer';
	c.style.zIndex = layer.zIndex;
	document.getElementById('layers').appendChild(c);

	var l = document.createElement('label');
	l.id = 'label_' + layer.id;
	l.innerHTML = '<input type=\'radio\' name=\'active\' ' + (!layer.canDraw ? 'disabled' : '') + ' id=\'i' + layer.id + '\'>'
		+ '<input type=\'checkbox\' name=\'show\' value=\'' + layer.id + '\' checked>' + layer.name
		+ (layer.canModerate ? ' <a href=\'javascript:void(0)\' onclick=\'removeLayer(' + layer.id + ');\'>×</a>'
		+ ' <a href=\'javascript:void(0)\' onclick=\'layerShiftUp(' + layer.id + ')\'>↑</a>'
		+ ' <a href=\'javascript:void(0)\' onclick=\'layerShiftDown(' + layer.id + ')\'>↓</a>' : '')
		+ '<br />';

	if (!next) {
		document.getElementById('layerList').appendChild(l);
	} else {
		document.getElementById('layerList').insertBefore(l, next);
	}
}

handlers['newLayer'] = handleNewLayer;

function layerShiftUp(id) {
	var order;
	for (var i = 0; i < layers.length; i++) {
		if (layers[i].id == id) {
			order = i;
		}
	}
	if (order == 0) {
		return;
	}

	var msg = {
		type: 'swapLayers',
		aId: layers[order - 1].id,
		bId: id
	};
	ws.send(JSON.stringify(msg));
}

function layerShiftDown(id) {
	var order;
	for (var i = 0; i < layers.length; i++) {
		if (layers[i].id == id) {
			order = i;
		}
	}
	if (order == layers.length - 1) {
		return;
	}

	var msg = {
		type: 'swapLayers',
		aId: layers[order + 1].id,
		bId: id
	};
	ws.send(JSON.stringify(msg));
}

function handleSwapLayers(msg) {
	var aId = msg.aId;
	var bId = msg.bId;
	var list = document.getElementById('layerList');
	var tmpEl1 = document.createElement('span');
	tmpEl1.id = 'layer_tmp1';
	list.insertBefore(tmpEl1, document.getElementById('label_' + aId));
	var tmpEl2 = document.createElement('span');
	tmpEl2.id = 'layer_tmp2';
	list.insertBefore(tmpEl2, document.getElementById('label_' + bId));

	list.replaceChild(document.getElementById('label_' + aId), tmpEl2);
	list.replaceChild(document.getElementById('label_' + bId), tmpEl1);
	layers.sort(layerSorter);
}

handlers['swapLayers'] = handleSwapLayers;

function handleChangeZIndex(msg) {
	for (var i = 0; i < layers.length; i++) {
		if (layers[i].id == msg.id) {
			break;
		}
	}
	layers[i].zIndex = msg.zIndex;
	document.getElementById('layer_' + msg.id).style.zIndex = msg.zIndex;
}

handlers['changeZIndex'] = handleChangeZIndex;

function removeLayer(id) {
	var msg = {
		type: 'removeLayer',
		id: id
	};
	ws.send(JSON.stringify(msg));
}

function handleRemoveLayer(msg) {
	serviceMessage(msg.who + ' removed layer \'' + msg.name + '\'');
	document.getElementById('layerList').removeChild(document.getElementById('label_' + msg.id));
	document.getElementById('layers').removeChild(document.getElementById('layer_' + msg.id));
	for (var i = 0; i < layers.length; i++) {
		if (layers[i].id == msg.id) {
			layers.splice(i, 1);
			return;
		}
	}
}

handlers['removeLayer'] = handleRemoveLayer;

function enableDrawing(l) {
	drawingAllowed = true;
	document.getElementById('layerHolder').style.display = "block";
	overlay.onmousedown = mouseDown;
	overlay.onmouseup = mouseUp;
	document.getElementById('layerList').innerHTML = '';
	document.getElementById('layers').innerHTML = '';
	overlay.width = roomOpts.width;
	overlay.height = roomOpts.height;
	updateCanvasSize();
	for (var i in l) {
		handleNewLayer(l[i]);
	}
	showHideLayers();
	window.addEventListener('resize', updateCanvasSize);
}

function disableDrawing() {
	drawingAllowed = false;
	document.getElementById('layerHolder').style.display = "none";
	window.removeEventListener('resize', updateCanvasSize);
}
