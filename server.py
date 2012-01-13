import sys, json
from twisted.internet import reactor
from twisted.python import log
from autobahn.websocket import WebSocketServerFactory, WebSocketServerProtocol, listenWS
from hashlib import sha256
from cgi import escape

class DrawingRoom():
	def __init__(self, name, creator, w, h):
		self.name = name
		self.users = {
			creator[0]: {
				'password': creator[1],
				'mod': True
			}
		}
		self.width = w
		self.height = h

	def addUser(self, user):
		if (user[0] in self.users):
			return

		self.users[user[0]] = {
			'password': user[1],
			'mod': False
		}

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
		msg['width'] = self.width
		msg['height'] = self.height
		msg['users'] = [c for c in self.users]
		msg['layers'] = [
			{"id": 1, "name": 'layer1', 'isMine': True, 'zIndex': 1},
			{"id": 2, "name": 'layer2', 'isMine': True, 'zIndex': 2},
			{"id": 3, "name": 'layer3', 'isMine': False, 'zIndex': 3}
		]
		return json.dumps(msg)

	def isMod(self, user):
		try:
			return self.getUser(user)['mod']
		except AttributeError:
			return False

	def getAuthFailMessage(self, room):
		msg = {}
		msg['type'] = 'joinFailure'
		msg['room'] = room
		msg['error'] = 'Wrong password'
		return json.dumps(msg)


class BroadcastServerProtocol(WebSocketServerProtocol):
	def __init__(self):
		self.room = None
		self.name = None
		self.isMod = False

	def getJoinMessage(self):
		msg = {}
		msg['type'] = 'userJoined'
		msg['name'] = self.name
		msg['room'] = self.room.name
		msg['mod'] = self.isMod
		return json.dumps(msg)

	def getLeaveMessage(self):
		msg = {}
		msg['type'] = 'userLeft'
		msg['name'] = self.name
		msg['room'] = self.room.name
		return json.dumps(msg)

	def getChatMessage(self, text):
		msg = {}
		msg['type'] = 'chat'
		msg['name'] = self.name
		msg['msg'] = text
		return json.dumps(msg)

	def onOpen(self):
		self.factory.register(self)

	def onMessage(self, msg, binary):
		if binary:
			return

		message = json.loads(msg)
		for i in message:
			if (type(message[i]) == str) or (type(message[i]) == unicode):
				message[i] = escape(message[i])

		if (message['type'] == 'register'):
			if self.factory.canJoin(message['name'], sha256(message['password']).hexdigest(), message['room']):
				self.room = self.factory.rooms[message['room']]
				self.name = message['name']
				self.isMod = self.room.isMod(self.name)
				self.factory.broadcast(self.getJoinMessage(), self.room, self)
				self.sendMessage(self.room.getRoomInfo(self.name))
			else:
				self.sendMessage(self.factory.getAuthFailMessage(message['room']))
				self.sendClose()
		elif (message['type'] == 'chat'):
			print self.name,':',message['msg']
			self.factory.broadcast(self.getChatMessage(message['msg']), self.room.name, None)
		elif (message['type'] == 'line'):
			self.factory.broadcast(msg, self.room, self)


	def connectionLost(self, reason):
		WebSocketServerProtocol.connectionLost(self, reason)
		self.factory.unregister(self)


class BroadcastServerFactory(WebSocketServerFactory):
	protocol = BroadcastServerProtocol

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
			if (client.room != None):
				self.broadcast(client.getLeaveMessage(), client.room, client)
			self.clients.remove(client)

	def broadcast(self, msg, room, exc):
		print "broadcasting message '%s' to members of room %s.." % (msg, room)
		for c in self.clients:
			if (c.room.name == room) and (c != exc):
				c.sendMessage(msg)

	def canJoin(self, user, password, room):
		if (room not in self.rooms):
			self.rooms[room] = DrawingRoom(room, (user, password), 1024, 768)
		if (not self.rooms[room].getUser(user)):
			self.rooms[room].addUser((user, password))

		return self.rooms[room].getUser(user)['password'] == password


if __name__ == '__main__':
	log.startLogging(sys.stdout)
	factory = BroadcastServerFactory("ws://localhost:9000")
	listenWS(factory)
	reactor.run()
