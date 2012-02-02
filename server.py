import sys, json
from twisted.internet import reactor
from twisted.python import log
from autobahn.websocket import WebSocketServerFactory, WebSocketServerProtocol, listenWS
from hashlib import sha256
from cgi import escape

MAX_LAYERS_PER_USER = 5

class Layer():
	def __init__(self, owner, room, id, name, zIndex):
		self.owner = owner
		self.room = room
		self.id = id
		self.name = name
		self.zIndex = zIndex
		self.history = []

	def belongsTo(self, someone):
		return self.owner == someone

	def canModerate(self, someone):
		return self.owner == someone

	def canDraw(self, someone):
		return self.owner == someone

	def addToHistory(self, msg):
		self.history.append(msg)

	def getDescription(self, someone):
		return {
			'id': self.id,
			'name': self.name,
			'zIndex': self.zIndex,
			'canDraw': self.canDraw(someone),
			'canModerate': self.canModerate(someone) or self.room.users[someone]['mod']
		}

class PublicLayer(Layer):
	def belongsTo(self, someone):
		return False

	def canModerate(self, someone):
		return False

	def canDraw(self, someone):
		return True

class DrawingRoom():
	def __init__(self, name, creator, w, h):
		self.name = name
		self.users = {}
		self.layers = {}
		self.layersW = 2
		self.width = w
		self.height = h

		self.addUser(creator, True)
		self.layers[1] = PublicLayer('', self, 1, 'Public layer', 1)

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
			if self.layers[i].belongsTo(owner):
				c += 1
				if (c >= MAX_LAYERS_PER_USER):
					return False

		self.layers[self.layersW] = Layer(owner, self, self.layersW, owner + ' ' + str(self.layersW), self.layersW)
		self.layersW += 1
		return self.layers[self.layersW - 1]

	def removeLayer(self, id, user):
		try:
			self.layers[id]
		except KeyError:
			return False

		if self.users[user]['mod'] or self.layers[id].canModerate(user):
			rip = self.layers[id]
			del self.layers[id]
			return rip
		else:
			return False

	def swapLayers(self, aId, bId, user):
		try:
			self.layers[aId]
			self.layers[bId]
		except KeyError:
			return False

		if self.users[user]['mod'] or self.layers[aId].canModerate(user) or self.layers[bId].canModerate(user):
			res = []
			tmp = self.layers[aId].zIndex
			self.layers[aId].zIndex = self.layers.zIndex
			res.append({
				'type': 'changeZIndex',
				'id': aId,
				'zIndex': self.layers[bId]['zIndex']
			})
			self.layers[bId].zIndex = tmp
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
		msg['layers'] = []
		for i in self.layers:
			msg['layers'].append(self.layers[i].getDescription(user))
		return json.dumps(msg)

	def isMod(self, user):
		try:
			return self.getUser(user)['mod']
		except AttributeError:
			return False

	def canDrawOn(self, user, layer):
		try:
			return self.layers[layer].canDraw(user)
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

	def addToHistory(self, msg, layer):
		self.layers[layer].addToHistory(msg)


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
				self.sendMessage(dict(self.room.getRoomInfo(self.name.items()) + {'name': self.name}))
				for j in self.room.layers[i].history:
					msg = {}
					msg['type'] = 'bunch'
					msg['contents'] = []
					for i in self.room.layers:
						msg['contents'].append(json.loads(j))
					self.sendMessage(json.dumps(msg))
			else:
				self.sendMessage(self.factory.getAuthFailMessage(message['room']))
				self.sendClose()
		elif (message['type'] == 'chat'):
			if (self.room):
				self.factory.broadcast(self.getChatMessage(message['msg']), self.room.name, None)
		elif (message['type'] == 'line'):
			if (self.room) and (self.room.canDrawOn(self.name, message['opts']['layer'])):
				self.room.addToHistory(msg, message['opts']['layer'])
				self.factory.broadcast(msg, self.room.name, self)
		elif (message['type'] == 'newLayer'):
			res = self.room.addLayer(self.name)
			if (res):
				self.factory.broadcastDynamic(lambda user: json.dumps(dict(res.getDescription(user).items() + {'type': 'newLayer'}.items())), self.room.name, None)
			else:
				self.sendMessage(self.getNewLayerFailMessage())
		elif (message['type'] == 'removeLayer'):
			res = self.room.removeLayer(message['id'], self.name)
			if (res):
				self.factory.broadcastDynamic(lambda user: json.dumps(dict(res.getDescription(user).items() + {'type': 'removeLayer', 'who': self.name}.items())), self.room.name, None)
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

	def broadcastDynamic(self, msg, room, exc):
		print "broadcasting dynamic message to members of room %s.." % (room)
		for c in self.clients:
			if (c.room != None) and (c.room.name == room) and (c != exc):
				c.sendMessage(msg(c.name))

	def canJoin(self, user, password, room):
		if (room not in self.rooms):
			self.rooms[room] = DrawingRoom(room, (user, password), 1024, 768)
		if (not self.rooms[room].getUser(user)):
			self.rooms[room].addUser((user, password))

		return self.rooms[room].getUser(user)['password'] == password

	def getAuthFailMessage(self, room):
		msg = {}
		msg['type'] = 'joinFailure'
		msg['room'] = room
		msg['error'] = 'Wrong password'
		return json.dumps(msg)


if __name__ == '__main__':
	log.startLogging(sys.stdout)
	factory = PonyDrawServerFactory("ws://127.0.0.1:9000")
	listenWS(factory)
	reactor.run()
