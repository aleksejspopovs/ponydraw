var drawingAllowed = false;
var ctx, overlay;
var lastPoint;
var form;

function initDrawing() {
	disableDrawing();
	ctx = document.getElementById('drawingCanvas').getContext('2d');
	overlay = document.getElementById('touchOverlay');
	form = document.forms.drawingSettings.elements;
}

function getDrawingSettings() {
	var res = {};
	res.strokeStyle = 'rgba(' + form.colorR.value + ',' + form.colorG.value + ',' + form.colorB.value + ', ' + (form.colorA.value / 100) + ')';
	res.lineWidth = form.thickness.value;
	return res;
}

function mouseDown(e) {
	if (form.tool.pencil.checked) {
		lastPoint = {
			x: e.offsetX,
			y: e.offsetY
		};
		overlay.addEventListener("mousemove", drawHandler);
		drawHandler(e);
	} else if (form.tool.picker.checked) {
		overlay.addEventListener("mousemove", pickerHandler);
		pickerHandler(e);
	}
}

function mouseUp(e) {
	if (form.tool.pencil.checked){
		painting = false;
		overlay.removeEventListener("mousemove", drawHandler);
	}
}

function drawHandler(e) {
	var point = {
		x: e.offsetX,
		y: e.offsetY
	};
	var opts = getDrawingSettings();

	drawLine(ctx, lastPoint, point, opts);
	sendLine(lastPoint, point, opts);
	lastPoint = point;
}

function pickerHandler(e) {
	var data = ctx.getImageData(e.offsetX, e.offsetY, 1, 1);
	console.log(data);
	form.colorR.value = data.data[0];
	form.colorG.value = data.data[1];
	form.colorB.value = data.data[2];
	form.colorA.value = data.data[3];
	updateToolsPreview();
}

function drawLine(ctx, from, to, opts) {
	ctx.lineCap = "round";
	ctx.strokeStyle = opts.strokeStyle;
	ctx.lineWidth = opts.lineWidth;
	ctx.beginPath();
	ctx.moveTo(from.x, from.y);
	ctx.lineTo(to.x, to.y);
	ctx.stroke();
}

function receiveLine(msg) {
	drawLine(ctx, msg.from, msg.to, msg.opts);
}

handlers['line'] = receiveLine;

function sendLine(from, to, opts) {
	var msg = {
		type: 'line',
		from: from,
		to: to,
		opts: opts
	};
	ws.send(JSON.stringify(msg));
}

function addLayer(layer) {
	document.getElementById('layerList').innerHTML += '<label>'
		+ '<input type=\'radio\' name=\'active\' ' + (!layer.isMine ? 'disabled' : '') + ' id=\'i' + layer.id + '\'>'
		+ '<input type=\'checkbox\' name=\'show\' id=\'i' + layer.id + '\'>'
		+ layer.name + ' <a href=\'#\' onclick=\'removeLayer(' + layer.id + ');\'>×</a>' + '</label><br />';
}

function enableDrawing(layers) {
	drawingAllowed = true;
	document.getElementById('layerHolder').style.display = "block";
	overlay.onmousedown = mouseDown;
	overlay.onmouseup = mouseUp;
	document.getElementById('layerList').innerHTML = '';
	for (var i in layers) {
		addLayer(layers[i]);
	}
}

function disableDrawing() {
	drawingAllowed = false;
	document.getElementById('layerHolder').style.display = "none";
}
