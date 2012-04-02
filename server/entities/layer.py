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
