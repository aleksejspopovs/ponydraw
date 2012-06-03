/*
© 2012 Aleksejs Popovs <me@popoffka.ru>
Licensed under MIT License. See ../LICENSE for more info.
*/

function serviceMessage(msg) {
	msg = msg.replace(/\n/gi, '<br>');
	document.getElementById('chat').innerHTML += '<span class=\'serviceMsg\'>' + msg + '</span><br>';
	document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
}

function chatMessage(author, msg) {
	document.getElementById('chat').innerHTML += '<span class=\'msgAuthor\'>[' + author + ']:</span> <span class=\'chatMsg\'>' + msg + '</span><br>';
	document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
}

function sendChatMessage(e) {
	e.preventDefault();
	var form = document.forms.chatMsg;
	if (form.msg.value == '') {
		return;
	}
	var msg = {
		type: 'chat',
		msg: form.msg.value
	}
	ws.send(JSON.stringify(msg));
	form.msg.value = '';
}

function handleChatMessage(msg) {
	chatMessage(msg.name, msg.msg);
}

handlers['chat'] = handleChatMessage;

function handleAnnouncement(msg) {
	serviceMessage(msg.msg);
}
handlers['announcement'] = handleAnnouncement
