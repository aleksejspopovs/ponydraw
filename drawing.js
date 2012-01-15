var drawingAllowed = false;
var overlay;
var lastPoint;
var form;
var layers = [];

function initDrawing() {
	disableDrawing();
	overlay = document.getElementById('touchOverlay');
	form = document.forms.drawingSettings.elements;
	document.getElementById('newLayer').onclick = newLayer;
}

function getDrawingSettings() {
	var res = {};
	res.strokeStyle = 'rgba(' + form.colorR.value + ',' + form.colorG.value + ',' + form.colorB.value + ', ' + (form.colorA.value / 100) + ')';
	res.lineWidth = form.thickness.value;

	for (var i = 0; i < layers.length; i++) {
		if (document.getElementById('i' + layers[i].id).checked) {
			res.layer = layers[i].id;
		}
	}

	return res;
}

function mouseDown(e) {
	e.preventDefault();
	if (form.tool.item('pencil').checked) {
		lastPoint = {
			x: (e.offsetX >= 0 ? e.offsetX : e.layerX) / canvasRatio,
			y: (e.offsetY >= 0 ? e.offsetY : e.layerY) / canvasRatio
		};
		overlay.addEventListener("mousemove", drawHandler);
		drawHandler(e);
	} else if (form.tool.item('picker').checked) {
		overlay.addEventListener("mousemove", pickerHandler);
		pickerHandler(e);
	}
}

function mouseUp(e) {
	if (form.tool.item('pencil').checked){
		painting = false;
		overlay.removeEventListener("mousemove", drawHandler);
	}
}

function drawHandler(e) {
	e.preventDefault();
	var point = {
		x: (e.offsetX >= 0 ? e.offsetX : e.layerX) / canvasRatio,
		y: (e.offsetY >= 0 ? e.offsetY : e.layerY) / canvasRatio
	};
	var opts = getDrawingSettings();

	if (opts.layer === undefined) {
		return;
	}

	drawLine(lastPoint, point, opts);
	sendLine(lastPoint, point, opts);
	lastPoint = point;
}

function pickerHandler(e) {
	var opts = getDrawingSettings();
	var data = document.getElementById('layer_' + opts.layer).getContext('2d').getImageData(e.offsetX, e.offsetY, 1, 1);
	form.colorR.value = data.data[0];
	form.colorG.value = data.data[1];
	form.colorB.value = data.data[2];
	form.colorA.value = data.data[3];
	updateToolsPreview();
}

function drawLine(from, to, opts) {
	var ctx = document.getElementById('layer_' + opts.layer).getContext('2d');
	ctx.lineCap = "round";
	ctx.strokeStyle = opts.strokeStyle;
	ctx.lineWidth = opts.lineWidth;
	ctx.beginPath();
	ctx.moveTo(from.x, from.y);
	ctx.lineTo(to.x, to.y);
	ctx.stroke();
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
	var msg = {
		type: 'newLayer'
	};
	ws.send(JSON.stringify(msg));
}

function handleNewLayer(layer) {
	layers.push(layer);
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
	l.innerHTML = '<input type=\'radio\' name=\'active\' ' + (layer.owner != roomOpts.user ? 'disabled' : '') + ' id=\'i' + layer.id + '\'>'
		+ '<input type=\'checkbox\' name=\'show\' value=\'' + layer.id + '\' checked>'
		+ layer.name + ((layer.owner == roomOpts.user || roomOpts.mod) ? ' <a href=\'javascript:void(0)\' onclick=\'removeLayer(' + layer.id + ');\'>×</a>' : '') + '<br />';
	document.getElementById('layerList').appendChild(l);
}

handlers['newLayer'] = handleNewLayer;

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

function enableDrawing(layers) {
	drawingAllowed = true;
	document.getElementById('layerHolder').style.display = "block";
	overlay.onmousedown = mouseDown;
	overlay.onmouseup = mouseUp;
	document.getElementById('layerList').innerHTML = '';
	document.getElementById('layers').innerHTML = '';
	updateCanvasSize();
	for (var i in layers) {
		handleNewLayer(layers[i]);
	}
	overlay.style.width = Math.floor(roomOpts.width * canvasRatio) + "px";
	overlay.style.height = Math.floor(roomOpts.height * canvasRatio) + "px";
	showHideLayers();
	window.addEventListener('resize', updateCanvasSize);
}

function disableDrawing() {
	drawingAllowed = false;
	document.getElementById('layerHolder').style.display = "none";
	window.removeEventListener('resize', updateCanvasSize);
}
