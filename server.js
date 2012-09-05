var app			= require('http').createServer(onRequest);
var io			= require('socket.io').listen(app);
var nostat		= require('node-static');
var parser		= require('url');
var file		= new nostat.Server('./files', { cache: 0 });
var clients		= {};
var rooms		= {};
var messages	= {};
var msgCount	= 0;

app.listen(80);

rooms["Default"] = "";

function Client() {
	this.socket = undefined;
	this.room = rooms[0];
	this.nick = "Anon";
}

function Message() {
	this.id = 0;
	this.nick = "";
	this.timeStamp = "";
	this.msg = "";
	this.room = "";
}

/* Handles any http request that comes down the line. */
function onRequest(request, response) {
	if (parser.parse(request.url).query !== undefined) {
		request.url = "/";
	}
	//if the request is for /, change the request to index.htm
	if (request.url === "/") {
		request.url = "/index.htm";
	}
	request.addListener('end', function () {
		file.serve(request, response);
	});
}

/* A server receives:
 *
 * clientURL			The current URL of a client. This is the client's current room identifier
 * clientMessage		A chat message sent by a client
 * clientTyping			An alert that a client is typing
 * clientNotTyping		An alert that a client stopped typing
 * clientNick			A message with a new nickname that the server stores for a client
 * disconnect			A disconnection confirmation message
 *
 * A server sends:
 *
 * chatMessage			A chat message that goes out to every client in the current room
 * otherNickChange		A nickname update the goes out to every client in the current room
 * typingMessage		An alert to all in the room that this client is writing a message
 * stopTypingMessage	An alert to all in the room that this client stopped writing a message
 * nickMessage			A message to a new client with their generated nickname
 * clientLeave			An alert to all in the room that this client has left the room
 * clientJoin			An alert to all in the room that this client has joined the room
 * roomInfo				A message to the connected client with its current room
 * roomAdd				A message sent to all clients to add a room to their room lists
 * roomDel				A message sent to all clients to remove a room from their room lists
 *
 */

/* When a client connects, they need to be initialized as an object and supplied with
 * a generated nickname for use in the room.
 */
io.sockets.on('connection', function (socket) {
	var	currentRoom = rooms["Default"],
		client = new Client(),
		currentSockID = 0;
	//when a client connects, push it onto stack of connected clients
	client.socket = socket;
	currentSockID = socket.id;
	client.nick += currentSockID.substring(0, 7);
	clients[currentSockID] = client;
	//give this new client a generated nickname
	socket.emit('nickMessage', {data: client.nick});

	/* When a client reponds with its current URL, the query string acts as
	 * the current room for the client. The client is then given an updated list
	 * of active rooms as well as a history for their current room.
	 */
	socket.on('clientURL', function (clientData) {
		//parse the client's URL query
		var query = parser.parse(clientData.data).query;
		if (query !== undefined) {
			query = query.replace(/<\/?[^>]+(>|$)/g, "");
		}
		//return to the client what room they are in
		socket.emit('roomInfo', {data: query});
		//write a list of current rooms out to the client
		for (var x in rooms) {
			socket.emit('roomAdd', {data: rooms[x]});
		}
		//if there is a query...
		if (query !== undefined) {
			//and the query is for a nonexistent room
			if (rooms[query] === undefined) {
				//add the room to the room list
				rooms[query] = query;
				//tell all connected clients to add this new room
				for (var x in clients) {
					clients[x].socket.emit('roomAdd', {data: rooms[query]});
				}
			}
			currentRoom = rooms[query];
		}
		//update the client object with the current room information
		client.room = currentRoom;

		//send the client the room history
		for (var x in messages) {
			if (messages[x].room === currentRoom) {
				socket.emit('chatMessage', {data: messages[x]});
			}
		}

		//alert all clients in this room that this client has joined
		for (var x in clients) {
			if (clients[x].room === currentRoom) {
				clients[x].socket.emit('clientJoin', {nick: client.nick});
			}
		}
	});

	/* When a client sends a chat message, we send this message out
	 * to every client in the current room.
	 */
	socket.on('clientMessage', function (clientData) {
		//get the current time for recording purposes
		var time = new Date();
		//create the new message object
		var msg = new Message();
		//assign this message the next ID
		msg.id = msgCount++;
		msg.nick = clients[currentSockID].nick;
		msg.timeStamp = time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
		msg.msg = clientData.data.replace(/<\/?[^>]+(>|$)/g, "");
		msg.room = clients[currentSockID].room;
		messages[msg.id] = msg;
		//emit the message back to every client in the same room
		for (var x in clients) {
			if (clients[x].room === currentRoom) {
				clients[x].socket.emit('chatMessage', {data: msg});
			}
		}
	});

	/* When a client starts typing, the server alerts every other user in the room.
	 */
	socket.on('clientTyping', function (clientData) {
		var senderNick = clients[currentSockID].nick;
		//emit the message back to every client in the same room
		for (var x in clients) {
			if (clients[x].room === currentRoom && clients[x].nick !== senderNick) {
				clients[x].socket.emit('typingMessage', {nick: senderNick});
			}
		}
	});

	/* When a client stops typing, the server alerts every other user in the room.
	 */
	socket.on('clientNotTyping', function (clientData) {
		var senderNick = clients[currentSockID].nick;
		//emit the message back to every client in the same room
		for (var x in clients) {
			if (clients[x].room === currentRoom && clients[x].nick !== senderNick) {
				clients[x].socket.emit('stopTypingMessage', {nick: senderNick});
			}
		}
	});

	/* When a client changes its nickname, the server alerts every user in the room
	 * to the change. The nickname that the server has stored for the client is also
	 * updated.
	 */
	socket.on('clientNick', function (clientData) {
		//store the old and updated versions of the nickname
		var old = clients[currentSockID].nick;
		var update = clientData.data;
		//alert all clients in this room that this client has changed their nickname
		for (var x in clients) {
			if (clients[x].room === currentRoom) {
				clients[x].socket.emit('otherNickChange', {old: old, changed: update});
			}
		}
		//finally, change the nickname for this connected client
		clients[currentSockID].nick = update;
	});

	/* Called when a client disconnects, this function cleans up the serverside.
	 * First, the server removes the client from the connection list, then alerts
	 * all other clients in the room that client left. Then, if the room is now empty,
	 * remove the room from the server and alert all clients to remove it from their
	 * lists as well.
	 */
	socket.on('disconnect', function () {
		//get the nickname of the client who is leaving
		var senderNick = clients[currentSockID].nick;
		//delete this client from the list of connected clients
		delete clients[currentSockID];
		//alert all other clients in that room that this client has left
		for (var x in clients) {
			if (clients[x].room === currentRoom) {
				clients[x].socket.emit('clientLeave', {nick: senderNick});
			}
		}
		//only remove the room if it is not the default room
		if (currentRoom !== "") {
			//if the room is now empty, delete it from the list of rooms
			var inUse = false;
			for (var x in clients) {
				if (currentRoom === clients[x].room) {
					inUse = true;
				}
			}
			if(!inUse) {
				//remove the room from the server's room collection
				delete rooms[currentRoom];
				//alert all clients to remove it from their lists as well
				for (var x in clients) {
					clients[x].socket.emit('roomDel', {data: currentRoom});
				}
			}
		}
	});
});