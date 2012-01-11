var drawingAllowed = false;
var ctx, overlay;
var painting = false;
var lastPoint;

function initDrawing() {
	disableDrawing();
	ctx = document.getElementById('drawingCanvas').getContext('2d');
	overlay = document.getElementById('touchOverlay');
}

function getDrawingSettings() {
	var form = document.forms.drawingSettings.elements;
	var res = {};
	res.strokeStyle = 'rgba(' + form.colorR.value + ',' + form.colorG.value + ',' + form.colorB.value + ', ' + (form.colorA.value / 100) + ')';
	res.lineWidth = form.thickness.value;
	return res;
}

function mouseDown(e) {
	painting = true;
	lastPoint = {
		x: e.offsetX,
		y: e.offsetY
	};
}

function mouseUp(e) {
	painting = false;
}

function mouseHandler(e) {
	if (!painting) {
		return;
	}
	var point = {
		x: e.offsetX,
		y: e.offsetY
	};
	var opts = getDrawingSettings();

	drawLine(ctx, lastPoint, point, opts);
	sendLine(lastPoint, point, opts);
	lastPoint = point;
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

function enableDrawing() {
	drawingAllowed = true;
	document.getElementById('layerHolder').style.display = "block";
	overlay.onmousedown = mouseDown;
	overlay.onmouseup = mouseUp;
	overlay.onmousemove = mouseHandler;
}

function disableDrawing() {
	drawingAllowed = false;
	document.getElementById('layerHolder').style.display = "none";
}