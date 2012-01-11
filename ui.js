function serviceMessage(msg) {
	document.getElementById('chat').innerHTML += '<span class=\'serviceMsg\'>' + msg + '</span><br>';
	document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
}

function chatMessage(author, msg) {
	document.getElementById('chat').innerHTML += '<span class=\'msgAuthor\'>[' + author + ']:</span> <span class=\'chatMsg\'>' + msg + '</span><br>';
	document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
}

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
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.strokeStyle = 'rgba(' + form.colorR.value + ',' + form.colorG.value + ',' + form.colorB.value + ', ' + (form.colorA.value / 100) + ')';
	ctx.lineWidth = form.thickness.value;
	ctx.moveTo(0, Math.round(ctx.canvas.height / 2));
	ctx.lineTo(ctx.canvas.width, Math.round(ctx.canvas.height / 2));
	ctx.stroke();
}

function initUI() {
	document.forms.join.onsubmit = joinRoom;
	document.forms.chatMsg.onsubmit = sendChatMessage;
	document.forms.drawingSettings.oninput = updateToolsPreview;
	updateToolsPreview();

	if (document.location.hash != '') {
		document.forms.join.room.value = document.location.hash.slice(1);
	}
}