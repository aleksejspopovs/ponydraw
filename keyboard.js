function thicknessHandler(e) {
	if (e.target.nodeName.toLowerCase() != 'body') {
		return;
	}

	switch (e.keyCode) {
		case 91: // [
		case 1093: // russian [
			form.thickness.value = parseInt(form.thickness.value) - 1;
		break;
		case 93: // ]
		case 1098: // russian ]
			form.thickness.value = parseInt(form.thickness.value) + 1;
		break;
	}
	updateToolsPreview();
}

function instrumentDownHandler(e) {
	if ((e.target.nodeName.toLowerCase() != 'body') || (getTool() != 'pencil')) {
		return;
	}

	if (e.keyCode == 16) { // shift
		setTool('picker');
		document.addEventListener('keyup', makeInstrumentUpHandler(e.keyCode));
	} else if (e.keyCode == 17) { // ctrl
		setTool('eraser');
		document.addEventListener('keyup', makeInstrumentUpHandler(e.keyCode));
	}
}

function makeInstrumentUpHandler(code) {
	return function (e) {
		if (e.target.nodeName.toLowerCase() != 'body') {
			return;
		}
		if (e.keyCode == code) {
			setTool('pencil');
			document.removeEventListener('keyup', makeInstrumentUpHandler(e.keyCode));
		}
	}
}

function simpleHotkeys(event) {
	switch (event.keyCode) {
		// permanent tool choices
		case 112: // p
		case 1079:
			setTool('pencil');
		break;
		case 99: // c
		case 1089:
			setTool('picker');
		break;
		case 101: // e
		case 1091:
			setTool('eraser');
		break;
		// UI
		case 113: // q - hide/show chat
		case 1081:
			toggleChatVisibility();
		break;
		case 119: // w - hide/show tools
		case 1094:
			toggleToolsVisibility();
		break;
	}
}

function initKeyboard() {
	document.addEventListener('keypress', thicknessHandler);
	document.addEventListener('keydown', instrumentDownHandler);
	document.addEventListener('keypress', simpleHotkeys);
}
