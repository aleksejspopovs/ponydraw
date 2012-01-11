function sendChatMessage(e) {
	e.preventDefault();
	if (e.srcElement.elements.msg.value == '') {
		return;
	}
	var msg = {
		type: 'chat',
		msg: e.srcElement.elements.msg.value
	}
	ws.send(JSON.stringify(msg));
	e.srcElement.elements.msg.value = '';
}

function handleChatMessage(msg) {
	chatMessage(msg.name, msg.msg);
}

handlers['chat'] = handleChatMessage;