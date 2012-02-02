var canvasRatio = 1.0;
var picker;
var form;

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

function updateToolsPreview(e) {
	var ctx = document.getElementById('toolsPreview').getContext('2d');

	form.colorR.value = (parseInt(form.colorR.value) ? form.colorR.value : 0);
	form.colorG.value = (parseInt(form.colorG.value) ? form.colorG.value : 0);
	form.colorB.value = (parseInt(form.colorB.value) ? form.colorB.value : 0);
	if (e) {
		picker.setRgb({r: form.colorR.value, g: form.colorG.value, b: form.colorB.value});
	}

	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.strokeStyle = 'rgb(' + form.colorR.value + ',' + form.colorG.value + ',' + form.colorB.value + ')';
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

function pickerCallback(hex, hsv, rgb, mousePicker, mouseSlide) {
	form.colorR.value = Math.round(rgb.r);
	form.colorG.value = Math.round(rgb.g);
	form.colorB.value = Math.round(rgb.b);
	updateToolsPreview();
}

function initBellsWhistles() {
	if (!localStorage.ponyDrawSettings) {
		var defaults = {
			'showCheckers': false,
			'showPointer': true
		};
		localStorage.ponyDrawSettings = JSON.stringify(defaults);
	}

	var settings = JSON.parse(localStorage.ponyDrawSettings);
	form.showCheckers.checked = settings.showCheckers;
	form.showPointer.checked = settings.showPointer;

	if (settings.showCheckers) {
		document.getElementById('checkers').style.display = 'block';
	} else {
		document.getElementById('checkers').style.display = 'none';
	}

	if (settings.showPointer) {
		document.getElementById('touchOverlay').style.cursor = 'crosshair';
	} else {
		document.getElementById('touchOverlay').style.cursor = 'none';
	}
}

function updateBellsWhistles(e) {
	var settings = JSON.parse(localStorage.ponyDrawSettings);
	switch (e.target.name) {
		case 'showCheckers':
			settings.showCheckers = form.showCheckers.checked;
			if (settings.showCheckers) {
				document.getElementById('checkers').style.display = 'block';
			} else {
				document.getElementById('checkers').style.display = 'none';
			}
		break;
		case 'showPointer':
			settings.showPointer = form.showPointer.checked;
			if (settings.showPointer) {
				document.getElementById('touchOverlay').style.cursor = 'crosshair';
			} else {
				document.getElementById('touchOverlay').style.cursor = 'none';
			}
		break;
	}
	localStorage.ponyDrawSettings = JSON.stringify(settings);
}

function randomiseJoinData() {
	var nameParts = [
		['Wonderful', 'Mysterious', 'Awesome', 'Majestic', 'Fantastic', 'Fabulous', 'Spectacular', 'Extraordinary', 'Shy', 'Sweet'],
		['Twilight', 'Pinkie', 'Nightmare', 'Sunshine', 'Royal', 'Young', 'Rainbow'],
		['Pony', 'Filly', 'Mare', 'Stallion', 'Pegasus', 'Unicorn', 'Dragon', 'Mule']
	];
	var name = '';
	for (var i = 0; i < nameParts.length; i++) {
		name += nameParts[i][Math.round(Math.random() * (nameParts[i].length - 1))];
	}

	document.forms.join.name.value = name;

	var pword = '';
	for (var i = 0; i < 3; i++) {
		pword += String.fromCharCode(97 + Math.round(Math.random() * 25));
	}

	document.forms.join.password.value = pword;
	serviceMessage('Your randomly generated password is ' + pword + '.');
}

function initUI() {
	form = document.forms.drawingSettings.elements;
	document.forms.join.onsubmit = joinRoom;
	document.forms.join.randomise.onclick = randomiseJoinData;
	document.forms.chatMsg.onsubmit = sendChatMessage;
	document.forms.drawingSettings.addEventListener('input', updateToolsPreview);
	document.forms.drawingSettings.addEventListener('change', showHideLayers);
	document.forms.drawingSettings.addEventListener('change', updateBellsWhistles);
	picker = ColorPicker(
		document.getElementById('slide-wrapper'),
		document.getElementById('picker-wrapper'),
		pickerCallback
	);
	updateToolsPreview(true);
	initBellsWhistles();

	if (document.location.hash != '') {
		document.forms.join.room.value = document.location.hash.slice(1);
	}

	document.getElementById('touchOverlay').addEventListener('mouseover', showCursor);
	document.getElementById('touchOverlay').addEventListener('mouseout', hideCursor);
}
