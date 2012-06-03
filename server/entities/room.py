# © 2012 Aleksejs Popovs <me@popoffka.ru>
# Licensed under MIT License. See ../LICENSE for more info.

import json, sys
sys.path.append('../')
import config
from entities.layer import *

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
				if (c >= config.maxLayersPerUser):
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
			self.layers[aId].zIndex = self.layers[bId].zIndex
			res.append({
				'type': 'changeZIndex',
				'id': aId,
				'zIndex': self.layers[bId].zIndex
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
		return msg

	def changePassword(self, user, new):
		self.users[user]['password'] = new

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

	def empty(self):
		for user in self.users:
			if (self.users[user]['online']):
				return False
		return True

	def addToHistory(self, msg, layer):
		self.layers[layer].addToHistory(msg)
