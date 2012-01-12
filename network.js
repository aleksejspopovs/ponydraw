var ws_uri = 'ws://localhost:9000';
var ws;
var connReady = false;
var handlers = {};

function messageHandler(e) {
	var msg = JSON.parse(e.data);
	if (msg.type in handlers) {
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
	if ((e.srcElement.elements.room.value == '') || (e.srcElement.elements.password.value == '') || (e.srcElement.elements.name.value == '')) {
		serviceMessage('You have to specify a username, a password and a room name to join a room.');
		return;
	}
	if (!connReady) {
		serviceMessage('Connection is not available.');
		return;
	}
	var msg = {
		type: 'register',
		name: e.srcElement.elements.name.value,
		password: e.srcElement.elements.password.value,
		room: e.srcElement.elements.room.value
	}

	curName = e.srcElement.elements.name.value;
	setFormDisabled('join', true);
	ws.send(JSON.stringify(msg));
}

function handleJoinSuccess(msg) {
	curRoom = msg.room;
	serviceMessage('Welcome to room #' + msg.room + '.' + (msg.mod ? ' You are moderating this room.' : '')
		+ ' There are now ' + msg.users.length + ' users in this room: ' + msg.users.join(', ') + '.');
	setFormDisabled('chatMsg', false);
	setCanvasSize(msg.width, msg.height);
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
