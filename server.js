var app					= require('http').createServer(onRequest);
var io					= require('socket.io').listen(app);
var nostat				= require('node-static');
var parser				= require('url');
var file				= new nostat.Server('./files', { cache: 0 });
var clients 			= {};

app.listen(80);

function Client() {
	this.socket = undefined;
	this.room = "default";
	this.nick = "Anonymous";
}

/* Handles any http request that comes down the line. */
function onRequest(request, response) {
	if(parser.parse(request.url).query != undefined) {
		request.url = "/";
	}
	//if the request is for /, change the request to index.htm
	if(request.url === "/")
		request.url = "/index.htm";
	request.addListener('end', function () {
		file.serve(request, response);
	});
}

io.sockets.on('connection', function (socket) {
	//when a client connects, push it onto stack of connected clients
	var room = "default";
	var client = new Client();
	client.socket = socket;
	clients[client.socket.id] = client;
	
	//the initial message from the client with the current URL
	socket.on('clientURL', function (clientData) {
		var query = parser.parse(clientData.data).query;
		if(query != undefined) {
			room = query;
		}
		client.room = room;
	});

	//the server receives a message from a client
	socket.on('clientMessage', function (clientData) {
		var senderNick = clients[socket.id].nick;
		//emit the message back to every client in the same room
		for(var x in clients) {
			if(clients[x].room === room) {
				clients[x].socket.emit('serverMessage', {data: clientData.data, nick: senderNick});
			}
		}
	});

	//the server receives a nickname from a client
	socket.on('clientNick', function (clientData) {
		clients[socket.id].nick = clientData.data;
	});

	socket.on('disconnect', function () {
		delete clients[socket.id];
	});
});