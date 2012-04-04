import sys, json
import config
from twisted.internet import reactor
from twisted.python import log
from autobahn.websocket import WebSocketServerFactory, WebSocketServerProtocol, listenWS
from hashlib import sha256
from cgi import escape

from entities.room import DrawingRoom

from storage.FileStorage import FileStorage

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

	def onMessage(self, raw, binary):
		if binary:
			return

		message = json.loads(raw)
		for i in message:
			if isinstance(message[i], basestring):
				message[i] = escape(message[i])

		if (message['type'] != 'line'):
			print message

		if (message['type'] == 'register'):
			if self.factory.canJoin(message['name'], sha256(message['password']).hexdigest(), message['room']):
				self.room = self.factory.rooms[message['room']]
				self.name = message['name']
				self.factory.broadcast(self.room.setOnline(self.name, True), self.room.name, self)
				self.sendMessage(json.dumps(dict(self.room.getRoomInfo(self.name).items() + {'name': self.name}.items())))
				for i in self.room.layers:
					msg = {}
					msg['type'] = 'bunch'
					msg['contents'] = []
					for j in self.room.layers[i].history:
						msg['contents'].append(json.loads(j))
					self.sendMessage(json.dumps(msg))
			else:
				self.sendMessage(self.factory.getAuthFailMessage(message['room']))
				self.sendClose()
		elif (message['type'] == 'chat'):
			if (not self.room):
				return

			if message['msg'].startswith('/'):
				command = message['msg'][1:].split()[0]
				options = (len(message['msg'][1:].split()) > 1 and message['msg'][1:].split()[1]) or ''
				if (command == 'me'):
					msg = {}
					msg['type'] = 'announcement'
					msg['msg'] = '* ' + self.name + ' ' + options
					self.factory.broadcast(json.dumps(msg), self.room.name, None)
				elif (command == 'passwd'):
					self.room.changePassword(self.name, sha256(options).hexdigest())
					msg = {}
					msg['type'] = 'announcement'
					msg['msg'] = 'Your password was successfully changed.'
					self.sendMessage(json.dumps(msg))
			else:
				self.factory.broadcast(self.getChatMessage(message['msg']), self.room.name, None)
		elif (message['type'] == 'line'):
			if (self.room) and (self.room.canDrawOn(self.name, message['opts']['layer'])):
				self.room.addToHistory(raw, message['opts']['layer'])
				self.factory.broadcast(raw, self.room.name, self)
		elif (message['type'] == 'newLayer'):
			res = self.room.addLayer(self.name)
			if res:
				self.factory.broadcastDynamic(lambda user: json.dumps(dict(res.getDescription(user).items() + {'type': 'newLayer'}.items())), self.room.name, None)
			else:
				self.sendMessage(self.getNewLayerFailMessage())
		elif (message['type'] == 'removeLayer'):
			res = self.room.removeLayer(message['id'], self.name)
			if res:
				self.factory.broadcastDynamic(lambda user: json.dumps(dict(res.getDescription(user).items() + {'type': 'removeLayer', 'who': self.name}.items())), self.room.name, None)
		elif (message['type'] == 'swapLayers'):
			res = self.room.swapLayers(message['aId'], message['bId'], self.name)
			if res:
				for i in res:
					self.factory.broadcast(json.dumps(i), self.room.name, None)
				self.factory.broadcast(raw, self.room.name, None)

	def connectionLost(self, reason):
		WebSocketServerProtocol.connectionLost(self, reason)
		if self.room:
			self.factory.broadcast(self.room.setOnline(self.name, False), self.room.name, self)
			if self.room.empty():
				self.factory.roomEmpty(self.room.name)
		self.factory.unregister(self)


class PonyDrawServerFactory(WebSocketServerFactory):
	protocol = PonyDrawServerProtocol

	def __init__(self, url, storage, storageArgs):
		WebSocketServerFactory.__init__(self, url)
		self.clients = []
		self.rooms = {}
		self.storage = storage()
		self.storage.open(*storageArgs)

	def stopFactory(self):
		for room in self.rooms:
			self.storage.saveRoom(self.rooms[room])
		for client in self.clients:
			self.clients.remove(client)
		self.storage.close()

	def register(self, client):
		if not client in self.clients:
			print "registered client " + client.peerstr
			self.clients.append(client)

	def unregister(self, client):
		if client in self.clients:
			print "unregistered client " + client.peerstr
			self.clients.remove(client)

	def broadcast(self, msg, room, exc):
		for c in self.clients:
			if (c.room != None) and (c.room.name == room) and (c != exc):
				c.sendMessage(msg)

	def broadcastDynamic(self, msg, room, exc):
		for c in self.clients:
			if (c.room != None) and (c.room.name == room) and (c != exc):
				c.sendMessage(msg(c.name))

	def canJoin(self, user, password, room):
		if room not in self.rooms:
			if self.storage.roomInStorage(room):
				self.rooms[room] = self.storage.getRoom(room)
			else:
				self.rooms[room] = DrawingRoom(room, (user, password), 1024, 768)
		if not self.rooms[room].getUser(user):
			self.rooms[room].addUser((user, password))

		return self.rooms[room].getUser(user)['password'] == password

	def roomEmpty(self, room):
		if (self.storage.isOpen):
			self.storage.saveRoom(self.rooms[room])
		del self.rooms[room]

	def getAuthFailMessage(self, room):
		msg = {}
		msg['type'] = 'joinFailure'
		msg['room'] = room
		msg['error'] = 'Wrong password'
		return json.dumps(msg)


if __name__ == '__main__':
	log.startLogging(config.logFile)
	factory = PonyDrawServerFactory(config.wsListenIP, config.storage, config.storageArgs)
	listenWS(factory)
	reactor.run()
