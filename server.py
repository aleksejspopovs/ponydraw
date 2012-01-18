import sys, json
from twisted.internet import reactor
from twisted.python import log
from autobahn.websocket import WebSocketServerFactory, WebSocketServerProtocol, listenWS
from hashlib import sha256
from cgi import escape

MAX_LAYERS_PER_USER = 5

class DrawingRoom():
	def __init__(self, name, creator, w, h):
		self.name = name
		self.users = {}
		self.layers = {}
		self.layersW = 1
		self.width = w
		self.height = h
		self.history = []

		self.addUser(creator, True)

	def addUser(self, user, mod=False):
		if (user[0] in self.users):
			return

		self.users[user[0]] = {
			'password': user[1],
			'mod': mod,
			'online': False
		}

	def addLayer(self, owner):
		c = 0
		for i in self.layers:
			if (self.layers[i]['owner'] == owner):
				c += 1
				if (c >= MAX_LAYERS_PER_USER):
					return False

		self.layers[self.layersW] = {
			'owner': owner,
			'id': self.layersW,
			'name': owner + ' ' + str(self.layersW),
			'zIndex': self.layersW
		}
		self.layersW += 1
		return self.layers[self.layersW - 1]

	def removeLayer(self, id, user):
		try:
			self.layers[id]
		except KeyError:
			return False

		if self.users[user]['mod'] or self.layers[id]['owner'] == user:
			rip = self.layers[id]
			del self.layers[id]

			deleted = 0
			for i in xrange(len(self.history)):
				if (json.loads(self.history[i - deleted])['opts']['layer'] == id):
					del self.history[i - deleted]
					deleted += 1

			return rip
		else:
			return False

	def swapLayers(self, aId, bId, user):
		try:
			self.layers[aId]
			self.layers[bId]
		except KeyError:
			return False

		if self.users[user]['mod'] or self.layers[aId]['owner'] == user or self.layers[bId]['owner'] == user:
			res = []
			tmp = self.layers[aId]['zIndex']
			self.layers[aId]['zIndex'] = self.layers[bId]['zIndex']
			res.append({
				'type': 'changeZIndex',
				'id': aId,
				'zIndex': self.layers[bId]['zIndex']
			})
			self.layers[bId]['zIndex'] = tmp
			res.append({
				'type': 'changeZIndex',
				'id': bId,
				'zIndex': tmp
			})
			return res
		else:
			return False


	def getUser(self, which):
		if (which not in self.users):
			return None
		else:
			return self.users[which]

	def getRoomInfo(self, user):
		msg = {}
		msg['type'] = 'joinSuccess'
		msg['room'] = self.name
		msg['mod'] = self.users[user]['mod']
		msg['user'] = user
		msg['width'] = self.width
		msg['height'] = self.height
		msg['users'] = [c for c in self.users if self.users[c]['online']]
		msg['layers'] = self.layers
		return json.dumps(msg)

	def isMod(self, user):
		try:
			return self.getUser(user)['mod']
		except AttributeError:
			return False

	def canDrawOn(self, user, layer):
		try:
			return self.layers[layer]['owner'] == user
		except KeyError:
			return false

	def setOnline(self, user, state):
		msg = {}
		if (state):
			self.users[user]['online'] = True
			msg['type'] = 'userJoined'
			msg['name'] = user
			msg['room'] = self.name
			msg['mod'] = self.users[user]['mod']
		else:
			self.users[user]['online'] = False
			msg['type'] = 'userLeft'
			msg['name'] = user
			msg['room'] = self.name
		return json.dumps(msg)

	def addToHistory(self, msg):
		self.history.append(msg)

	def getAuthFailMessage(self, room):
		msg = {}
		msg['type'] = 'joinFailure'
		msg['room'] = room
		msg['error'] = 'Wrong password'
		return json.dumps(msg)


