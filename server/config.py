# -*- coding: utf-8 -*-
import os

from storage.FileStorage import FileStorage as storage
storageArgs = [os.path.dirname(__file__) + os.sep + os.pardir + os.sep + 'storage']

wsListenIP = 'ws://127.0.0.1:9000'

maxLayersPerUser = 5

logFile = open(os.path.dirname(__file__) + os.sep + os.pardir + os.sep + 'server.log', 'a')
# from sys import stdout as logFile
