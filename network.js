var ws_uri = 'ws://localhost:9000';
var ws;
var connReady = false;
var handlers = {};
var roomOpts = {};

function messageHandler(e) {
	var msg = JSON.parse(e.data);
	if  (msg.type == 'bunch') {
		for (var i = 0; i < msg.contents.length; i++) {
			if (msg.contents[i].type in handlers) {
				handlers[msg.contents[i].type](msg.contents[i]);
			} else {
				console.log('Unkown message received: ',msg.contents[i]);
			}
		}
	} else if (msg.type in handlers) {
		handlers[msg.type](msg);
	} else {
		console.log('Unkown message received: ',msg);
	}
}

function initWebSocket() {
	if ('WebSocket' in window) {
		ws = new WebSocket(ws_uri);
	}	else if ('MozWebSocket' in window) {
		ws = new MozWebSocket(ws_uri);
	} else {
		browserNotSupported();
		return;
	}

	ws.onmessage = messageHandler;

	ws.onopen = function (e) {
		connReady = true;
		serviceMessage('Connection established.');
		setFormDisabled('join', false);
	}

	ws.onclose = function (e) {
		connReady = false;
		serviceMessage('Connection lost.');
		disableDrawing();
	}
}

function joinRoom(e) {
	e.preventDefault();
	var form = document.forms.join;
	if ((form.elements.room.value == '') || (form.elements.password.value == '') || (form.elements.name.value == '')) {
		serviceMessage('You have to specify a username, a password and a room name to join a room.');
		return;
	}
	if (!connReady) {
		serviceMessage('Connection is not available.');
		return;
	}
	var msg = {
		type: 'register',
		name: form.elements.name.value,
		password: form.elements.password.value,
		room: form.elements.room.value
	}

	curName = form.elements.name.value;
	setFormDisabled('join', true);
	ws.send(JSON.stringify(msg));
}

function handleJoinSuccess(msg) {
	roomOpts = msg;
	serviceMessage('Welcome to room #' + msg.room + '.' + (msg.mod ? ' You are moderating this room.' : '')
		+ ' There are now ' + msg.users.length + ' users in this room: ' + msg.users.join(', ') + '.');
	setFormDisabled('chatMsg', false);
	enableDrawing(msg.layers);
}

handlers['joinSuccess'] = handleJoinSuccess;

function handleJoinFailure(msg) {
	serviceMessage('Could not join room #' + msg.room + '. Server said: ' + msg.error);
	setFormDisabled('join', false);
}

handlers['joinFailure'] = handleJoinFailure;

function handleUserJoined(msg) {
	serviceMessage(msg.name + ' joined #' + msg.room + (msg.mod ? ' as a moderator' : ''));
}

handlers['userJoined'] = handleUserJoined;

function handleUserLeft(msg) {
	serviceMessage(msg.name + ' left #' + msg.room);
}

handlers['userLeft'] = handleUserLeft;