class PonyDrawServerProtocol(WebSocketServerProtocol):
	def __init__(self):
		self.room = None
		self.name = None

	def getChatMessage(self, text):
		msg = {}
		msg['type'] = 'chat'
		msg['name'] = self.name
		msg['msg'] = text
		return json.dumps(msg)

	def getNewLayerFailMessage(self):
		msg = {}
		msg['type'] = 'announcement'
		msg['msg'] = 'Could not create new layer.'
		return json.dumps(msg)

	def onOpen(self):
		self.factory.register(self)

	def onMessage(self, msg, binary):
		if binary:
			return

		message = json.loads(msg)
		print message
		for i in message:
			if isinstance(message[i], basestring):
				message[i] = escape(message[i])

		if (message['type'] == 'register'):
			if self.factory.canJoin(message['name'], sha256(message['password']).hexdigest(), message['room']):
				self.room = self.factory.rooms[message['room']]
				self.name = message['name']
				self.factory.broadcast(self.room.setOnline(self.name, True), self.room.name, self)
				self.sendMessage(self.room.getRoomInfo(self.name))
				msg = {}
				msg['type'] = 'bunch'
				msg['contents'] = []
				for i in self.room.history:
					msg['contents'].append(json.loads(i))
				self.sendMessage(json.dumps(msg))
			else:
				self.sendMessage(self.factory.getAuthFailMessage(message['room']))
				self.sendClose()
		elif (message['type'] == 'chat'):
			if (self.room):
				self.factory.broadcast(self.getChatMessage(message['msg']), self.room.name, None)
		elif (message['type'] == 'line'):
			if (self.room) and (self.room.canDrawOn(self.name, message['opts']['layer'])):
				self.room.addToHistory(msg)
				self.factory.broadcast(msg, self.room.name, self)
		elif (message['type'] == 'newLayer'):
			res = self.room.addLayer(self.name)
			if (res):
				res['type'] = 'newLayer'
				self.factory.broadcast(json.dumps(res), self.room.name, None)
			else:
				self.sendMessage(self.getNewLayerFailMessage())
		elif (message['type'] == 'removeLayer'):
			res = self.room.removeLayer(message['id'], self.name)
			if (res):
				res['who'] = self.name
				res['type'] = 'removeLayer'
				self.factory.broadcast(json.dumps(res), self.room.name, None)
		elif (message['type'] == 'swapLayers'):
			res = self.room.swapLayers(message['aId'], message['bId'], self.name)
			if (res):
				for i in res:
					self.factory.broadcast(json.dumps(i), self.room.name, None)
				self.factory.broadcast(msg, self.room.name, None)



	def connectionLost(self, reason):
		WebSocketServerProtocol.connectionLost(self, reason)
		if (self.room):
			self.factory.broadcast(self.room.setOnline(self.name, False), self.room.name, self)
		self.factory.unregister(self)


class PonyDrawServerFactory(WebSocketServerFactory):
	protocol = PonyDrawServerProtocol

	def __init__(self, url):
		WebSocketServerFactory.__init__(self, url)
		self.clients = []
		self.rooms = {}

	def register(self, client):
		if not client in self.clients:
			print "registered client " + client.peerstr
			self.clients.append(client)

	def unregister(self, client):
		if client in self.clients:
			print "unregistered client " + client.peerstr
			self.clients.remove(client)

	def broadcast(self, msg, room, exc):
		print "broadcasting message '%s' to members of room %s.." % (msg, room)
		for c in self.clients:
			if (c.room != None) and (c.room.name == room) and (c != exc):
				c.sendMessage(msg)

	def canJoin(self, user, password, room):
		if (room not in self.rooms):
			self.rooms[room] = DrawingRoom(room, (user, password), 1024, 768)
		if (not self.rooms[room].getUser(user)):
			self.rooms[room].addUser((user, password))

		return self.rooms[room].getUser(user)['password'] == password


if __name__ == '__main__':
	log.startLogging(sys.stdout)
	factory = PonyDrawServerFactory("ws://127.0.0.1:9000")
	listenWS(factory)
	reactor.run()
