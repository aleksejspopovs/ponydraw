# -*- coding: utf-8 -*-
# © 2012 Aleksejs Popovs <me@popoffka.ru>
# Licensed under MIT License. See ../LICENSE for more info.

from BaseStorage import BaseStorage
try:
	import cPickle as pickle
except ImportError:
	import pickle
import os

class FileStorage(BaseStorage):
	def __init__(self):
		self.path = None
		self.isOpen = False
		BaseStorage.__init__(self)

	def open(self, path):
		if self.isOpen:
			raise Exception('I\'m already open')

		self.path = path
		try:
			os.listdir(self.path)
		except:
			try:
				os.makedirs(self.path)
			except:
				raise Exception('Couldn\'t access/create specified directory')

		if '.lock' in os.listdir(self.path):
			raise Exception('Directory seems to be locked')
		else:
			try:
				lock = open(self.path + os.sep + '.lock', 'w')
				lock.write('ponydraw')
				lock.close()
			except IOError:
				raise Exception('No write access to the directory')

		self.isOpen = True

	def close(self):
		if not self.isOpen:
			raise Exception('FileStorage is not open')

		os.remove(self.path + os.sep + '.lock')
		self.isOpen = False

	def roomInStorage(self, roomName):
		if not self.isOpen:
			raise Exception('FileStorage is not open')

		return (roomName + os.extsep + 'pdd') in os.listdir(self.path)

	def saveRoom(self, room):
		if not self.isOpen:
			raise Exception('FileStorage is not open')

		f = open(self.path + os.sep + room.name + os.extsep + 'pdd', 'wb')
		pickle.dump(room, f, -1)

	def getRoom(self, roomName):
		if not self.isOpen:
			raise Exception('FileStorage is not open')

		if not self.roomInStorage(roomName):
			raise Exception('No such room in storage')

		f = open(self.path + os.sep + roomName + os.extsep + 'pdd', 'rb')
		return pickle.load(f)

