function serviceMessage(msg) {
	document.getElementById('chat').innerHTML += '<span class=\'serviceMsg\'>' + msg + '</span><br>';
	document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
}

function chatMessage(author, msg) {
	document.getElementById('chat').innerHTML += '<span class=\'msgAuthor\'>[' + author + ']:</span> <span class=\'chatMsg\'>' + msg + '</span><br>';
	document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
}

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

function handleAnnouncement(msg) {
	serviceMessage(msg.msg);
}
handlers['announcement'] = handleAnnouncement
