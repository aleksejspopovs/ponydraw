class BaseStorage():
	def __init__(self):
		pass

	def open(self):
		pass

	def close(self):
		pass

	def saveRoom(self, room):
		raise Exception('Stub')

	def roomInStorage(self, roomName):
		raise Exception('Stub')

	def getRoom(self, roomName):
		raise Exception('Stub')
