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

function permanentToolChooser(event) {
	switch (event.keyCode) {
		case 112:
			setTool('pencil');
		break;
		case 99:
			setTool('picker');
		break;
		case 101:
			setTool('eraser');
		break;
	}
}

function initKeyboard() {
	document.addEventListener('keypress', thicknessHandler);
	document.addEventListener('keydown', instrumentDownHandler);
	document.addEventListener('keypress', permanentToolChooser);
}
