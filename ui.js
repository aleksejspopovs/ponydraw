var canvasRatio = 1.0;

function browserNotSupported() {
	serviceMessage('Your browser is not supported. Nothing will work.');
}

function setFormDisabled(form, state) {
	for (var i =0; i < document.forms[form].elements.length; i++) {
		document.forms[form].elements[i].disabled = state;
	}
}

function setCanvasSize(width, height) {
	var elements = document.getElementsByClassName('layer');
	for (var i = 0; i < elements.length; i++) {
		if (elements[i].tagName.toLowerCase() == "div") {
			elements[i].style.width = width + "px";
			elements[i].style.height = height + "px";
		} else {
			elements[i].width = width;
			elements[i].height = height;
		}
	}
}

function updateToolsPreview() {
	var ctx = document.getElementById('toolsPreview').getContext('2d');
	var form = document.forms.drawingSettings.elements;

	form.colorR.value = (parseInt(form.colorR.value) ? form.colorR.value : 0);
	form.colorG.value = (parseInt(form.colorG.value) ? form.colorG.value : 0);
	form.colorB.value = (parseInt(form.colorB.value) ? form.colorB.value : 0);
	form.colorA.value = (parseInt(form.colorA.value) !== undefined ? form.colorA.value : 100);

	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.strokeStyle = 'rgba(' + form.colorR.value + ',' + form.colorG.value + ',' + form.colorB.value + ', ' + (form.colorA.value / 100) + ')';
	ctx.lineWidth = form.thickness.value;
	ctx.moveTo(0, Math.round(ctx.canvas.height / 2));
	ctx.lineTo(ctx.canvas.width, Math.round(ctx.canvas.height / 2));
	ctx.stroke();
}
function showHideLayers() {
	var list = document.forms.drawingSettings.show;

	if (list === undefined) {
		return;
	}

	for (var i = 0; i < list.length; i++) {
		if (list[i].checked) {
			document.getElementById('layer_' + list[i].value).style.display = 'block';
		} else {
			document.getElementById('layer_' + list[i].value).style.display = 'none';
		}
	}
}

function updateCanvasSize() {
	var availWidth = window.innerWidth - document.getElementById('toolHolder').getElementWidth();
	var availHeight = window.innerHeight - document.getElementById('chatHolder').getElementHeight();
	canvasRatio = Math.min(availWidth / roomOpts.width, availHeight / roomOpts.height);
	if (canvasRatio > 1) {
		canvasRatio = 1;
	}

	var cWidth = Math.floor(roomOpts.width * canvasRatio);
	var cHeight = Math.floor(roomOpts.height * canvasRatio);
	var list = document.getElementsByClassName('layer');

	for (var i = 0; i < list.length; i++) {
		// this is quite important: we don't want to change the real sizes of canvases
		// we only want to scale them, so we change .style.width, not .width
		list[i].style.width = cWidth + 'px';
		list[i].style.height = cHeight + 'px';
	}
}

function showCursor(e) {
	document.getElementById('cursor').style.display = 'block';
	moveCursor(e);
	document.getElementById('touchOverlay').addEventListener('mousemove', moveCursor);
}

function hideCursor(e) {
	document.getElementById('cursor').style.display = 'none';
	document.getElementById('touchOverlay').removeEventListener('mousemove', moveCursor);
}

function moveCursor(e) {
	var cursor = document.getElementById('cursor');
	var size = getDrawingSettings().lineWidth * canvasRatio;
	cursor.style.width = Math.round(size) + 'px';
	cursor.style.height = Math.round(size) + 'px';

	var x = (e.offsetX >= 0 ? e.offsetX : e.layerX) - Math.round(size / 2);
	var y = (e.offsetY >= 0 ? e.offsetY : e.layerY) - Math.round(size / 2);

	cursor.style.top = y + 'px';
	cursor.style.left = x + 'px';
}

function initUI() {
	document.forms.join.onsubmit = joinRoom;
	document.forms.chatMsg.onsubmit = sendChatMessage;
	document.forms.drawingSettings.addEventListener('input', updateToolsPreview);
	document.forms.drawingSettings.addEventListener('change', showHideLayers);
	updateToolsPreview();

	if (document.location.hash != '') {
		document.forms.join.room.value = document.location.hash.slice(1);
	}

	document.getElementById('touchOverlay').addEventListener('mouseover', showCursor);
	document.getElementById('touchOverlay').addEventListener('mouseout', hideCursor);
}
