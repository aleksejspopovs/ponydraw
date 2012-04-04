from storage.FileStorage import FileStorage as storage
storageArgs = ['../storage']

wsListenIP = 'ws://127.0.0.1:9000'

maxLayersPerUser = 5

# logFile = open('../server.log', 'a')
from sys import stdout as logFile
