Overview
========

PonyDraw is an online multiuser WebSockets based drawing application. The key feature of PonyDraw is support for many layers, just like in any professional drawing application.

Features
========
- support for many drawing rooms (creatable by users themselves) with no limit on the amount of users in a room
- support for multiple layers in a room
	- layers protect you work from vandals, while still allowing random people to join and draw together with you
	- layers make your work more convenient
- a chat in every room for communication between users
- keyboard shortcuts
- permanent server-side room & layer storage

Client
======

PonyDraw client (located in the `client` directory in this repository) is a HTML+JavaScript application that doesn't require any dynamic content and can be served using any web server software (for example, nginx). PonyDraw client uses WebSockets and <canvas>, so a modern browser is required to use it.

Keyboard shortcuts
------------------

- permanent tool choice shortcuts
	- `p` changes your current tool to the pencil
	- `c` changes your current tool to the color picker
	- `e` changes your current tool to the eraser
- temporary tool choice modificators (those only work when your current tool is the pencil)
	- `Shift` changes your current tool to the color picker
	- `Ctrl` (`Cmd` on Mac) changes your current tool to the eraser
- other drawing-related shortcuts
	- `[` decreases current line thickness by 1
	- `]` increases current line thickness by 1
- UI-related shortcuts
	- `q` shows/hides chat panel
	- `w` shows/hides tools panel

Server
======

PonyDraw server (located in the `server` directory in this repository) is a Python application using Twisted and Autobahn. Python 2.7 compatibility is guaranteed, Python 3 might not work.

Configuration & usage
---------------------

All server-related configuration should be made in file `server/config.py`. Most of the variables there should be self-explainatory, and I'm too lazy to describe them here anyway. To launch the server, simply type `python ./server/server.py` in your command line (you might have to do this as root on some OSs).
