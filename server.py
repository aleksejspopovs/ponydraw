import sys, json
from twisted.internet import reactor
from twisted.python import log
from autobahn.websocket import WebSocketServerFactory, WebSocketServerProtocol, listenWS
from hashlib import sha256
from cgi import escape

class BroadcastServerProtocol(WebSocketServerProtocol):
	def __init__(self):
		self.room = None
		self.name = None
		self.isMod = False

	def getJoinMessage(self):
		msg = {}
		msg['type'] = 'userJoined'
		msg['name'] = self.name
		msg['room'] = self.room
		msg['mod'] = self.isMod
		return json.dumps(msg)

	def getLeaveMessage(self):
		msg = {}
		msg['type'] = 'userLeft'
		msg['name'] = self.name
		msg['room'] = self.room
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

		#print message
		if (message['type'] == 'register'):
			if self.factory.canJoin(message['name'], sha256(message['password']).hexdigest(), message['room']):
				self.room = message['room']
				self.name = message['name']
				self.isMod = self.factory.isMod(self.name, self.room)
				self.factory.broadcast(self.getJoinMessage(), self.room, self)
				self.sendMessage(self.factory.getRoomInfo(self.room, self.isMod))
			else:
				self.sendMessage(self.factory.getAuthFailMessage(message['room']))
				self.sendClose()
		elif (message['type'] == 'chat'):
			print self.name,':',message['msg']
			self.factory.broadcast(self.getChatMessage(message['msg']), self.room, None)
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
			if (c.room == room) and (c != exc):
				c.sendMessage(msg)

	def isMod(self, user, room):
		try:
			return self.rooms[room]['users'][user]['mod']
		except KeyError:
			return False

	def canJoin(self, user, password, room):
		if (room not in self.rooms):
			self.rooms[room] = {
				"users": {user: { "password": password, "mod": True }}
			}
		if (user not in self.rooms[room]['users']):
			self.rooms[room]['users'][user] = { "password": password, "mod": False }

		return self.rooms[room]['users'][user]['password'] == password

	def getAuthFailMessage(self, room):
		msg = {}
		msg['type'] = 'joinFailure'
		msg['room'] = room
		msg['error'] = 'Wrong password'
		return json.dumps(msg)

	def getRoomInfo(self, room, mod):
		msg = {}
		msg['type'] = 'joinSuccess'
		msg['room'] = room
		msg['mod'] = mod
		msg['width'] = 640
		msg['height'] = 480
		msg['users'] = [c.name for c in self.clients if c.room == room]
		return json.dumps(msg)


if __name__ == '__main__':
	log.startLogging(sys.stdout)
	factory = BroadcastServerFactory("ws://localhost:9000")
	listenWS(factory)
	reactor.run()